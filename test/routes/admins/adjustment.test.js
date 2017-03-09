/* global describe: true, context: true, it: true, http:true */
'use strict';
const sinon = require('sinon');
const fixtures = require('../../load_fixtures');
const Log = require('../../../model').Log;
const Property = require('../../../model').Property;
const User = require('../../../model').User;
const users = fixtures.user;
const logs = fixtures.log;
const propertys = fixtures.property;
const _ = require('lodash');

describe('POST /admins/adjustment', function() {

	context('without login', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.post('/admins/adjustment')
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});
		
	context('not admin', function() {
		it('您没有权限执行此操作，请先登录', function(done) {
			http.post('/admins/adjustment')
			.auth(users[0].email, users[0].password)
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(-2);
				res.body.errmsg.should.equal('您没有权限执行此操作，请先登录');
				done();
			});
		});
	});
		
	context('Giving the user 10 yuan ', function() {
		it('success', function(done) {
			http.post('/admins/adjustment')
			.auth(users[3].email, users[3].password)
			.send({uid: users[0]._id, type: 'gift', amount: 1000})
			.expect(200, function(err, res) {
				res.body.result.should.equal('success');
				var user_0 = _.find(propertys, function(item) { return item.user === users[0]._id; });
				Property.findOne({user: users[0]._id}, function(err, doc1) {
					doc1.gift.should.equal((user_0.gift || 0) + 1000);
					Log.find({user: users[0]._id}).sort({createdTime: -1}).limit(1).exec(function(err, docs) {
						docs[0].type.should.equal('gift');
						docs[0].data.by.should.equal('adjustment');
						docs[0].data.uid.should.equal(users[3]._id);
						docs[0].data.amount.should.equal(1000);
						done();
					});
				});
			});
		});
	});

	context('uid invalid 1', function() {
		it('用户不存在', function(done) {
			http.post('/admins/adjustment')
			.auth(users[3].email, users[3].password)
			.send({type: 'gift', amount: 1000})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40008);
				res.body.errmsg.should.equal('用户不存在');
				done();
			});
		});
	});	

	context('uid invalid 2', function() {
		it('用户不存在', function(done) {
			http.post('/admins/adjustment')
			.auth(users[3].email, users[3].password)
			.send({uid: '1234567890', type: 'gift', amount: 1000})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40008);
				res.body.errmsg.should.equal('用户不存在');
				done();
			});
		});
	});	

	context('type invalid', function() {
		it('调账类型不合法', function(done) {
			http.post('/admins/adjustment')
			.auth(users[3].email, users[3].password)
			.send({uid: users[0]._id, type: 'gifts', amount: 1000})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40031);
				res.body.errmsg.should.equal('调账类型不合法');
				done();
			});
		});
	});

	context('amount invalid 1', function() {
		it('调账类型不合法', function(done) {
			http.post('/admins/adjustment')
			.auth(users[3].email, users[3].password)
			.send({uid: users[0]._id, type: 'gift', amount: 0})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40032);
				res.body.errmsg.should.equal('调账金额必须大于 0');
				done();
			});
		});
	});	

	context('amount invalid 2', function() {
		it('调账类型不合法', function(done) {
			http.post('/admins/adjustment')
			.auth(users[3].email, users[3].password)
			.send({uid: users[0]._id, type: 'gift', amount: -1000})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40032);
				res.body.errmsg.should.equal('调账金额必须大于 0');
				done();
			});
		});
	});		


	context('uid not exist', function() {
		it('用户不存在', function(done) {
			http.post('/admins/adjustment')
			.auth(users[3].email, users[3].password)
			.send({uid: '585f758acb9c00775abeb091', type: 'gift', amount: 1000})
			.expect(400, function(err, res) {
				res.body.errcode.should.equal(40008);
				res.body.errmsg.should.equal('用户不存在');
				done();
			});
		});
	});

	context('adjust failure', function() {
		it('调账失败', function(done) {
			let stub = sinon.stub(Property, 'findOneAndUpdate', function(p1, p2) {
				return Promise.reject(new Error('failure'));
			});
			http.post('/admins/adjustment')
			.auth(users[3].email, users[3].password)
			.send({uid: users[0]._id, type: 'gift', amount: 1000})
			.expect(400, function(err, res) {
				stub.restore();
				res.body.errcode.should.equal(40033);
				res.body.errmsg.should.equal('调账失败');
				done();
			});
		});
	});

	context('user cash 10 yuan ', function() {
		it('success', function(done) {
			http.post('/admins/adjustment')
			.auth(users[3].email, users[3].password)
			.send({uid: users[2]._id, type: 'cash', amount: 1300})
			.expect(200, function(err, res) {
				res.body.result.should.equal('success');
				var user_2 = _.find(propertys, function(item) { return item.user === users[2]._id; });
				var user_0 = _.find(propertys, function(item) { return item.user === users[2].referrals.user; });
				User.findOne({_id: users[2]._id}, function(err, doc) {
					console.log(doc);
					Property.findOne({user: users[2]._id}, function(err, doc1) {
						doc1.cash.should.equal((user_2.cash || 0) + 1300);
						Log.find({user: users[2]._id}).sort({createdTime: -1}).limit(1).exec(function(err, docs) {
							docs[0].type.should.equal('cash');
							docs[0].data.by.should.equal('adjustment');
							docs[0].data.uid.should.equal(users[3]._id);
							docs[0].data.amount.should.equal(1300);
							Property.findOne({user: users[0]._id}, function(err, doc1) {
								doc1.gift.should.equal((user_0.gift || 0) + 1300);
								Log.find({user: users[0]._id}).sort({createdTime: -1}).limit(1).exec(function(err, docs) {
									console.log(docs[0].data.uid, user_2.user)
									docs[0].type.should.equal('gift');
									docs[0].data.by.should.equal('invitation');
									docs[0].data.uid.should.equal(user_2.user);
									docs[0].data.amount.should.equal(1300);
									done();
								});
							});
						});
					});
				})
			});
		});
	});	
});