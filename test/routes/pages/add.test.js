/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const Page = require('../../../model').Page;
const _ = require('lodash');
const users = fixtures.user;
const logs = fixtures.log;
var data = {
	page: 'http://www.baidu.com',
	title: 'zhua',
	tags: ['抓页面'],
	setting: {
		size: '1920x780',
		delay: 2
	}
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

	context('setting.size invalid 1', function() {
		it('标签内容不合法', function(done) {
			var _data = _.cloneDeep(data);
			_data.setting.size = '1920*780';
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(40025);
				res.body.errmsg.should.equal('页面配置 size 格式不合法，格式应该为 1920x780 样式');
				done();
			});
		});
	});	

	context('setting.size invalid 2', function() {
		it('标签内容不合法', function(done) {
			var _data = _.cloneDeep(data);
			_data.setting.size = '1920xabc';
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(40025);
				res.body.errmsg.should.equal('页面配置 size 格式不合法，格式应该为 1920x780 样式');
				done();
			});
		});
	});

	context('setting.size invalid 3', function() {
		it('标签内容不合法', function(done) {
			var _data = _.cloneDeep(data);
			_data.setting.size = [['a'], '1920x780'];
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(40025);
				res.body.errmsg.should.equal('页面配置 size 格式不合法，格式应该为 1920x780 样式');
				done();
			});
		});
	});

	context('setting.delay invalid', function() {
		it('标签内容不合法', function(done) {
			var _data = _.cloneDeep(data);
			_data.setting.delay = 11;
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(40026);
				res.body.errmsg.should.equal('页面抓取延时时间不能超过 10 秒');
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
				res.body.status.should.equal('fetching');
				setTimeout(function() {
					Log.find({
						user: users[0]._id,
						type: Log.types('addPage')
					}, function (err, docs) {
						var _logs = _.filter(logs, function(item) {
							return item.user === users[0]._id && item.type === Log.types('addPage');
						})
						docs.length.should.equal(_logs.length + 1);
						Page.findOne({
							_id: res.body.id
						}, function(err, doc) {
							console.log(doc);
							doc.status.should.equal('normal');
							doc.image.indexOf('http://oj54bwg6q.bkt.clouddn.com/').should.equal(0);
							done();
						})
					});
				}, 8000);
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

	context('without setting', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			delete _data.setting;
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

	context('without title', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			delete _data.title;
			http.post('/pages')
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
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40027);
				res.body.errmsg.should.equal('页面标题不能为空，长度不能大于 50 位');
				done();
			});
		});
	});			


	context('expectFetchTime.hour < 0', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				hour: -1,
				minute: 30
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40028);
				res.body.errmsg.should.equal('抓取时间时间不合法，hour 必须大于 0 并且小于 24');
				done();
			});
		});
	});	


	context('expectFetchTime.hour > 23', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				hour: 24,
				minute: 30
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40028);
				res.body.errmsg.should.equal('抓取时间时间不合法，hour 必须大于 0 并且小于 24');
				done();
			});
		});
	});	

	context('expectFetchTime.minute < 0', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				hour: 8,
				minute: -1
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40028);
				res.body.errmsg.should.equal('抓取时间时间不合法，minute 必须大于 0 并且小于 60');
				done();
			});
		});
	});	

	context('expectFetchTime.minute > 59', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				hour: 8,
				minute: 60
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40028);
				res.body.errmsg.should.equal('抓取时间时间不合法，minute 必须大于 0 并且小于 60');
				done();
			});
		});
	});		


	context('without expectFetchTime.minute', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				hour: 8
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40028);
				res.body.errmsg.should.equal('抓取时间时间不合法，hour 和 minute 参数必须同时存在');
				done();
			});
		});
	});

	context('without expectFetchTime.hour', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				minute: 30
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40028);
				res.body.errmsg.should.equal('抓取时间时间不合法，hour 和 minute 参数必须同时存在');
				done();
			});
		});
	});	

	context('expectFetchTime right 1', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				hour: 8,
				minute: 30
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(200, function(err, res) {
				res.body.should.have.property('id');
				res.body.expectFetchTime.hour.should.equal(8);
				res.body.expectFetchTime.minute.should.equal(30);
				done();
			});
		});
	});	

	context('expectFetchTime right 2', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				hour: 23,
				minute: 59
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(200, function(err, res) {
				res.body.should.have.property('id');
				res.body.expectFetchTime.hour.should.equal(23);
				res.body.expectFetchTime.minute.should.equal(59);
				done();
			});
		});
	});

	context('expectFetchTime right 3', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				hour: 0,
				minute: 59
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(200, function(err, res) {
				res.body.should.have.property('id');
				res.body.expectFetchTime.hour.should.equal(0);
				res.body.expectFetchTime.minute.should.equal(59);
				done();
			});
		});
	});		

	context('expectFetchTime right 3', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				hour: 8,
				minute: 0
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(200, function(err, res) {
				res.body.should.have.property('id');
				res.body.expectFetchTime.hour.should.equal(8);
				res.body.expectFetchTime.minute.should.equal(0);
				done();
			});
		});
	});

	context('expectFetchTime right 3', function() {
		it('success', function(done) {
			var _data = _.cloneDeep(data);
			_data.expectFetchTime = {
				hour: 0,
				minute: 0
			};
			http.post('/pages')
			.auth(users[0].email, users[0].password)
			.send(_data)
			.expect(200, function(err, res) {
				res.body.should.have.property('id');
				res.body.expectFetchTime.hour.should.equal(0);
				res.body.expectFetchTime.minute.should.equal(0);
				done();
			});
		});
	});	
});