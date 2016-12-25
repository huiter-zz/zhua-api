const router = require('koa-router')();
const users = require('./users');
const mountIP = require('../utils').mountIP;

router.get('/', function *(next) {
	this.status = 200;
	this.body = {
		name: '页面时光机',
		version: '1.0.1',
		desc: '抓页面'
	};
});

router.use('users', mountIP, users.routes());

module.exports = router;
