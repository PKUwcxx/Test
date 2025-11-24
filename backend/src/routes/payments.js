const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, requireAdmin, requireParent } = require('../middleware/auth');
const { validatePaymentCreation } = require('../middleware/validation');

// 所有路由都需要认证
router.use(authenticate);

// 获取支付记录列表
router.get('/', paymentController.getPayments);

// 获取财务统计信息 (仅管理员)
router.get('/stats', requireAdmin, paymentController.getFinancialStats);

// 生成财务报表 (仅管理员)
router.get('/reports', requireAdmin, paymentController.generateReport);

// 获取支付记录详情
router.get('/:id', paymentController.getPayment);

// 创建支付记录 (仅管理员)
router.post('/', requireAdmin, validatePaymentCreation, paymentController.createPayment);

// 批量创建支付记录 (仅管理员)
router.post('/batch', requireAdmin, paymentController.batchCreatePayments);

// 更新支付记录 (仅管理员)
router.put('/:id', requireAdmin, validatePaymentCreation, paymentController.updatePayment);

// 删除支付记录 (仅管理员)
router.delete('/:id', requireAdmin, paymentController.deletePayment);

// 处理支付 (管理员和家长)
router.post('/:id/pay', requireParent, paymentController.processPayment);

module.exports = router;