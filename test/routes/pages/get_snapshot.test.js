/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const _ = require('lodash');
const users = fixtures.user;
const pages = fixtures.page;
const snapshots = fixtures.snapshot;

describe('GET /pages/:id/snapshots', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.get('/pages/' + pages[0]._id + '/snapshots')
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
			http.get('/pages/1234567654323456/snapshots')
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
			http.get('/pages/585f758acb9c00775aabcff1/snapshots')
			.auth(users[0].email, users[0].password)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(40024);
				res.body.errmsg.should.equal('页面不存在');
				done();
			});
		});
	});	

	context('get snapshots list', function() {
		it('success', function(done) {
			http.get('/pages/' + pages[0]._id + '/snapshots')
			.auth(users[0].email, users[0].password)
			.expect(200, function(err, res) {
				let data = _.filter(snapshots, function(item) {
					return item.pid === pages[0]._id;
				});
				res.body.total.should.equal(data.length);
				res.body.data.length.should.equal(data.length);
				done();
			});
		});
	});

	context('get snapshots list count = 3', function() {
		it('success', function(done) {
			http.get('/pages/' + pages[0]._id + '/snapshots')
			.auth(users[0].email, users[0].password)
			.query({count: 3})
			.expect(200, function(err, res) {
				let data = _.filter(snapshots, function(item) {
					return item.pid === pages[0]._id;
				});
				res.body.total.should.equal(data.length);
				res.body.data.length.should.equal(3);
				done();
			});
		});
	});		

	context('get snapshots list count = 3 and page = 2', function() {
		it('success', function(done) {
			http.get('/pages/' + pages[0]._id + '/snapshots')
			.auth(users[0].email, users[0].password)
			.query({count: 3, page: 2})
			.expect(200, function(err, res) {
				let data = _.filter(snapshots, function(item) {
					return item.pid === pages[0]._id;
				});
				let len = data.length - 3;
				if (len > 3) len = 3;
				res.body.total.should.equal(data.length);
				res.body.data.length.should.equal(len);
				done();
			});
		});
	});	

	context('get snapshots list stime and etime', function() {
		it('success', function(done) {
			let data = _.filter(snapshots, function(item) {
				return item.pid === pages[0]._id;
			});
			data = _.sortBy(data, function(item) {
				return -item.createdTime;
			})
			http.get('/pages/' + pages[0]._id + '/snapshots')
			.auth(users[0].email, users[0].password)
			.query({stime: data[data.length - 2].createdTime, etime: data[1].createdTime})
			.expect(200, function(err, res) {
				res.body.total.should.equal(data.length - 2);
				res.body.data.length.should.equal(data.length - 2);
				done();
			});
		});
	});		
});