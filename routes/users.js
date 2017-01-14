const router = require('koa-router')();
const userCtrl = require('../controllers/user');
const auth = require('../service/auth');

// 注册
router.post('/register', userCtrl.register);

// 登录
router.post('/login', userCtrl.login);

// 获取用户信息，验证用户是否登录
router.get('/me', auth, userCtrl.getInfo);

// 修改信息
router.put('/me', auth, userCtrl.updateInfo);

// 修改密码
router.put('/me/password', auth, userCtrl.resetPassword);

// 登出
router.delete('/logout', auth, userCtrl.logout);

// 获取余额
router.get('/balances', auth, userCtrl.getBalance);

// 获取已邀请的用户列表
router.get('/invitations', auth, userCtrl.getInvitationUsers);

// 获取自己的操作记录 <注册，登陆，修改信息，添加页面，修改页面，修改密码，充值，赠送，扣费 >
router.get('/logs', auth, userCtrl.getLogs);


module.exports = router;
