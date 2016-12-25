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
router.delete('/logout', userCtrl.logout);


module.exports = router;
