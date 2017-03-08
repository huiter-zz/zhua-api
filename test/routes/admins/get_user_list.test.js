/* global describe: true, context: true, it: true, http:true */
'use strict';
const sinon = require('sinon');
const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const Property = require('../../../model').Property;
const users = fixtures.user;
const logs = fixtures.log;
const propertys = fixtures.property;
const _ = require('lodash');

describe('POST /admins/users/list', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.get('/admins/users/list')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});
		
	context('not admin', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.get('/admins/users/list')
			.auth(users[0].email, users[0].password)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});
		
	context('get user list 1', function() {
		it('success', function(done) {
			http.get('/admins/users/list')
			.auth(users[3].email, users[3].password)
			.expect(200, function(err, res) {
				res.body.total.should.equal(3);
				res.body.data.length.should.equal(3);
				done();
			});
		});
	});

	context('get user list 2', function() {
		it('success', function(done) {
			http.get('/admins/users/list')
			.auth(users[3].email, users[3].password)
			.query({email: 't1@zhua.pm'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(1);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});

	context('get user list 2', function() {
		it('success', function(done) {
			http.get('/admins/users/list')
			.auth(users[3].email, users[3].password)
			.query({nickname: '李四'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(1);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});	

	context('get user list 3', function() {
		it('success', function(done) {
			http.get('/admins/users/list')
			.auth(users[3].email, users[3].password)
			.query({phone: 13498762781})
			.expect(200, function(err, res) {
				res.body.total.should.equal(1);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});

	context('get user list 4', function() {
		it('success', function(done) {
			http.get('/admins/users/list')
			.auth(users[3].email, users[3].password)
			.query({uid: '585f758acb9c00775abdb091'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(1);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});		

	context('get user list 5', function() {
		it('success', function(done) {
			http.get('/admins/users/list')
			.auth(users[3].email, users[3].password)
			.query({uid: '585f758acb9c00775abdb091,585f758acb9c00775abdb092'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(2);
				res.body.data.length.should.equal(2);
				done();
			});
		});
	});

	context('get user list 6', function() {
		it('success', function(done) {
			http.get('/admins/users/list')
			.auth(users[3].email, users[3].password)
			.query({uid: ['585f758acb9c00775abdb091','585f758acb9c00775abdb092']})
			.expect(200, function(err, res) {
				res.body.total.should.equal(2);
				res.body.data.length.should.equal(2);
				done();
			});
		});
	});

	context('get user list 7', function() {
		it('success', function(done) {
			http.get('/admins/users/list')
			.auth(users[3].email, users[3].password)
			.query({keyword: '张'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(1);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});	


	context('get user list 8', function() {
		it('success', function(done) {
			http.get('/admins/users/list')
			.auth(users[3].email, users[3].password)
			.query({keyword: 't'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(3);
				res.body.data.length.should.equal(3);
				done();
			});
		});
	});			
});