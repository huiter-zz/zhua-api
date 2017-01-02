const _ = require('lodash');
const User = require('../model').User;
const Log = require('../model').Log;
const errorWrapper = require('../utils').errorWrapper;

const emailReg = /^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})(\.[a-z]{2,6})?$/i;
const loginCookieExpireTime = 2 * 60 * 60 * 1000;
const loginCookieExpireRememberTime = 30 * 24 * 60 * 60 * 1000;

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

// 注册
exports.register = function *(next) {
	let data = this.request.body || {};

	yield userInfoCheck(data);

	let userIsExist = yield User.findOne({
		emailLower: data.email.toLowerCase()
	});

	if (userIsExist) {
		console.log(userIsExist);
		this.status = 400;
		this.body = {
			errcode: 40006,
			errmsg: '此邮件地址已存在，您可以直接登录或更换邮件地址'
		};
		return;
	}

	let user = yield User.create(data);

	Log.create({
		user: user._id,
		type: Log.types('register'),
		ip: this.cleanIP
	});

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
