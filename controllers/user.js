const _ = require('lodash');
const config = require('config');
const User = require('../model').User;
const Log = require('../model').Log;
const Property = require('../model').Property;
const Page = require('../model').Page;
const utils = require('../utils');
const errorWrapper = utils.errorWrapper;
const logger = utils.getLogger('user');

const emailReg = /^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})(\.[a-z]{2,6})?$/i;
const loginCookieExpireTime = 2 * 60 * 60 * 1000;
const loginCookieExpireRememberTime = 30 * 24 * 60 * 60 * 1000;
const registerGivenAmount = +config.registerGivenAmount || 5000; // 注册后赠送的充值金额


// 用户信息字段检查
const userInfoCheck = function *(data) {
	data = data || {};
	if (!emailReg.test(data.email)) {
        return Promise.reject(errorWrapper({
            errcode: 40001,
            errmsg: '邮件地址不合法'
        }));
	}

	if (!data.password || data.password.length < 6 || data.password.length > 50) {
        return Promise.reject(errorWrapper({
            errcode: 40002,
            errmsg: '密码不合法，密码长度必须大于 6 位并小于 50 位'
        }));
	}

	if (!data.nickname || data.nickname.length > 24) {
        return Promise.reject(errorWrapper({
            errcode: 40003,
            errmsg: '用户昵称不能为空并且长度不能大于 24 位'
        }));
	}

	return Promise.resolve(1);
};

// 生成用户邀请码
const generateInvitationCode = function *(retryCount) {
	retryCount = retryCount || 0;
	retryCount++;
	if (retryCount > 10) {
		return Promise.reject(errorWrapper({
			errcode: 40007,
			errmsg: '生成邀请码出错'
		}));
	}
	let invitationCode = moment().format('YYYYMMDD') + utils.randomString(4);
	let isExist = yield User.findOne({invitationCode: invitationCode});
	if (isExist) {
		return yield generateInvitationCode.bind(null, retryCount);
	} else {
		return Promise.resolve(invitationCode);
	}
};

// 初始化用户的财产 model
const initUserProperty = function *(uid) {
	return Property.create({user: uid});
};

// 修改用户余额
const updateProperty = function *(uid, type, amount, ip, by) {
	amount = +amount || 0;
	var updateDoc = {};
	logger.info('修改用户余额 type: %s uid: %s amount: %s', type, uid, amount);
	if (type === 'cash') {
		updateDoc = {
			$inc: {
				cash: amount
			}
		};
	} else if (type === 'gift') {
		updateDoc =	{
			$inc: {
				gift: amount
			}
		};
	} else {
		return Promise.reject(new Error('property type invalid'));
	}
	let ret = yield Property.findOneAndUpdate({
		user: uid
	}, updateDoc);
	if (ret) {
		logger.info('修改用户余额成功 type: %s uid: %s amount: %s', type, uid, amount);
		Log.create({
			user: uid,
			type: Log.types(type),
			ip: ip,
			data: {
				by: by,
				amount: amount
			}
		});
	} else {
		logger.error('修改用户余额失败 type: %s uid: %s amount: %s', type, uid, amount);
	}
	return Promise.resolve(!!ret);
};

// 注册
exports.register = function *(next) {
	let data = this.request.body || {};

	yield userInfoCheck(data);

	let userIsExist = yield User.findOne({
		emailLower: data.email.toLowerCase()
	});

	if (userIsExist) {
		this.status = 400;
		this.body = {
			errcode: 40006,
			errmsg: '此邮件地址已存在，您可以直接登录或更换邮件地址'
		};
		return;
	}

	let invitationCode = yield generateInvitationCode();
	data.invitationCode = invitationCode;

	// 注册时若填写了他人的引荐码
	if (data.referralsCode) {
		let referrals = yield User.findOne({invitationCode: data.referralsCode});
		if (referrals) {
			data.referrals = {
				user: referrals._id,
				code: data.referralsCode,
				isPay: false
			};
		}

		delete data.referralsCode;
	}

	let user = yield User.create(data);

	Log.create({
		user: user._id,
		type: Log.types('register'),
		ip: this.cleanIP
	});

	// 初始化用户财产 model
	yield initUserProperty(user._id);
	// 充值
	yield updateProperty(user._id, 'gift', registerGivenAmount, this.cleanIP, 'register');

	// 返回 User 对象
	user = user.toJSON();
	user.loginTime = Date.now();
	user.lastLoginTime = user.loginTime;
	this.session.uid = user.uid,
	this.session.loginTime = user.loginTime;
	this.session.lastLoginTime = user.lastLoginTime;
	this.session.cookie.maxAge = loginCookieExpireTime;

	let property = yield Property.findOne({user: user.uid});

	user.property = {
		cash: property && property.cash || 0,
		gift: property && property.gift || 0
	};
	let pageCount = yield Page.count({user: user.uid, del: false});
	user.pageCount = pageCount || 0;
	if (!user.avatar) { // 默认头像
		user.avatar = 'https://omojllq5i.qnssl.com/a3192a39aeafe019159395b18f940e03.png';
	}
	user.access_token = this.sessionId;
    this.status = 200;
    this.body = user;
    return;	
};

// 登录
exports.login = function *(next) {
	let data = this.request.body || {};
	let email = data.email;
	let password = data.password;
	let remember = data.remember;

	var self = this;
	let errFn = function () {
		self.status = 401;
        self.body = errorWrapper({
            errcode: 40011,
            errmsg: '邮件或密码错误'
        });
        return;
	};

	if (!email || !password) {
        return errFn();
	}

	let user = yield User.findOne({
		emailLower: email.toLowerCase()
	});

	if (!user) {
       return errFn();	
	}

	let isMatch = yield user.comparePassword(password);

	if (!isMatch) {
        return errFn();
	}

	let log = yield Log.find({
		user: user._id,
		type: Log.types('login'),
	}).sort({createdTime: -1}).limit(1);
	log = (log && log[0]) ? log[0].toJSON() : {};

	Log.create({
		user: user._id,
		type: Log.types('login'),
		ip: this.cleanIP
	});
	user = user.toJSON();
	user.loginTime = Date.now();
	user.lastLoginTime = log.createdTime;
	this.session.uid = user.uid,
	this.session.loginTime = user.loginTime;
	this.session.lastLoginTime = user.lastLoginTime;
	if (remember) {
		this.session.cookie.maxAge = loginCookieExpireRememberTime;
	} else {
		this.session.cookie.maxAge = loginCookieExpireTime;
	}
	let property = yield Property.findOne({user: user.uid});
	user.property = {
		cash: property && property.cash || 0,
		gift: property && property.gift || 0
	};
	let pageCount = yield Page.count({user: user.uid, del: false});
	user.pageCount = pageCount || 0;
	if (!user.avatar) { // 默认头像
		user.avatar = 'https://omojllq5i.qnssl.com/a3192a39aeafe019159395b18f940e03.png';
	}
	user.access_token = this.sessionId;
	this.status = 200;
	this.body = user;
	return;
};

// 获取用户信息，验证用户是否登录
exports.getInfo = function *(next) {
	let user = this.user;
	user = user.toJSON ? user.toJSON() : user;
	let session = this.session;
	user.loginTime = session.loginTime;
	user.lastLoginTime = session.lastLoginTime;
	if (!user.avatar) { // 默认头像
		user.avatar = 'https://omojllq5i.qnssl.com/a3192a39aeafe019159395b18f940e03.png';
	}
	let property = yield Property.findOne({user: user.uid});
	user.property = {
		cash: property && property.cash || 0,
		gift: property && property.gift || 0
	};
	let pageCount = yield Page.count({user: user.uid, del: false});
	user.pageCount = pageCount || 0;
	this.status = 200;
	this.body = this.user;
	return;
};

// 修改信息
exports.updateInfo = function *(next) {
	let data = this.request.body || {};
	let nickname = data.nickname;
	let avatar = data.avatar;
	let phone = data.phone;

	if (nickname && nickname.length > 24) {
		this.status = 400;
        this.body = errorWrapper({
            errcode: 40003,
            errmsg: '用户昵称不能为空并且长度不能大于 24 位'
        });
        return;
	}

	if (phone && (!_.isNumber(phone) || phone.toString().length !== 11)) {
		this.status = 400;
        this.body = errorWrapper({
            errcode: 40004,
            errmsg: '手机号码不合法'
        });
        return;
	}

	let user = this.user;
	let updateDoc = {};
	if (nickname) {
		updateDoc.nickname = nickname;		
	}
	if (phone) {
		updateDoc.phone = phone;
	}
	if (avatar) {
		updateDoc.avatar = avatar;
	}
	let ret = yield User.findByIdAndUpdate(user._id, updateDoc, {new: true});
	Log.create({
		user: user._id,
		type: Log.types('updateInfo'),
		data: updateDoc,
		ip: this.cleanIP
	});

	this.status = 200;
	this.body = ret;
	return;
};

// 修改密码
exports.resetPassword = function *(next) {
	let data = this.request.body || {};
	let oldPassword = data.oldPassword;
	let newPassword = data.newPassword;

	if (!oldPassword) {
		this.status = 400;
        this.body = errorWrapper({
            errcode: 40005,
            errmsg: '原始密码不合法'
        });
        return;
	}

	if (!newPassword || newPassword.length < 6) {
		this.status = 400;
        this.body = errorWrapper({
            errcode: 40002,
            errmsg: '密码不合法，密码长度必须大于 6 位并小于 50 位'
        });
        return;
	}

	let user = this.user;

	let isMatch = yield user.comparePassword(oldPassword);

	if (!isMatch) {
		this.status = 400;
        this.body = errorWrapper({
            errcode: 40005,
            errmsg: '原始密码不合法'
        });
        return;
	}

	user.password = newPassword;
	let ret = yield user.save();

	Log.create({
		user: user._id,
		type: Log.types('updatePass'),
		ip: this.cleanIP
	});

	this.status = 200;
	this.body = {result: 'success'};
};

// 登出
exports.logout = function *(next) {
	this.session = null;
	this.status = 200;
	this.body = {result: 'success'};
};

// 获取自己的余额
exports.getBalance = function *(next) {
	let user = this.user;
	let data = yield Property.findOne({
		user: user._id
	});

	this.status = 200;
	this.body = data;
	return;
};

// 获取自己邀请的用户列表 
exports.getInvitationUsers = function *(next) {
	let user = this.user;
	let query = this.request.query || {};
	let count = +query.count || 30;
	let page = +query.page || 1;

	let users = yield User.find({'referrals.user': user._id}).skip((page - 1) * count).limit(count);
	let total = yield User.count({'referrals.user': user._id});

	let result = _.map(users, function(item) {
		item = item.toJSON();
		return {
			nickname: item.nickname,
			avatar: item.avatar,
			referrals: _.omit(item.referrals, 'user')
		};
	});

	this.status = 200;
	this.body = {data: result, total: total};
	return;
};

// 获取自己的操作记录  
exports.getLogs = function *(next) {
	let user = this.user;
	let query = this.request.query || {};
	let type = query.type;
	let stime = +query.stime;
	let etime = +query.etime;
	let count = +query.count || 30;
	let page = +query.page || 1;
	if (_.isString(type)) {
		type = _.uniq(_.compact(type.split(',')));
	}

	let condition = {
		user: user._id
	};

	if (type) {
		condition.type = {$in: type};
	}

	if (stime) {
		condition.createdTime = {$gte: stime};
	}

	if (etime) {
		condition.createdTime = _.extend(condition.createdTime || {}, {$lte: etime});
	}

	let logs = yield Log.find(condition).skip((page - 1) * count).limit(count);
	let total = yield Log.count(condition);

	this.status = 200;
	this.body = {data: logs, total: total};
	return;
};

// 用户充值
exports.recharge = function *(next) {

};
