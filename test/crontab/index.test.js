/* global describe: true, context: true, it: true, http:true */
'use strict';
const config = require('config');
const _ = require('lodash');
const exec = require('child_process').exec;

const comment = '#zhua-page';

describe('Crontab', function() {

	context('load crontab', function() {
		it('success', function(done) {
			require('../../crontab');
			exec('crontab -l', function(err, ret) {
				ret = (ret || '').split('\n');
				let projectPath = (__dirname).replace('test/crontab', '') + 'crontab/';
				let crontabs = _.compact(_.map(ret, function(s) {
					var r;
					if ((s || '').indexOf(comment) > -1) {
						let arr = s.split(/ +/);
						_.each(arr, function(a) {
							if (a.indexOf(projectPath) > -1) {
								r = a.replace(projectPath, '');
								r = r.split('.')[0];
							}
						});
					}
					return r;
				}));

				_.each(config.crontab, function(item, name) {
					if (name !== 'nodeCommand' && name !== 'shellCommand') {
						let index = crontabs.indexOf(name)
						index.should.above(-1);
					}
				});
				done();
			});
		});
	});
});