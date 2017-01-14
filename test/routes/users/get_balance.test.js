/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const users = fixtures.user;
const propertys = fixtures.property;
const _ = require('lodash');

describe('GET /users/balances', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.get('/users/balances')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});

	context('without login', function() {
		it('success', function(done) {
			http.get('/users/balances')
			.auth(users[0].email, users[0].password)
			.expect(200, function(err, res) {
				res.body.cash.should.equal(propertys[0].cash);
				res.body.gift.should.equal(propertys[0].gift);
				done();
			});
		});
	});

});