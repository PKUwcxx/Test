const User = require('../models/User');
const { success, error, paginated, notFound } = require('../utils/response');

// 获取所有用户（管理员）
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { role, search, isActive } = req.query;
    
    // 构建查询条件
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    paginated(res, users, { page, limit, total }, '获取用户列表成功');

  } catch (err) {
    next(err);
  }
};

// 根据ID获取用户
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return notFound(res, '用户不存在');
    }

    success(res, user, '获取用户信息成功');

  } catch (err) {
    next(err);
  }
};

// 创建用户（管理员）
const createUser = async (req, res, next) => {
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

    // 返回用户信息（不包含密码）
    const userResponse = await User.findById(user._id).select('-password');

    success(res, userResponse, '创建用户成功', 201);

  } catch (err) {
    next(err);
  }
};

// 更新用户信息（管理员）
const updateUser = async (req, res, next) => {
  try {
    const { username, email, role, profile, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return notFound(res, '用户不存在');
    }

    // 检查用户名和邮箱是否被其他用户使用
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
      if (existingUser) {
        return error(res, '用户名已存在', 400);
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return error(res, '邮箱已存在', 400);
      }
      user.email = email;
    }

    // 更新其他字段
    if (role) user.role = role;
    if (profile) user.profile = { ...user.profile, ...profile };
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const userResponse = await User.findById(user._id).select('-password');

    success(res, userResponse, '更新用户信息成功');

  } catch (err) {
    next(err);
  }
};

// 删除用户（管理员）
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return notFound(res, '用户不存在');
    }

    // 防止删除管理员账户
    if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
      return error(res, '不能删除其他管理员账户', 403);
    }

    await User.findByIdAndDelete(req.params.id);

    success(res, null, '删除用户成功');

  } catch (err) {
    next(err);
  }
};

// 激活/禁用用户（管理员）
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return notFound(res, '用户不存在');
    }

    // 防止禁用自己的账户
    if (req.user._id.toString() === user._id.toString()) {
      return error(res, '不能禁用自己的账户', 400);
    }

    user.isActive = !user.isActive;
    await user.save();

    const userResponse = await User.findById(user._id).select('-password');

    success(res, userResponse, `用户已${user.isActive ? '激活' : '禁用'}`);

  } catch (err) {
    next(err);
  }
};

// 重置用户密码（管理员）
const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return notFound(res, '用户不存在');
    }

    user.password = newPassword;
    await user.save();

    success(res, null, '密码重置成功');

  } catch (err) {
    next(err);
  }
};

// 获取用户统计信息（管理员）
const getUserStats = async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const result = {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      byRole: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          active: stat.active,
          inactive: stat.count - stat.active
        };
        return acc;
      }, {})
    };

    success(res, result, '获取用户统计成功');

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStats
};