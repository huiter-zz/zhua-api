/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const _ = require('lodash');
const users = fixtures.user;
const pages = fixtures.page;
const snapshots = fixtures.snapshot;

describe('POST /pages/:id/fetch/snapshots', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.post('/pages/' + pages[0]._id + '/fetch/snapshots')
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});

	context('id invalid', function() {
		it('页面不存在', function(done) {
			http.post('/pages/1234567654323456/fetch/snapshots')
			.auth(users[0].email, users[0].password)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(40024);
				res.body.errmsg.should.equal('页面不存在');
				done();
			});
		});
	});

	context('id not exist', function() {
		it('页面不存在', function(done) {
			http.post('/pages/585f758acb9c00775aabcff1/fetch/snapshots')
			.auth(users[0].email, users[0].password)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(40024);
				res.body.errmsg.should.equal('页面不存在');
				done();
			});
		});
	});	

	context('create snapshot', function() {
		it('success', function(done) {
			http.post('/pages/' + pages[0]._id + '/fetch/snapshots')
			.auth(users[0].email, users[0].password)
			.expect(200, function(err, res) {
				console.log(res.body);
				res.body.should.have.property('url');
				done();
			});
		});
	});
});