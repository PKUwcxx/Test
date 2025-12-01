const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStats
} = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');

// 所有路由都需要认证
router.use(authenticate);

// 管理员专用路由
router.get('/', requireAdmin, validatePagination, getAllUsers);
router.get('/stats', requireAdmin, getUserStats);
router.post('/', requireAdmin, validateUserRegistration, createUser);
router.put('/:id', requireAdmin, validateObjectId(), updateUser);
router.delete('/:id', requireAdmin, validateObjectId(), deleteUser);
router.patch('/:id/toggle-status', requireAdmin, validateObjectId(), toggleUserStatus);
router.patch('/:id/reset-password', requireAdmin, validateObjectId(), resetUserPassword);

// 通用路由（管理员和教师可访问）
router.get('/:id', validateObjectId(), getUserById);

module.exports = router;