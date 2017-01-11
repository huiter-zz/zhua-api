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
const recurrence = function *(time, pid) {
	let dateStr = moment(time).format('YYYYMMDD');
	let nowTime = _.now();
	let oldLastFetchTime, id, page;
	let doc = yield Page.findOneAndUpdate({
		del: false,
		lastFetchTime: {
			$lt: time
		},
		createdTime: {
			$lt: time
		}
	}, {
		lastFetchTime: nowTime
	});
	if (!doc) {
		logger.warn('进程 %s 抓取页面完成', pid);
		return Promise.resolve('done');
	}
	try {
		doc = doc.toJSON();
		oldLastFetchTime = doc.lastFetchTime;
		id = doc.id;
		page = doc.page;
		let filename = id + '_' + dateStr;
		logger.info('进程 %s 开始抓取页面 id: %s page: %s', pid, id, page);
		let ret = yield fetch(filename, page, doc.setting);

		if (ret === 'failure') {
			logger.error('进程 %s 抓取页面失败 id: %s page: %s', pid, id, page);
		} else {
			yield Snapshot.create({
				pid: id,
				url: ret,
				createdTime: nowTime
			});
			logger.info('进程 %s 抓取页面成功 id: %s page: %s url: %s', pid, id, page, ret);
		}
	} catch(err) {
		console.log(err);
		logger.error('进程 %s 抓取页面失败 id: %s page: %s error: %s', pid, id, page, err.message);
		yield Page.findOneAndUpdate({
			_id: id
		}, {
			lastFetchTime: oldLastFetchTime
		});
	}
	return yield recurrence(time, pid);
};

const main = function *(time, pid) {
	let ret = yield recurrence(time, pid);
};

module.exports = function (time, callback) {
	co(function *(time) {
		var pid = process.pid;
		logger.info('进程 %s 开始执行...', pid);
		var workers = [];
		for (var i = 0; i < maxConcurrentCallsPerWorker; i++) {
			workers.push(main(time, pid))
		}
		yield workers;
		logger.info('进程 %s 抓取页面完毕', pid);
		callback(null, pid);
	}.bind(null, time));
};
