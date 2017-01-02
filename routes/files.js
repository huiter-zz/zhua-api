const router = require('koa-router')();
const fileCtrl = require('../controllers/file');
const auth = require('../service/auth');
const formParser = require('../middlewares/formParser');

// 上传图片
router.post('/upload', auth, formParser(), fileCtrl.upload);

module.exports = router;
