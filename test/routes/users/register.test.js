/* global describe: true, context: true, it: true, http:true */
'use strict';

const config = require('config');
const sinon = require('sinon');
const fixtures = require('../../load_fixtures');
const utils = require('../../../utils');
const Log = require('../../../model').Log;
const Property = require('../../../model').Property;
const users = fixtures.user;

const registerGivenAmount = +config.registerGivenAmount || 1000; // 注册后赠送的充值金额


describe('POST /users/register', function() {

	context('without email and password', function() {
		it('邮件地址不合法', function(done) {
			http.post('/users/register')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40001);
				res.body.errmsg.should.equal('邮件地址不合法');
				done();
			});
		});
	});

	context('without email', function() {
		it('邮件地址不合法', function(done) {
			http.post('/users/register')
			.send({password: '123456', nickname: 'testabc'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40001);
				res.body.errmsg.should.equal('邮件地址不合法');
				done();
			});
		});
	});

	context('without password', function() {
		it('密码不合法', function(done) {
			http.post('/users/register')
			.send({email: 'test@zhua.pm', nickname: 'testabc'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40002);
				res.body.errmsg.should.equal('密码不合法，密码长度必须大于 6 位并小于 50 位');
				done();
			});
		});
	});

	context('password.length < 6', function() {
		it('密码不合法', function(done) {
			http.post('/users/register')
			.send({email: 'test@zhua.pm', password: '12345', nickname: 'testabc'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40002);
				res.body.errmsg.should.equal('密码不合法，密码长度必须大于 6 位并小于 50 位');
				done();
			});
		});
	});

	context('password.length > 50', function() {
		it('密码不合法', function(done) {
			http.post('/users/register')
			.send({email: 'test@zhua.pm', password: '1234567890123456789012345678901234567890123456789012', nickname: 'testabc'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40002);
				res.body.errmsg.should.equal('密码不合法，密码长度必须大于 6 位并小于 50 位');
				done();
			});
		});
	});	

	context('email exist', function() {
		it('此邮件地址已存在，您可以直接登录或更换邮件地址', function(done) {
			http.post('/users/register')
			.send({email: users[0].email, password: '123456', nickname: 'testabc'})
			.set('x-real-ip', '134.45.45.45')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40006);
				res.body.errmsg.should.equal('此邮件地址已存在，您可以直接登录或更换邮件地址');
				done();
			});
		});
	});	

	context('without nickname', function() {
		it('此邮件地址已存在，您可以直接登录或更换邮件地址', function(done) {
			http.post('/users/register')
			.send({email: 'test123@zhua.pm', password: '123456'})
			.set('x-real-ip', '134.45.45.45')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40003);
				res.body.errmsg.should.equal('用户昵称不能为空并且长度不能大于 24 位');
				done();
			});
		});
	});	

	context('nickname invalid', function() {
		it('此邮件地址已存在，您可以直接登录或更换邮件地址', function(done) {
			http.post('/users/register')
			.send({email: 'test123@zhua.pm', password: '123456',nickname: '用户昵称用户昵称用户昵称用户昵称用户昵称用户昵称a'})
			.set('x-real-ip', '134.45.45.45')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40003);
				res.body.errmsg.should.equal('用户昵称不能为空并且长度不能大于 24 位');
				done();
			});
		});
	});	
	context('with right email and password', function() {
		it('success', function(done) {
			http.post('/users/register')
			.send({email: 'test@zhua.pm', password: '123456', nickname: 'test'})
			.set('x-real-ip', '134.45.45.45')
			.expect(200, function(err, res) {
				res.body.should.have.property('uid');
				res.body.nickname.should.equal('test');
				res.body.should.have.property('invitationCode');
				console.log(res.body);
				Log.find({user: res.body.uid}, function(err, docs) {
					docs.length.should.equal(2);
					docs[0].type.should.equal('gift');
					docs[0].data.amount.should.equal(registerGivenAmount);
					docs[1].type.should.equal('register');
					docs[1].ip.should.equal('127.0.0.1');
					Property.findOne({user: res.body.uid}, function(err, doc) {
						doc.cash.should.equal(0);
						doc.gift.should.equal(registerGivenAmount);
						done();
					});
				});
			});
		});
	});	

	context('with referralsCode', function() {
		it('success', function(done) {
			http.post('/users/register')
			.send({email: 'test@zhua.pm', password: '123456', nickname: 'test', referralsCode: users[0].invitationCode})
			.set('x-real-ip', '134.45.45.45')
			.expect(200, function(err, res) {
				res.body.should.have.property('uid');
				res.body.nickname.should.equal('test');
				res.body.should.have.property('invitationCode');
				res.body.referrals.user.should.equal(users[0]._id);
				res.body.referrals.code.should.equal(users[0].invitationCode);
				res.body.referrals.isPay.should.equal(false);
				Log.find({user: res.body.uid}, function(err, docs) {
					docs.length.should.equal(2);
					docs[0].type.should.equal('gift');
					docs[0].data.amount.should.equal(registerGivenAmount);
					docs[1].type.should.equal('register');
					docs[1].ip.should.equal('127.0.0.1');
					Property.findOne({user: res.body.uid}, function(err, doc) {
						doc.cash.should.equal(0);
						doc.gift.should.equal(registerGivenAmount);
						done();
					});
				});
			});
		});
	});	

	context('generateInvitationCode repeat and register failure', function() {
		it('success', function(done) {
			let stub = sinon.stub(utils, 'randomString', function(len) {
				return 'abcd';
			});
			http.post('/users/register')
			.send({email: 'test@zhua.pm', password: '123456', nickname: 'test', referralsCode: users[0].invitationCode})
			.set('x-real-ip', '134.45.45.45')
			.expect(200, function(err, res) {
				http.post('/users/register')
				.send({email: 'test123@zhua.pm', password: '123456', nickname: 'test123', referralsCode: users[0].invitationCode})
				.set('x-real-ip', '134.45.45.45')
				.expect(400, function(err, res) {
					stub.restore();
					res.body.errcode.should.equal(40007);
					res.body.errmsg.should.equal('生成邀请码出错');
					done();
				});
			});
		});
	});

	context('generateInvitationCode repeat twice', function() {
		it('success', function(done) {
			var count = 0;
			let stub = sinon.stub(utils, 'randomString', function(len) {
				count++;
				console.log(len,count);
				if (count > 3) {
					return 'abce';
				} else {
					return 'abcd';
				}
			});
			http.post('/users/register')
			.send({email: 'test@zhua.pm', password: '123456', nickname: 'test', referralsCode: users[0].invitationCode})
			.set('x-real-ip', '134.45.45.45')
			.expect(200, function(err, res) {
				http.post('/users/register')
				.send({email: 'test123@zhua.pm', password: '123456', nickname: 'test123', referralsCode: users[0].invitationCode})
				.set('x-real-ip', '134.45.45.45')
				.expect(200, function(err, res) {
					stub.restore();
					res.body.should.have.property('invitationCode');
					done();
				});
			});
		});
	});		
});