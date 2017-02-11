const config = require('config');
const co = require('co');
const Pageres = require('pageres');
const _ = require('lodash');
const moment = require('moment');
const qiniu = require("qiniu");
const Page = require('../model').Page;
const Snapshot = require('../model').Snapshot;
const logger = require('../utils').getLogger('snapshot');
const path = require('path');

const maxConcurrentCallsPerWorker = config.maxConcurrentCallsPerWorker || 1;
const RETRY_TIME = 3; // 重试次数
const failureLockTime = 6; // 抓取失败后锁定几小时后才能再次抓取
const successLockTime = 2; // 抓取成功后锁定几小时后才能再次抓取
/**
 * 上传图片到七牛
 */
qiniu.conf.ACCESS_KEY = config.qiniu.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.qiniu.SECRET_KEY;
var bucketname = config.qiniu.bucketname;

// 上传图片到 七牛
const uploadFile = function (filename) {
	let putPolicy = new qiniu.rs.PutPolicy(bucketname);
	let uptoken = putPolicy.token();
	let extra = new qiniu.io.PutExtra();
	let localFile = path.join(__dirname, '../snapshot/' + filename);
	return new Promise(function(resolve, reject) {
		qiniu.io.putFile(uptoken, filename, localFile, extra, function(err, ret) {
			/* istanbul ignore if */
			if (err && err.code === 614 && err.error === 'file exists') {
				var imageURL = config.qiniu.domain + filename;
				resolve(imageURL);
			} else if (err) {
				reject(errorWrapper({
					errcode: 40081,
					errmsg: '上传文件失败，请重新上传'
				}));
			} else {
				var imageURL = config.qiniu.domain + filename;
				resolve(imageURL);
			}
		});
	});
};

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

	yield pageres.src(url, size, options)
		.dest(path.join(__dirname, '../snapshot'))
		.run()
		.then(function(ret) {
			return filename;
		});

	let qiniuUrl = yield uploadFile(filename + '.png');
 	return Promise.resolve(qiniuUrl);
}

// 递归抓取页面并保存快照
const recurrence = function *(pid) {
	let dateStr = moment().format('YYYYMMDD');
	let nowTime = _.now();
	let id, page, retryTimes;
	let doc = yield Page.findOneAndUpdate({
		del: false,
		createdTime: { $lt: nowTime },
		status: { $in: ['normal', 'exception'] },
		retryTimes: { $lt: RETRY_TIME },
		canFetchTime: { $lt: nowTime }
	}, {
		status: 'fetching'
	});
	if (!doc) {
		return Promise.resolve('done');
	}
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
		} else {
			// 记录快照 url
			yield Snapshot.create({
				pid: id,
				url: ret,
				createdTime: nowTime
			});
			// 修改 page 状态
			yield Page.findOneAndUpdate({
				_id: id
			}, {
				status: 'normal',
				image: ret,
				lastFetchTime: Date.now(),
				canFetchTime: moment().add(successLockTime, 'hours').valueOf(),
				retryTimes: 0
			});
			logger.info('进程 %s 抓取页面成功 id: %s page: %s url: %s', pid, id, page, ret);
		}
	} catch(err) {
		console.log(err);
		logger.error('进程 %s 抓取页面失败 id: %s page: %s error: %s', pid, id, page, err.message);
		var updateDoc = {
			status: 'exception',
			$inc: {
				retryTimes: 1
			}
		};
		if (retryTimes >= 2) {
			var updateDoc = {
				status: 'exception',
				canFetchTime: moment().add(failureLockTime, 'hours').valueOf(),
				retryTimes: 0
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
