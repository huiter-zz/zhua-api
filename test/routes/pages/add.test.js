/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const _ = require('lodash');
const users = fixtures.user;
const logs = fixtures.log;
var data = {
	page: 'http://www.zhua.pm',
	tags: ['抓页面']
};

describe('POST /pages', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.post('/pages')
			.send(data)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});

	context('page is undefined', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			var _data = _.cloneDeep(data);
			delete _data.page;
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40021);
				res.body.errmsg.should.equal('页面地址不正确，必须是以 http 或 https 开头的页面地址。比如：http://www.baidu.com');
				done();
			});
		});
	});	
	
	context('page is invalid', function() {
		it('页面地址不正确', function(done) {
			var _data = _.cloneDeep(data);
			_data.page = 'www.baidu.com';
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40021);
				res.body.errmsg.should.equal('页面地址不正确，必须是以 http 或 https 开头的页面地址。比如：http://www.baidu.com');
				done();
			});
		});
	});	

	context('tags.length > 5', function() {
		it('页面标签数量不能超过5个', function(done) {
			var _data = _.cloneDeep(data);
			_data.tags = ['a' ,'b', 'c', 'd', 3, 4, 5];
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40022);
				res.body.errmsg.should.equal('页面标签数量不能超过 5 个');
				done();
			});
		});
	});	

	context('tags[0].length > 20', function() {
		it('标签内容长度大于 20 个字符', function(done) {
			var _data = _.cloneDeep(data);
			_data.tags = '标签长度大于20 个字符标签长度大于20 个字符标签长度大于20 个字符';
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40023);
				res.body.errmsg.should.equal('标签内容长度不能超过 20 个字符');
				done();
			});
		});
	});

	context('tags[0] is Object', function() {
		it('标签内容不合法', function(done) {
			var _data = _.cloneDeep(data);
			_data.tags = [1, 2, {a: '1'}]
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40023);
				res.body.errmsg.should.equal('标签内容只能是 String 或者 Number 类型');
				done();
			});
		});
	});	

	context('with full data', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(200, function(err, res) {
				res.body.should.have.property('id');
				res.body.page.should.equal(_data.page);
				setTimeout(function() {
					Log.find({
						user: users[0]._id,
						type: Log.types('addPage')
					}, function (err, docs) {
						var _logs = _.filter(logs, function(item) {
							return item.user === users[0]._id && item.type === Log.types('addPage');
						})
						docs.length.should.equal(_logs.length + 1);
						done();
					});
				}, 300);
			});
		});
	});

	context('with full data no tags', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			delete _data.tags;
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(200, function(err, res) {
				res.body.should.have.property('id');
				res.body.page.should.equal(_data.page);
				setTimeout(function() {
					Log.find({
						user: users[0]._id,
						type: Log.types('addPage')
					}, function (err, docs) {
						var _logs = _.filter(logs, function(item) {
							return item.user === users[0]._id && item.type === Log.types('addPage');
						})
						docs.length.should.equal(_logs.length + 1);
						done();
					});
				}, 300);
			});
		});
	});		
});