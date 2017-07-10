const fs = require('fs');
const path = require('path');
const config = require('config');
const co = require('co');
const Pageres = require('pageres');
const _ = require('lodash');
const moment = require('moment');
const qiniu = require("qiniu");
const Page = require('../model').Page;
const Snapshot = require('../model').Snapshot;
const Property = require('../model').Property;
const Log = require('../model').Log;
const utils = require('../utils');
const logger = utils.getLogger('snapshot');
const errorWrapper = utils.errorWrapper;
const uploadFile = utils.uploadFile;

const maxConcurrentCallsPerWorker = config.maxConcurrentCallsPerWorker || 1;
const RETRY_TIME = config.RETRY_TIME || 3; // 重试次数
const failureLockTime = config.failureLockTime || 0.5; // 抓取失败后锁定几小时后才能再次抓取
const successLockTime = config.successLockTime || 2; // 抓取成功后锁定几小时后才能再次抓取
const nextDayClearLock = true; // 第二天后清除所有锁定 
const oneDayOneTimes = true; // 针对同一连接，一天只抓取一次（成功抓取到图片）

/**
 * 上传图片到七牛
 */
qiniu.conf.ACCESS_KEY = config.qiniu.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.qiniu.SECRET_KEY;
var bucketname = config.qiniu.bucketname;
const perLinkPrice = config.perLinkPrice || 3; // 每天每个连接扣费 3 分

const consume = function *(uid, page, target) {
	return Property.update({
		user:uid,
		gift: {
			$gt: perLinkPrice
		}
	}, {
		$inc: {
			gift: -perLinkPrice
		}
	}).then(function(ret) {
		if (!ret || !ret.n) {
			return Property.update({
				user:uid
			}, {
				$inc: {
					cash: -perLinkPrice
				}				
			})
		} else {
			return 'success';
		}
	}).then(function(ret) {
		if (ret === 'success') {
			return Log.create({
				user: uid,
				type: Log.types('consume'),
				data: {
					page: page,
					target: target,
					gift: -perLinkPrice
				}				
			});
			logger.info('扣费成功 %s page %s target %s', uid, page ,target);
		} else if (ret && ret.n) {
			return Log.create({
				user: uid,
				type: Log.types('consume'),
				data: {
					page: page,
					target: target,
					cash: -perLinkPrice
				}				
			})
			logger.info('扣费成功 %s page %s target %s', uid, page ,target);
		} else {
			logger.warn('扣费异常 %s page %s target %s', uid, page ,target);
			return null;
		}
	}).catch(function(err) {
		logger.warn('扣费异常 %s page %s target %s error %s', uid, page ,target, err.message);
		return err;
	})
}

const fetch = function *(filename, url, setting) {
	setting = setting || {};
	let size = _.isEmpty(setting.size) ? ['1024x768'] : setting.size;
	let options = {
		delay: +setting.delay || 1
	};
	options.filename = filename;
	const pageres = new Pageres({
		delay: 1,
		timeout: 120,
		format: 'png'
	});
	let ret = yield pageres.src(url, size, options)
		.dest(path.join(__dirname, '../snapshot'))
		.run()
		.then(function(ret) {
			return uploadFile(filename + '.png');
		});

	return ret;
}

// 递归抓取页面并保存快照
const recurrence = function *(pid) {
	let dateStr = moment().format('YYYYMMDD');
	let nowTime = _.now();
	let todayStartTime = moment().startOf('day').valueOf();
	let todayEndTime = moment().endOf('day').valueOf();
	let _hour = moment(nowTime).hour();
	let _minute = moment(nowTime).minute();
	let id, page, retryTimes;
	let condition = {
		del: false,
		createdTime: { $lt: nowTime },
		'expectFetchTime.hour': {$lte: _hour},
		'expectFetchTime.minute': {$lte: _minute},
		status: { $in: ['normal', 'exception'] },
		retryTimes: { $lt: RETRY_TIME },
		canFetchTime: { $lt: nowTime }
	};
	if (oneDayOneTimes) {
		condition['$or'] = [
			{
				lastFetchTime: {
					$exists: false
				}
			},
			{
				lastFetchTime: {
					$lt: todayStartTime
				}
			}
		]
	}

	let doc = yield Page.findOneAndUpdate(condition, {
		startFetchTime: nowTime,
		status: 'fetching'
	});
	if (!doc) {
		return Promise.resolve('done');
	}
	let uid = doc.user;
	try {
		doc = doc.toJSON();
		retryTimes = doc.retryTimes;
		id = doc.id;
		page = doc.page;
		let filename = id + '_' + dateStr;
		logger.info('进程 %s 开始抓取页面 id: %s page: %s', pid, id, page);
		let ret = yield fetch(filename, page, doc.setting);

		if (ret === 'failure') {
			logger.error('进程 %s 抓取页面失败 id: %s page: %s', pid, id, page);
			throw new Error('failure');
		} else {
			// 记录快照 url
			yield Snapshot.create({
				pid: id,
				url: ret,
				createdTime: nowTime
			});
			// 修改 page 状态
			let nextCanFetchTime = moment().add(successLockTime, 'hours').valueOf();
			if (nextDayClearLock && todayEndTime < nextCanFetchTime) {
				nextCanFetchTime = todayEndTime + 1;
			}
			yield Page.findOneAndUpdate({
				_id: id
			}, {
				$set: {
					status: 'normal',
					image: ret,
					lastFetchTime: Date.now(),
					canFetchTime: nextCanFetchTime,
					retryTimes: 0
				},
				$unset: {
					exception: true
				}
			});

			// 扣费
			try {
				yield consume(uid, page, ret);
			}catch(e){}

			logger.info('进程 %s 抓取页面成功 id: %s page: %s url: %s', pid, id, page, ret);
		}
	} catch(err) {
		console.log(err);
		logger.error('进程 %s 抓取页面失败 id: %s page: %s error: %s', pid, id, page, err.message);
		var updateDoc = {
			status: 'exception',
			$inc: {
				retryTimes: 1
			},
			exception: {
				info: err.message || err
			}
		};
		if (retryTimes >= 2) {
			let nextCanFetchTime = moment().add(failureLockTime, 'hours').valueOf();
			if (nextDayClearLock && todayEndTime < nextCanFetchTime) {
				nextCanFetchTime = todayEndTime + 1;
			}
			var updateDoc = {
				status: 'exception',
				canFetchTime: nextCanFetchTime,
				retryTimes: 0,
				exception: {
					info: err.message || err
				}
			};
		}
		yield Page.findOneAndUpdate({
			_id: id
		}, updateDoc);
	}
	return yield recurrence(pid);
};

const test = function() {
	return Promise.resolve(1);
}

const main = function *(pid) {
	let ret = yield recurrence(pid);
};

module.exports = function (callback) {
	co(function *() {
		var pid = process.pid;
		logger.warn('进程 %s 开始执行...', pid);
		var workers = [];
		for (var i = 0; i < maxConcurrentCallsPerWorker; i++) {
			workers.push(main(pid))
		}
		yield workers;
		logger.warn('进程 %s 抓取页面完毕', pid);
		callback(null, pid);
	});
};
