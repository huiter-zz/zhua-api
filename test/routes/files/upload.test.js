/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const _ = require('lodash');
const users = fixtures.user;
const logs = fixtures.log;

describe('POST /files/upload', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.post('/files/upload')
			.attach('file', __dirname + '/b0.jpg')
			.expect(400, function(err, res) {
				console.log(res.body);
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});

	context('upload', function() {
		it('success', function(done) {
			http.post('/files/upload')
			.auth(users[0].email, users[0].password)
			.attach('file', __dirname + '/a.jpeg')
			.expect(200, function(err, res) {
				res.body.url.should.equal('http://oj54bwg6q.bkt.clouddn.com/fc0843a81e656a8c57320de42d4ddf70.jpeg');
				Log.find({user: users[0]._id, type: 'uploadFile'}, function(err, docs) {
					docs.length.should.equal(1);
					docs[0].type.should.equal('uploadFile');
					docs[0].ip.should.equal('127.0.0.1');
					done();
				});				
			});
		});
	});	

});