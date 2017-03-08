/**
 * 管理员接口
 */
const router = require('koa-router')();
const adminCtrl = require('../controllers/admin');
const auth = require('../service/auth');

// 是否是管理员
const isAdminRole = function *(next) {
	let user = this.user;
	if (!user.isAdmin) {
        this.status = 400;
        this.body = {
            errcode: -2,
            errmsg: '您没有权限执行此操作，请先登录'
        };
        return;
	} else {
		yield next;
	}
};

// 获取用户列表
router.get('/users/list', auth, isAdminRole, adminCtrl.getUserList);

// 管理员调账（充值，赠送）
router.post('/adjustment', auth, isAdminRole, adminCtrl.adjustment);

module.exports = router;
