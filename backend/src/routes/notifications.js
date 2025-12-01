const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, requireAdmin, requireTeacher } = require('../middleware/auth');
const { validateNotificationCreation } = require('../middleware/validation');

// 所有路由都需要认证
router.use(authenticate);

// 获取通知列表
router.get('/', notificationController.getNotifications);

// 获取未读通知数量
router.get('/unread-count', notificationController.getUnreadCount);

// 获取通知统计信息 (管理员和教师)
router.get('/stats', requireTeacher, notificationController.getNotificationStats);

// 批量标记为已读
router.put('/mark-all-read', notificationController.markAllAsRead);

// 获取通知详情
router.get('/:id', notificationController.getNotification);

// 创建通知 (管理员和教师)
router.post('/', requireTeacher, validateNotificationCreation, notificationController.createNotification);

// 更新通知 (管理员和教师)
router.put('/:id', requireTeacher, validateNotificationCreation, notificationController.updateNotification);

// 删除通知 (管理员和教师)
router.delete('/:id', requireTeacher, notificationController.deleteNotification);

// 标记通知为已读
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;