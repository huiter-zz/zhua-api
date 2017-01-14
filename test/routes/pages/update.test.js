/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const _ = require('lodash');
const users = fixtures.user;
const logs = fixtures.log;
const pages = fixtures.page;

var data = {
	title: '123456',
	tags: ['抓页面']
};

describe('PUT /pages:/pid', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.put('/pages/' + pages[0]._id)
			.send(data)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});

	context('tags.length > 5', function() {
		it('页面标签数量不能超过5个', function(done) {
			var _data = _.cloneDeep(data);
			_data.tags = ['a' ,'b', 'c', 'd', 3, 4, 5];
			http.put('/pages/' + pages[0]._id)
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				console.log(res.body);
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
			http.put('/pages/' + pages[0]._id)
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
			http.put('/pages/' + pages[0]._id)
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40023);
				res.body.errmsg.should.equal('标签内容只能是 String 或者 Number 类型');
				done();
			});
		});
	});	

	context('pid not exist', function() {
		it('页面不存在', function(done) {
			var _data = _.cloneDeep(data);
			http.put('/pages/585f758acb9c00775aabcea4')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40024);
				res.body.errmsg.should.equal('页面不存在');
				done();
			});
		});
	});	
	context('with full data', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			http.put('/pages/' + pages[0]._id)
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(200, function(err, res) {
				res.body.should.have.property('id');
				setTimeout(function() {
					Log.find({
						user: users[0]._id,
						type: Log.types('updatePage')
					}, function (err, docs) {
						var _logs = _.filter(logs, function(item) {
							return item.user === users[0]._id && item.type === Log.types('updatePage');
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
			http.put('/pages/' + pages[0]._id)
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(200, function(err, res) {
				res.body.should.have.property('id');
				setTimeout(function() {
					Log.find({
						user: users[0]._id,
						type: Log.types('updatePage')
					}, function (err, docs) {
						var _logs = _.filter(logs, function(item) {
							return item.user === users[0]._id && item.type === Log.types('updatePage');
						})
						docs.length.should.equal(_logs.length + 1);
						done();
					});
				}, 300);
			});
		});
	});

	context('without title', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			delete _data.title;
			http.put('/pages/' + pages[0]._id)
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40027);
				res.body.errmsg.should.equal('页面标题不能为空，长度不能大于 50 位');
				done();
			});
		});
	});

	context('title.length > 50', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.title = '页面标题页面标题页面标题页面标题页面标题页面标题页面标题页面标题页面标题页面标题页面标题页面标题asdf';
			http.put('/pages/' + pages[0]._id)
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(40027);
				res.body.errmsg.should.equal('页面标题不能为空，长度不能大于 50 位');
				done();
			});
		});
	});		
});