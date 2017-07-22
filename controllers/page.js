const _ = require('lodash');
const moment = require('moment');
const Pageres = require('pageres');
const co = require('co');
const Page = require('../model').Page;
const Snapshot = require('../model').Snapshot;
const Log = require('../model').Log;
const path = require('path');
const utils = require('../utils');
const errorWrapper = utils.errorWrapper;
const uploadFile = utils.uploadFile;
const logger = utils.getLogger('pageCtrl');
const wsServer = require('../service/ws');

const urlReg = /^((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;
const tagArrayLengthLimit = 5;
const tagStringLengthLimit = 20;
const pageDataCheck = function *(data, isUpdate) {
	if (!isUpdate && !urlReg.test(data.page)) {
        return Promise.reject(errorWrapper({
            errcode: 40021,
            errmsg: '页面地址不正确，必须是以 http 或 https 开头的页面地址。比如：http://www.baidu.com'
        }));		
	}

	if (data.tags && data.tags.length > tagArrayLengthLimit) {
        return Promise.reject(errorWrapper({
            errcode: 40022,
            errmsg: '页面标签数量不能超过 ' + tagArrayLengthLimit + ' 个'
        }));
	}

	if (!data.title || data.title.length > 50) {
        return Promise.reject(errorWrapper({
            errcode: 40027,
            errmsg: '页面标题不能为空，长度不能大于 50 位'
        }));
	}

	let errmsg = '';
	_.find(data.tags, function (item) {
		if (!_.isString(item) && !_.isNumber(item)) {
			errmsg = '标签内容只能是 String 或者 Number 类型';
			return true; 
		} else if (item.toString().length > tagStringLengthLimit) {
			errmsg = '标签内容长度不能超过 ' + tagStringLengthLimit + ' 个字符';
			return true;
		} else {
			return false;
		}
	});
	if (errmsg) {
        return Promise.reject(errorWrapper({
            errcode: 40023,
            errmsg: errmsg
        }));		
	}


	if (data.setting && data.setting.size) {
		let size = data.setting.size;
		if (_.isString(size)) size = [size];
		let size_err;
		_.each(size, function(s) {
			if (!s.split) {
				size_err = errorWrapper({
					errcode: 40025,
					errmsg: '页面配置 size 格式不合法，格式应该为 1920x780 样式'
				});
			} else {
				let sizeArr = s.split('x');
				if (sizeArr.length !== 2 || (!+sizeArr[0] || !+sizeArr[1])) {
					size_err = errorWrapper({
						errcode: 40025,
						errmsg: '页面配置 size 格式不合法，格式应该为 1920x780 样式'
					});
				}
			}
		});
		if (size_err) {
			return Promise.reject(size_err);
		}
	}

	if (data.setting && data.setting.delay && +data.setting.delay > 10) {
		return Promise.reject(errorWrapper({
			errcode: 40026,
			errmsg: '页面抓取延时时间不能超过 10 秒'
		}));
	}

	if (data.expectFetchTime && _.keys(data.expectFetchTime).length === 1) {
		return Promise.reject(errorWrapper({
			errcode: 40028,
			errmsg: '抓取时间时间不合法，hour 和 minute 参数必须同时存在'
		}));
	}
	if (data.expectFetchTime && (data.expectFetchTime.hour > 23 || data.expectFetchTime.hour < 0)) {
		return Promise.reject(errorWrapper({
			errcode: 40028,
			errmsg: '抓取时间时间不合法，hour 必须大于 0 并且小于 24'
		}));
	}	
	if (data.expectFetchTime && (data.expectFetchTime.minute > 59 || data.expectFetchTime.minute < 0)) {
		return Promise.reject(errorWrapper({
			errcode: 40028,
			errmsg: '抓取时间时间不合法，minute 必须大于 0 并且小于 60'
		}));		
	}

	return Promise.resolve(1);
};

const NODE_ENV = process.env.NODE_ENV || 'development';

const successLockTime = 2; // 抓取成功后锁定几小时后才能再次抓取

const fetch = function *(data) {
	let nowTime = Date.now();
	let todayEndTime = moment().endOf('day').valueOf();
	let setting = data.setting || {};
	let size = _.isEmpty(setting.size) ? ['1024x768'] : setting.size;
	let options = {
		delay: +setting.delay || 1
	};
	options.filename = data.id + '_' + moment().format('YYYYMMDD');
	logger.info('start fetch page %s', data.page)
	const pageres = new Pageres({
		delay: 1,
		timeout: 120,
		format: 'png'
	});

	let ret = null, err;

	try {
		ret = yield pageres.src(data.page, size, options)
				.dest(path.join(__dirname, '../snapshot'))
				.run()
				.then(function(ret) {
					logger.info('save image file to qiniu %s', options.filename);
					return uploadFile(options.filename + '.png');
				});		
	} catch(e) {
		logger.error('fetch image error %s', e.message);
		console.log(e);
		err = e;
	}


	if (!ret || ret === 'failure') {
		logger.error('抓取页面失败 id: %s page: %s', data.id, data.page);
		yield Page.findOneAndUpdate({
			_id: data.id
		}, {
			$set: {
				status: 'exception',
				retryTimes: 0,
				exception: {
					info: err && err.message || ret
				}
			}
		});
	} else {
		// 记录快照 url
		yield Snapshot.create({
			pid: data.id,
			url: ret,
			createdTime: nowTime
		});
		// 修改 page 状态
		let nextCanFetchTime = moment().add(successLockTime, 'hours').valueOf();
		if (todayEndTime < nextCanFetchTime) {
			nextCanFetchTime = todayEndTime + 1;
		}
		yield Page.findOneAndUpdate({
			_id: data.id
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
		logger.info('抓取页面成功 id: %s page: %s url: %s', data.id, data.page, ret);
	}
	return ret;
}

const fetchPage = function (uid, data) {
	co(function *() {
		let ret = yield fetch(data);
		if (!ret || ret === 'failure') {
			wsServer.send(uid, {
				status: 'failure',
				id: data.id,
				page: data.page
			})
		} else {
			wsServer.send(uid, {
				status: 'success',
				id: data.id,
				page: data.page
			})
		}
	})
}

// 添加新页面
exports.add = function *(next) {
	let user = this.user;
	let data = this.request.body || {};
	if (data.tags) {
		if (_.isString(data.tags)) data.tags = [data.tags];
		data.tags = _.uniq(_.compact(data.tags));
	}

	yield pageDataCheck(data);
	data.user = user._id;
	if (data.setting && data.setting.size) {
		data.setting.size = _.isString(data.setting.size) ? [data.setting.size] : data.setting.size;
	}
	data.status = 'fetching';
	let page = yield Page.create(data);

	Log.create({
		user: user._id,
		type: Log.types('addPage'),
		ip: this.cleanIP,
		data: data
	});

	page = page.toJSON ? page.toJSON() : page;
	
	let uid = user._id.toString();
	//改为同步抓取
	fetchPage(uid, page);

    this.status = 200;
    this.body = page;
    return;	
};

// 修改页面标签
exports.update = function *(next) {
	let pid = this.params.id;
	let user = this.user;
	let data = this.request.body || {};

	if (data.tags) {
		if (_.isString(data.tags)) data.tags = [data.tags];
		data.tags = _.uniq(_.compact(data.tags));
	}
	if (data.setting && data.setting.size) {
		data.setting.size = _.isString(data.setting.size) ? [data.setting.size] : data.setting.size;
	}
	yield pageDataCheck(data, true);
	let page = yield Page.findOneAndUpdate({
		user: user._id,
		_id: pid,
		del: false
	}, {
		$set: {
			title: data.title,
			tags: data.tags,
			setting: data.setting
		}
	}, {new: true});

	if (!page) {
		this.status = 400;
        this.body = errorWrapper({
            errcode: 40024,
            errmsg: '页面不存在'
        });
        return;
	}
	data.pid = pid;
	Log.create({
		user: user._id,
		type: Log.types('updatePage'),
		ip: this.cleanIP,
		data: data
	});

    this.status = 200;
    this.body = page;
    return;	
};

// 列表页面
exports.list = function *(next) {
	let user = this.user;	
	let pid = this.request.query.id;
	let tags = this.request.query.tags;
	let keyword = this.request.query.keyword;
	let page = +this.request.query.page || 1;
	let count = +this.request.query.count || 30;
	if (count > 1000) {
		count === 1000;
	}
	let query = {
		user: user._id,
		del: false		
	};

	if (pid) {
		query._id = pid;
	}

	if (tags) {
		if (_.isString(tags)) {
			query.tags = tags;
		} else if (_.isArray(tags)) {
			query.tags = {
				'$all': tags
			};
		}
	}

	if (keyword) {
	    let _reg;
	    try {
	     	_reg = new RegExp(keyword, 'i');
	    }catch(e){ log.warn('keyword %s invalid'); }
	    if (_reg) {
	    	query['$or'] = [
	    		{tags: _reg},
	    		{title: _reg},
	    		{page: _reg}
	    	]
	    }
	}

	let pages = yield Page.find(query).skip((page - 1) * count).limit(count).sort({createdTime:-1}).exec();
	let total = 0;
	if (pages.length < count) {
		total = (page - 1) * count + pages.length;
	} else {
		total = yield Page.count(query);
	}

	this.status = 200;
	this.body = {data: pages, total: total};
	return;
};

// 删除页面
exports.remove = function *(next) {
	let pid = this.params.id;
	let user = this.user;
	let page = yield Page.findOneAndUpdate({
		user: user._id,
		_id: pid,
		del: false
	}, {$set: {del: true}});

	if (!page) {
		this.status = 400;
        this.body = errorWrapper({
            errcode: 40024,
            errmsg: '页面不存在'
        });
        return;
	}

	Log.create({
		user: user._id,
		type: Log.types('delPage'),
		ip: this.cleanIP,
		data: {
			pid: pid
		}
	});	

    this.status = 200;
    this.body = {result: 'success'};
    return;		
};

// 获取某页面的快照列表
exports.listSnapshot = function *(next) {
	let user = this.user;
	let pid = this.params.id;
	let page = +this.request.query.page || 1;
	let count = +this.request.query.count || 30;
	let stime = +this.request.query.stime;
	let etime = +this.request.query.etime;
	let pageInfo;
	try {
		pageInfo = yield Page.findById({
			user: user._id,
			_id: pid,
			del: false
		});
	} catch(e){}

	if (!pageInfo)	{
		this.status = 400;
        this.body = errorWrapper({
            errcode: 40024,
            errmsg: '页面不存在'
        });
        return;
	}

	let condition = {
		pid: pageInfo._id
	};

	if (stime) {
		condition.createdTime = {$gte: stime};
	}

	if (etime) {
		condition.createdTime = _.extend(condition.createdTime || {}, {$lte: etime});
	}

	let data = yield Snapshot.find(condition).skip((page - 1) * count).limit(count).sort({createdTime: -1});
	let total = yield Snapshot.count(condition);

	this.status = 200;
	this.body = {data: data, total: total};
	return;
};

// 重新获取快照
exports.fetchSnapshot = function *(next) {
	let user = this.user;
	let pid = this.params.id;

	let page = null;
	try {
		page = yield Page.findOneAndUpdate({
			user: user._id,
			_id: pid,
			del: false
		}, {
			$set: {
				status: 'fetching'
			}
		});
	} catch(e){}

	if (!page) {
		this.status = 400;
        this.body = errorWrapper({
            errcode: 40024,
            errmsg: '页面不存在'
        });
        return;
	}

	page = page.toJSON();
	let url = yield fetch(page);

	this.status = 200;
	this.body = {
		url: url
	};
	return;
}