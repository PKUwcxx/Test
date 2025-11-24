const { verifyToken, extractToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/response');
const User = require('../models/User');

// 验证用户身份
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return unauthorized(res, '请提供访问令牌');
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return unauthorized(res, '用户不存在');
    }

    if (!user.isActive) {
      return unauthorized(res, '用户账户已被禁用');
    }

    req.user = user;
    next();
  } catch (error) {
    return unauthorized(res, '无效的访问令牌');
  }
};

// 验证用户角色
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, '请先登录');
    }

    if (!roles.includes(req.user.role)) {
      return forbidden(res, '权限不足');
    }

    next();
  };
};

// 验证管理员权限
const requireAdmin = authorize('admin');

// 验证教师权限（包括管理员）
const requireTeacher = authorize('admin', 'teacher');

// 验证家长权限（包括管理员和教师）
const requireParent = authorize('admin', 'teacher', 'parent');

// 验证资源所有者或管理员
const requireOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceUserId = await getResourceUserId(req);
      
      if (req.user._id.toString() !== resourceUserId.toString()) {
        return forbidden(res, '只能访问自己的资源');
      }

      next();
    } catch (error) {
      return forbidden(res, '权限验证失败');
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireTeacher,
  requireParent,
  requireOwnerOrAdmin
};