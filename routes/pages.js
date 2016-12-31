const router = require('koa-router')();
const pageCtrl = require('../controllers/page');
const auth = require('../service/auth');

// 添加一个页面
router.post('/', auth, pageCtrl.add);

// 修改页面标签
router.put('/:id', auth, pageCtrl.update);

// 列表页面
router.get('/', auth, pageCtrl.list);

// 删除页面
router.delete('/:id', auth, pageCtrl.remove);

module.exports = router;
