/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const UserLog = require('../../../model').UserLog;
const users = fixtures.user;
const userLogs = fixtures.userLog;
const _ = require('lodash');

describe('PUT /users/me/password', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.put('/users/me/password')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});

	context('email not exist', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.put('/users/me/password')
			.auth('t123@zhua.pm', '123456')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});	

	context('password invalid', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.put('/users/me/password')
			.auth(users[0].email, '7652837')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});	

	context('without oldPassword', function() {
		it('原始密码不合法', function(done) {
			http.put('/users/me/password')
			.auth(users[0].email, users[0].password)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40005);
				res.body.errmsg.should.equal('原始密码不合法');
				done();
			});
		});
	});

	context('without newPassword', function() {
		it('密码不合法，密码长度必须大于 6 位并小于 50 位', function(done) {
			http.put('/users/me/password')
			.auth(users[0].email, users[0].password)
			.send({oldPassword: users[0].password})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40002);
				res.body.errmsg.should.equal('密码不合法，密码长度必须大于 6 位并小于 50 位');
				done();
			});
		});
	});

	context('newPassword.length < 6', function() {
		it('密码不合法，密码长度必须大于 6 位并小于 50 位', function(done) {
			http.put('/users/me/password')
			.auth(users[0].email, users[0].password)
			.send({oldPassword: users[0].password, newPassword: '12345'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40002);
				res.body.errmsg.should.equal('密码不合法，密码长度必须大于 6 位并小于 50 位');
				done();
			});
		});
	});

	context('oldPassword not match', function() {
		it('原始密码不合法', function(done) {
			http.put('/users/me/password')
			.auth(users[0].email, users[0].password)
			.send({oldPassword: '987678123', newPassword: '1234511'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40005);
				res.body.errmsg.should.equal('原始密码不合法');				
				done();
			});
		});
	});

	context('with right oldPassword', function() {
		it('原始密码不合法', function(done) {
			http.put('/users/me/password')
			.auth(users[0].email, users[0].password)
			.send({oldPassword: users[0].password, newPassword: '987654321'})
			.expect(200, function(err, res) {
				res.body.result.should.equal('success');
				UserLog.find({
					user: users[0]._id
				}, function(err, docs) {
					var logs = _.filter(userLogs, function(item) {
						return item.user === users[0]._id;
					});
					docs.length.should.equal(logs.length + 1);
					docs[0].type.should.equal('updatePass');
					docs[0].ip.should.equal('127.0.0.1');
					done();
				});
			});
		});
	});	
});