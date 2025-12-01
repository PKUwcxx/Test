const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { success, error, unauthorized } = require('../utils/response');

// 用户注册
const register = async (req, res, next) => {
  try {
    const { username, email, password, role, profile } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return error(res, '用户名或邮箱已存在', 400);
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      role: role || 'parent',
      profile
    });

    await user.save();

    // 生成JWT token
    const token = generateToken({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    success(res, {
      user: userResponse,
      token
    }, '注册成功', 201);

  } catch (err) {
    next(err);
  }
};

// 用户登录
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return unauthorized(res, '邮箱或密码错误');
    }

    // 检查账户是否激活
    if (!user.isActive) {
      return unauthorized(res, '账户已被禁用，请联系管理员');
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return unauthorized(res, '邮箱或密码错误');
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成JWT token
    const token = generateToken({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    success(res, {
      user: userResponse,
      token
    }, '登录成功');

  } catch (err) {
    next(err);
  }
};

// 获取当前用户信息
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return error(res, '用户不存在', 404);
    }

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    success(res, userResponse, '获取用户信息成功');

  } catch (err) {
    next(err);
  }
};

// 更新用户资料
const updateProfile = async (req, res, next) => {
  try {
    const { profile } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return error(res, '用户不存在', 404);
    }

    // 更新用户资料
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    await user.save();

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isActive: user.isActive,
      updatedAt: user.updatedAt
    };

    success(res, userResponse, '更新资料成功');

  } catch (err) {
    next(err);
  }
};

// 修改密码
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return error(res, '用户不存在', 404);
    }

    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return error(res, '当前密码错误', 400);
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    success(res, null, '密码修改成功');

  } catch (err) {
    next(err);
  }
};

// 刷新token
const refreshToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || !user.isActive) {
      return unauthorized(res, '用户不存在或已被禁用');
    }

    // 生成新的JWT token
    const token = generateToken({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    success(res, { token }, 'Token刷新成功');

  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
};