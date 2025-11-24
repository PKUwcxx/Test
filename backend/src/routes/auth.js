const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin
} = require('../middleware/validation');

// 公开路由
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);

// 需要认证的路由
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/refresh-token', refreshToken);

module.exports = router;