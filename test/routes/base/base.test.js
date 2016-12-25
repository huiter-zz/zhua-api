/* global describe: true, context: true, it: true, http:true */
'use strict';

describe('GET /', function() {

	context('version', function() {
		it('success', function(done) {
			http.get('/')
			.expect(200, function(err, res) {
				res.body.version.should.equal('1.0.1');
				done();
			});
		});
	});
});