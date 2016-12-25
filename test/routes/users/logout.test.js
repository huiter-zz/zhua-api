/* global describe: true, context: true, it: true, http:true */
'use strict';

const fixtures = require('../../load_fixtures');
const users = fixtures.user;

describe('POST /users/login', function() {	

	context('new user login', function() {
		it('success', function(done) {
			http.post('/users/login')
			.send({email: users[2].email, password: users[2].password})
			.set('x-real-ip', '134.45.45.45')
			.expect(200, function(err, res) {
				res.body.should.have.property('uid');
				http.del('/users/logout')
				.set('cookie', res.headers['set-cookie'])
				.expect(200, function(err, result) {
					result.body.result.should.equal('success');
					done();
				});
			});
		});
	});	
});