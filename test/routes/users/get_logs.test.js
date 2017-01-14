/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const users = fixtures.user;
const logs = fixtures.log;
const _ = require('lodash');

describe('GET /users/logs', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.get('/users/logs')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});

	context('without login', function() {
		it('success', function(done) {
			http.get('/users/logs')
			.auth(users[0].email, users[0].password)
			.expect(200, function(err, res) {
				let ret = _.filter(logs, function(item) {
					return item.user === users[0]._id;
				});
				res.body.total.should.equal(ret.length);
				res.body.data.length.should.equal(ret.length);
				done();
			});
		});
	});

	context('count = 2', function() {
		it('success', function(done) {
			http.get('/users/logs')
			.auth(users[0].email, users[0].password)
			.query({count: 2})
			.expect(200, function(err, res) {
				let ret = _.filter(logs, function(item) {
					return item.user === users[0]._id;
				});
				res.body.total.should.equal(ret.length);
				res.body.data.length.should.equal(2);
				done();
			});
		});
	});

	context('count = 5 and page = 3', function() {
		it('success', function(done) {
			http.get('/users/logs')
			.auth(users[0].email, users[0].password)
			.query({count: 5, page: 3})
			.expect(200, function(err, res) {
				let ret = _.filter(logs, function(item) {
					return item.user === users[0]._id;
				});
				let len = ret.length - 10;
				if (len > 5) len = 5;
				res.body.total.should.equal(ret.length);
				res.body.data.length.should.equal(len);
				done();
			});
		});
	});

	context('type = login', function() {
		it('success', function(done) {
			http.get('/users/logs')
			.auth(users[0].email, users[0].password)
			.query({type: 'login'})
			.expect(200, function(err, res) {
				let ret = _.filter(logs, function(item) {
					return item.user === users[0]._id && item.type === 'login';
				});
				res.body.total.should.equal(ret.length);
				res.body.data.length.should.equal(ret.length);
				done();
			});
		});
	});

	context('type = cash', function() {
		it('success', function(done) {
			http.get('/users/logs')
			.auth(users[0].email, users[0].password)
			.query({type: 'login'})
			.expect(200, function(err, res) {
				let ret = _.filter(logs, function(item) {
					return item.user === users[0]._id && item.type === 'cash';
				});
				res.body.total.should.equal(ret.length);
				res.body.data.length.should.equal(ret.length);
				done();
			});
		});
	});

	context('type = cash,gift', function() {
		it('success', function(done) {
			http.get('/users/logs')
			.auth(users[0].email, users[0].password)
			.query({type: 'login,gift'})
			.expect(200, function(err, res) {
				let ret = _.filter(logs, function(item) {
					return item.user === users[0]._id && (item.type === 'cash' || item.type === 'gift');
				});
				res.body.total.should.equal(ret.length);
				res.body.data.length.should.equal(ret.length);
				done();
			});
		});
	});

	context('type = [cash,gift]', function() {
		it('success', function(done) {
			http.get('/users/logs')
			.auth(users[0].email, users[0].password)
			.query({type: ['login','gift']})
			.expect(200, function(err, res) {
				let ret = _.filter(logs, function(item) {
					return item.user === users[0]._id && (item.type === 'cash' || item.type === 'gift');
				});
				res.body.total.should.equal(ret.length);
				res.body.data.length.should.equal(ret.length);
				done();
			});
		});
	});

	context('type = stime and etime', function() {
		it('success', function(done) {
			let ret = _.filter(logs, function(item) {
				return item.user === users[0]._id;
			});
			let _logs = _.sortBy(ret, function(item) { return -item.createdTime; });
			http.get('/users/logs')
			.auth(users[0].email, users[0].password)
			.query({stime: _logs[_logs.length -2].createdTime, etime: _logs[1].createdTime})
			.expect(200, function(err, res) {
				res.body.total.should.equal(ret.length - 2);
				res.body.data.length.should.equal(ret.length - 2);
				done();
			});
		});
	});

});