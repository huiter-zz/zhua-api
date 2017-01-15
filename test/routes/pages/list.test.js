/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const _ = require('lodash');
const users = fixtures.user;
const pages = fixtures.page;

describe('GET /pages', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.get('/pages')
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});

	context('list pages 1', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.expect(200, function(err, res) {
				var _pages = _.filter(pages, function(item) {
					return item.user === users[0]._id && !item.del;
				});
				res.body.total.should.equal(_pages.length);
				res.body.data.length.should.equal(_pages.length);
				done();
			});
		});
	});	
	
	context('list pages 2', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({count: 1200, page: 1})
			.expect(200, function(err, res) {
				var _pages = _.filter(pages, function(item) {
					return item.user === users[0]._id && !item.del;
				});
				res.body.total.should.equal(_pages.length);
				res.body.data.length.should.equal(_pages.length);
				done();
			});
		});
	});	

	
	context('list pages 3', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({count: 2, page: 2})
			.expect(200, function(err, res) {
				var _pages = _.filter(pages, function(item) {
					return item.user === users[0]._id && !item.del;
				});
				res.body.total.should.equal(_pages.length);
				res.body.data.length.should.equal(_pages.length - 2);
				done();
			});
		});
	});

	context('list pages 4', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({id: pages[0]._id})
			.expect(200, function(err, res) {
				res.body.total.should.equal(1);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});

	context('list pages 5', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({keyword: '贴吧'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(1);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});	

	context('list pages 6', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({keyword: '百度'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(2);
				res.body.data.length.should.equal(2);
				done();
			});
		});
	});	

	context('list pages 7', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({keyword: '度'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(2);
				res.body.data.length.should.equal(2);
				done();
			});
		});
	});	

	context('list pages 8', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({tags: '度'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(0);
				res.body.data.length.should.equal(0);
				done();
			});
		});
	});	

	context('list pages 9', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({tags: '百度'})
			.expect(200, function(err, res) {
				res.body.total.should.equal(2);
				res.body.data.length.should.equal(2);
				done();
			});
		});
	});		

	context('list pages 10', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({tags: ['百度']})
			.expect(200, function(err, res) {
				res.body.total.should.equal(2);
				res.body.data.length.should.equal(2);
				done();
			});
		});
	});	

	context('list pages 10', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({tags: ['百度', '贴吧']})
			.expect(200, function(err, res) {
				res.body.total.should.equal(1);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});	

	context('list pages 11', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({tags: ['贴吧', '百度']})
			.expect(200, function(err, res) {
				res.body.total.should.equal(1);
				res.body.data.length.should.equal(1);
				done();
			});
		});
	});	


	context('list pages 12', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({tags: ['百度', 'SENSORO']})
			.expect(200, function(err, res) {
				res.body.total.should.equal(0);
				res.body.data.length.should.equal(0);
				done();
			});
		});
	});	

	context('list pages 13', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({tags: ['SENSORO', '百度']})
			.expect(200, function(err, res) {
				res.body.total.should.equal(0);
				res.body.data.length.should.equal(0);
				done();
			});
		});
	});	

	context('list pages 14', function() {
		it('success', function(done) {
			http.get('/pages')
			.auth(users[0].email, users[0].password)
			.query({count: 2, page: 1})
			.expect(200, function(err, res) {
				var _pages = _.filter(pages, function(item) {
					return item.user === users[0]._id && !item.del;
				});
				res.body.total.should.equal(_pages.length);
				res.body.data.length.should.equal(2);
				done();
			});
		});
	});	
});