const router = require('koa-router')();
const users = require('./users');
const pages = require('./pages');
const files = require('./files');
const admins = require('./admins');
const mountIP = require('../utils').mountIP;

router.get('/', function *(next) {
	this.status = 200;
	this.body = {
		name: '页面时光机',
		version: '1.0.1',
		desc: '抓页面'
	};
});

router.use('/users', mountIP, users.routes());

router.use('/pages', mountIP, pages.routes());

router.use('/files', mountIP, files.routes());

router.use('/admins', mountIP, admins.routes());

module.exports = router;
