/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const users = fixtures.user;
const logs = fixtures.log;
const _ = require('lodash');

describe('PUT /users/me', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.put('/users/me')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});
		
	context('name.length > 40', function() {
		it('用户名不合法，用户名长度不能大于 40 位', function(done) {
			http.put('/users/me')
			.auth(users[0].email, users[0].password)
			.send({name: '12345678901234567890123456789012345678901234567890'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40003);
				res.body.errmsg.should.equal('用户名不合法，用户名长度不能大于 40 位');
				done();
			});
		});
	});

	context('phone is not a number', function() {
		it('手机号码不合法', function(done) {
			http.put('/users/me')
			.auth(users[0].email, users[0].password)
			.send({phone: '13589736784'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40004);
				res.body.errmsg.should.equal('手机号码不合法');
				done();
			});
		});
	});

	context('phone.length !== 11', function() {
		it('手机号码不合法', function(done) {
			http.put('/users/me')
			.auth(users[0].email, users[0].password)
			.send({phone: 1345456234})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40004);
				res.body.errmsg.should.equal('手机号码不合法');
				done();
			});
		});
	});	

	context('update name', function() {
		it('success', function(done) {
			http.put('/users/me')
			.auth(users[0].email, users[0].password)
			.send({name: '李四11'})
			.expect(200, function(err, res) {
				res.body.name.should.equal('李四11');
				Log.find({
					user: res.body.uid
				}, function(err, docs) {
					var _logs = _.filter(logs, function(item) {
						return item.user === res.body.uid;
					});
					docs.length.should.equal(_logs.length + 1);
					docs[0].type.should.equal('updateInfo');
					docs[0].ip.should.equal('127.0.0.1');	
					docs[0].data.name.should.equal('李四11');				
					done();
				});
			});
		});
	});

	context('update phone', function() {
		it('success', function(done) {
			http.put('/users/me')
			.auth(users[0].email, users[0].password)
			.send({phone: 13519871212})
			.expect(200, function(err, res) {
				res.body.phone.should.equal(13519871212);
				Log.find({
					user: res.body.uid
				}, function(err, docs) {
					var _logs = _.filter(logs, function(item) {
						return item.user === res.body.uid;
					});
					docs.length.should.equal(_logs.length + 1);
					docs[0].type.should.equal('updateInfo');
					docs[0].ip.should.equal('127.0.0.1');	
					docs[0].data.phone.should.equal(13519871212);				
					done();
				});
			});
		});
	});	
});