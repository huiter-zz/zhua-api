const _ = require('lodash');
const User = require('../model').User;
const UserLog = require('../model').UserLog;
const errorWrapper = require('../utils').errorWrapper;

const emailReg = /^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})(\.[a-z]{2,6})?$/i;

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

	return Promise.resolve(1);
};

// 注册
exports.register = function *(next) {
	let data = this.request.body || {};

	yield userInfoCheck(data);

	let user = yield User.create(data);

	UserLog.create({
		user: user._id,
		type: UserLog.types('register'),
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

	let log = yield UserLog.find({
		user: user._id,
		type: UserLog.types('login'),
	}).sort({createdTime: -1}).limit(1);
	log = (log && log[0]) ? log[0].toJSON() : {};

	UserLog.create({
		user: user._id,
		type: UserLog.types('login'),
		ip: this.cleanIP
	});
	user = user.toJSON();
	user.loginTime = Date.now();
	user.lastLoginTime = log.createdTime;
	this.session.uid = user.uid,
	this.session.loginTime = user.loginTime;
	this.session.lastLoginTime = user.lastLoginTime;
	this.session.cookie.maxAge = 2 * 60 * 60 * 1000;
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
	let name = data.name;
	let phone = data.phone;

	if (name && name.length > 40) {
		this.status = 400;
        this.body = errorWrapper({
            errcode: 40003,
            errmsg: '用户名不合法，用户名长度不能大于 40 位'
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
	if (name) {
		updateDoc.name = name;		
	}
	if (phone) {
		updateDoc.phone = phone;
	}
	let ret = yield User.findByIdAndUpdate(user._id, updateDoc, {new: true});
	UserLog.create({
		user: user._id,
		type: UserLog.types('updateInfo'),
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

	UserLog.create({
		user: user._id,
		type: UserLog.types('updatePass'),
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
