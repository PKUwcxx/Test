const Notification = require('../models/Notification');
const User = require('../models/User');
const Class = require('../models/Class');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/response');

// 获取通知列表
exports.getNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      priority,
      status,
      search
    } = req.query;

    // 构建查询条件
    const query = {};
    
    // 根据用户角色过滤通知
    if (req.user.role === 'parent') {
      // 家长只能看到发给自己的通知
      query.$or = [
        { 'recipients.type': 'all' },
        { 'recipients.type': 'role', 'recipients.values': 'parent' },
        { 'recipients.type': 'individual', 'recipients.values': req.user._id }
      ];
    } else if (req.user.role === 'teacher') {
      // 教师可以看到发给自己和所有人的通知
      query.$or = [
        { 'recipients.type': 'all' },
        { 'recipients.type': 'role', 'recipients.values': { $in: ['teacher', 'all'] } },
        { 'recipients.type': 'individual', 'recipients.values': req.user._id },
        { author: req.user._id }
      ];
    }
    // 管理员可以看到所有通知
    
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (status) query.status = status;

    // 分页查询
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const notifications = await Notification.find(query)
      .populate('author', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    successResponse(res, {
      notifications,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, '获取通知列表成功');
  } catch (error) {
    console.error('获取通知列表失败:', error);
    errorResponse(res, '获取通知列表失败', 500);
  }
};

// 获取通知详情
exports.getNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('author', 'username profile.firstName profile.lastName')
      .populate('recipients.values', 'username profile.firstName profile.lastName');
    
    if (!notification) {
      return errorResponse(res, '通知不存在', 404);
    }

    // 检查权限
    if (req.user.role === 'parent') {
      const canView = notification.recipients.type === 'all' ||
        (notification.recipients.type === 'role' && notification.recipients.values.includes('parent')) ||
        (notification.recipients.type === 'individual' && notification.recipients.values.includes(req.user._id));
      
      if (!canView) {
        return errorResponse(res, '无权查看此通知', 403);
      }
    }

    // 标记为已读
    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    successResponse(res, notification, '获取通知详情成功');
  } catch (error) {
    console.error('获取通知详情失败:', error);
    errorResponse(res, '获取通知详情失败', 500);
  }
};

// 创建通知
exports.createNotification = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, '输入数据有误', 400, errors.array());
    }

    // 只有管理员和教师可以创建通知
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return errorResponse(res, '无权创建通知', 403);
    }

    const notificationData = {
      ...req.body,
      author: req.user._id
    };

    // 处理收件人
    if (req.body.recipients.type === 'class') {
      // 如果是发给班级，获取班级中的所有学生家长
      const classObj = await Class.findById(req.body.recipients.values[0])
        .populate('students');
      
      if (classObj) {
        const parentIds = classObj.students.map(student => student.parentId).filter(Boolean);
        notificationData.recipients = {
          type: 'individual',
          values: parentIds
        };
      }
    }

    const notification = new Notification(notificationData);
    await notification.save();

    const populatedNotification = await Notification.findById(notification._id)
      .populate('author', 'username profile.firstName profile.lastName');

    successResponse(res, populatedNotification, '创建通知成功', 201);
  } catch (error) {
    console.error('创建通知失败:', error);
    errorResponse(res, '创建通知失败', 500);
  }
};

// 更新通知
exports.updateNotification = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, '输入数据有误', 400, errors.array());
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return errorResponse(res, '通知不存在', 404);
    }

    // 检查权限：只有作者或管理员可以编辑
    if (req.user.role !== 'admin' && notification.author.toString() !== req.user._id.toString()) {
      return errorResponse(res, '无权编辑此通知', 403);
    }

    // 已发布的通知不能编辑内容，只能更新状态
    if (notification.status === 'published' && req.body.content) {
      return errorResponse(res, '已发布的通知不能编辑内容', 400);
    }

    // 更新通知信息
    Object.assign(notification, req.body);
    await notification.save();

    const updatedNotification = await Notification.findById(notification._id)
      .populate('author', 'username profile.firstName profile.lastName');

    successResponse(res, updatedNotification, '更新通知成功');
  } catch (error) {
    console.error('更新通知失败:', error);
    errorResponse(res, '更新通知失败', 500);
  }
};

// 删除通知
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return errorResponse(res, '通知不存在', 404);
    }

    // 检查权限：只有作者或管理员可以删除
    if (req.user.role !== 'admin' && notification.author.toString() !== req.user._id.toString()) {
      return errorResponse(res, '无权删除此通知', 403);
    }

    await Notification.findByIdAndDelete(req.params.id);
    successResponse(res, null, '删除通知成功');
  } catch (error) {
    console.error('删除通知失败:', error);
    errorResponse(res, '删除通知失败', 500);
  }
};

// 标记通知为已读
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return errorResponse(res, '通知不存在', 404);
    }

    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    successResponse(res, null, '标记为已读成功');
  } catch (error) {
    console.error('标记为已读失败:', error);
    errorResponse(res, '标记为已读失败', 500);
  }
};

// 批量标记为已读
exports.markAllAsRead = async (req, res) => {
  try {
    const query = { readBy: { $ne: req.user._id } };
    
    // 根据用户角色过滤
    if (req.user.role === 'parent') {
      query.$or = [
        { 'recipients.type': 'all' },
        { 'recipients.type': 'role', 'recipients.values': 'parent' },
        { 'recipients.type': 'individual', 'recipients.values': req.user._id }
      ];
    }

    await Notification.updateMany(query, {
      $addToSet: { readBy: req.user._id }
    });

    successResponse(res, null, '批量标记为已读成功');
  } catch (error) {
    console.error('批量标记为已读失败:', error);
    errorResponse(res, '批量标记为已读失败', 500);
  }
};

// 获取未读通知数量
exports.getUnreadCount = async (req, res) => {
  try {
    const query = { 
      readBy: { $ne: req.user._id },
      status: 'published'
    };
    
    // 根据用户角色过滤
    if (req.user.role === 'parent') {
      query.$or = [
        { 'recipients.type': 'all' },
        { 'recipients.type': 'role', 'recipients.values': 'parent' },
        { 'recipients.type': 'individual', 'recipients.values': req.user._id }
      ];
    } else if (req.user.role === 'teacher') {
      query.$or = [
        { 'recipients.type': 'all' },
        { 'recipients.type': 'role', 'recipients.values': { $in: ['teacher', 'all'] } },
        { 'recipients.type': 'individual', 'recipients.values': req.user._id }
      ];
    }

    const count = await Notification.countDocuments(query);

    successResponse(res, { count }, '获取未读通知数量成功');
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    errorResponse(res, '获取未读通知数量失败', 500);
  }
};

// 获取通知统计信息
exports.getNotificationStats = async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments({ status: 'published' });
    
    // 按类型统计
    const typeStats = await Notification.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 按优先级统计
    const priorityStats = await Notification.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // 最近7天的通知数量
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentStats = await Notification.aggregate([
      { 
        $match: { 
          status: 'published',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    successResponse(res, {
      totalNotifications,
      typeStats,
      priorityStats,
      recentStats
    }, '获取通知统计信息成功');
  } catch (error) {
    console.error('获取通知统计信息失败:', error);
    errorResponse(res, '获取通知统计信息失败', 500);
  }
};