/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const _ = require('lodash');
const users = fixtures.user;
const logs = fixtures.log;
const pages = fixtures.page;

describe('DELETE /pages:/pid', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.del('/pages/' + pages[0]._id)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});

	context('pid not exist', function() {
		it('页面不存在', function(done) {
			http.del('/pages/585f758acb9c00775aabcea4')
			.auth(users[0].email, users[0].password)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(40024);
				res.body.errmsg.should.equal('页面不存在');
				done();
			});
		});
	});	

	context('with full data', function() {
		it('success', function(done) {
			http.del('/pages/' + pages[0]._id)
			.auth(users[0].email, users[0].password)
			.expect(200, function(err, res) {
				res.body.result.should.equal('success');
				setTimeout(function() {
					Log.find({
						user: users[0]._id,
						type: Log.types('delPage')
					}, function (err, docs) {
						var _logs = _.filter(logs, function(item) {
							return item.user === users[0]._id && item.type === Log.types('delPage');
						})
						docs.length.should.equal(_logs.length + 1);
						done();
					});
				}, 300);
			});
		});
	});	
});