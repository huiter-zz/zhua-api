/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const users = fixtures.user;
const _ = require('lodash');

describe('GET /users/invitations', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.get('/users/invitations')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});

	context('without login', function() {
		it('success', function(done) {
			http.get('/users/invitations')
			.auth(users[0].email, users[0].password)
			.expect(200, function(err, res) {
				let ret = _.filter(users, function(item) {
					return item.referrals && item.referrals.user === users[0]._id;
				});
				res.body.total.should.equal(ret.length);
				res.body.data.length.should.equal(ret.length);
				done();
			});
		});
	});

	context('count = 1', function() {
		it('success', function(done) {
			http.get('/users/invitations')
			.auth(users[0].email, users[0].password)
			.query({count: 1})
			.expect(200, function(err, res) {
				let ret = _.filter(users, function(item) {
					return item.referrals && item.referrals.user === users[0]._id;
				});
				res.body.total.should.equal(ret.length);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});

	context('count = 1 and page = 2', function() {
		it('success', function(done) {
			http.get('/users/invitations')
			.auth(users[0].email, users[0].password)
			.query({count: 1, page:2})
			.expect(200, function(err, res) {
				let ret = _.filter(users, function(item) {
					return item.referrals && item.referrals.user === users[0]._id;
				});
				console.log(res.body.data[0]);
				res.body.total.should.equal(ret.length);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});
});