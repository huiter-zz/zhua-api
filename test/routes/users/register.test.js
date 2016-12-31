/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;



describe('POST /users/register', function() {

	context('without email and password', function() {
		it('邮件地址不合法', function(done) {
			http.post('/users/register')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40001);
				res.body.errmsg.should.equal('邮件地址不合法');
				done();
			});
		});
	});

	context('without email', function() {
		it('邮件地址不合法', function(done) {
			http.post('/users/register')
			.send({password: '123456'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40001);
				res.body.errmsg.should.equal('邮件地址不合法');
				done();
			});
		});
	});

	context('without password', function() {
		it('密码不合法', function(done) {
			http.post('/users/register')
			.send({email: 'test@zhua.pm'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40002);
				res.body.errmsg.should.equal('密码不合法，密码长度必须大于 6 位并小于 50 位');
				done();
			});
		});
	});

	context('password.length < 6', function() {
		it('密码不合法', function(done) {
			http.post('/users/register')
			.send({email: 'test@zhua.pm', password: '12345'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40002);
				res.body.errmsg.should.equal('密码不合法，密码长度必须大于 6 位并小于 50 位');
				done();
			});
		});
	});

	context('password.length > 50', function() {
		it('密码不合法', function(done) {
			http.post('/users/register')
			.send({email: 'test@zhua.pm', password: '1234567890123456789012345678901234567890123456789012'})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40002);
				res.body.errmsg.should.equal('密码不合法，密码长度必须大于 6 位并小于 50 位');
				done();
			});
		});
	});	

	context('with right email and password', function() {
		it('success', function(done) {
			http.post('/users/register')
			.send({email: 'test@zhua.pm', password: '123456'})
			.set('x-real-ip', '134.45.45.45')
			.expect(200, function(err, res) {
				res.body.should.have.property('uid');
				console.log(res.body);
				Log.find({user: res.body.uid}, function(err, docs) {
					docs.length.should.equal(1);
					docs[0].type.should.equal('register');
					docs[0].ip.should.equal('127.0.0.1');
					done();
				});
			});
		});
	});		
});