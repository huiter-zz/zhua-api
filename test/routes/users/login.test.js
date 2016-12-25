/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const UserLog = require('../../../model').UserLog;
const users = fixtures.user;
const userLogs = fixtures.userLog;
const _ = require('lodash');

describe('POST /users/login', function() {

	context('without email and password', function() {
		it('邮件或密码错误', function(done) {
			http.post('/users/login')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40011);
				res.body.errmsg.should.equal('邮件或密码错误');
				done();
			});
		});
	});

	context('without email', function() {
		it('邮件或密码错误', function(done) {
			http.post('/users/login')
			.send({password: '123456'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40011);
				res.body.errmsg.should.equal('邮件或密码错误');
				done();
			});
		});
	});

	context('without password', function() {
		it('邮件或密码错误', function(done) {
			http.post('/users/login')
			.send({email: users[0].email})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40011);
				res.body.errmsg.should.equal('邮件或密码错误');				
				done();
			});
		});
	});

	context('email not exist', function() {
		it('邮件或密码错误', function(done) {
			http.post('/users/login')
			.send({email: 't123@zhua.pm', password: '123456'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40011);
				res.body.errmsg.should.equal('邮件或密码错误');
				done();
			});
		});
	});	

	context('with wrong password', function() {
		it('邮件或密码错误', function(done) {
			http.post('/users/login')
			.send({email: users[0].email, password: '45676523'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40011);
				res.body.errmsg.should.equal('邮件或密码错误');				
				done();
			});
		});
	});

	context('with right email and password', function() {
		it('success', function(done) {
			http.post('/users/login')
			.send({email: users[0].email, password: users[0].password})
			.set('x-real-ip', '134.45.45.45')
			.expect(200, function(err, res) {
				res.body.should.have.property('uid');
				var logs = _.filter(userLogs, function(item) {
					return item.user === res.body.uid;
				});
				UserLog.find({user: res.body.uid}, function(err, docs) {
					docs.length.should.equal(logs.length + 1);
					docs[0].type.should.equal('login');
					docs[0].ip.should.equal('127.0.0.1');
					http.get('/users/me')
					.set('cookie', res.headers['set-cookie'])
					.expect(200, function(err, result) {
						result.body.uid.should.equal(res.body.uid);
						done();
					});
				});
			});
		});
	});		

	context('new user login', function() {
		it('success', function(done) {
			http.post('/users/login')
			.send({email: users[2].email, password: users[2].password})
			.set('x-real-ip', '134.45.45.45')
			.expect(200, function(err, res) {
				res.body.should.have.property('uid');
				var logs = _.filter(userLogs, function(item) {
					return item.user === res.body.uid;
				});
				UserLog.find({user: res.body.uid}, function(err, docs) {
					docs.length.should.equal(logs.length + 1);
					docs[0].type.should.equal('login');
					docs[0].ip.should.equal('127.0.0.1');
					http.get('/users/me')
					.set('cookie', res.headers['set-cookie'])
					.expect(200, function(err, result) {
						result.body.uid.should.equal(res.body.uid);
						done();
					});
				});
			});
		});
	});	
});