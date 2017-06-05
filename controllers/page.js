const _ = require('lodash');
const Page = require('../model').Page;
const Snapshot = require('../model').Snapshot;
const Log = require('../model').Log;
const errorWrapper = require('../utils').errorWrapper;
const exec = require('child_process').exec;
const worker = require('../service/worker');
const path = require('path');

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
	let page = yield Page.create(data);

	Log.create({
		user: user._id,
		type: Log.types('addPage'),
		ip: this.cleanIP,
		data: data
	});

	let isFetching = yield worker.check();
	if (!isFetching) {
		let _pathDir = path.join(__dirname, '../crontab/zhuaPage');
		exec('NODE_ENV=' + NODE_ENV + ' node ' + _pathDir);
	}

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
	    if (_reg) query.tags = _reg;
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