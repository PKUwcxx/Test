const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/response');

// 获取支付记录列表
exports.getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      academicYear,
      semester,
      startDate,
      endDate
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (search) {
      // 搜索学生信息
      const students = await Student.find({
        $or: [
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.$or = [
        { student: { $in: students.map(s => s._id) } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    
    // 日期范围查询
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 根据用户角色过滤数据
    if (req.user.role === 'parent') {
      // 家长只能看到自己孩子的支付记录
      const parentStudents = await Student.find({ parentId: req.user._id }).select('_id');
      query.student = { $in: parentStudents.map(s => s._id) };
    }

    // 分页查询
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const payments = await Payment.find(query)
      .populate('student', 'studentId profile academicInfo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    successResponse(res, {
      payments,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, '获取支付记录列表成功');
  } catch (error) {
    console.error('获取支付记录列表失败:', error);
    errorResponse(res, '获取支付记录列表失败', 500);
  }
};

// 获取支付记录详情
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'studentId profile academicInfo parentId');
    
    if (!payment) {
      return errorResponse(res, '支付记录不存在', 404);
    }

    // 检查权限
    if (req.user.role === 'parent') {
      if (payment.student.parentId.toString() !== req.user._id.toString()) {
        return errorResponse(res, '无权查看此支付记录', 403);
      }
    }

    successResponse(res, payment, '获取支付记录详情成功');
  } catch (error) {
    console.error('获取支付记录详情失败:', error);
    errorResponse(res, '获取支付记录详情失败', 500);
  }
};

// 创建支付记录
exports.createPayment = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, '输入数据有误', 400, errors.array());
    }

    // 只有管理员可以创建支付记录
    if (req.user.role !== 'admin') {
      return errorResponse(res, '无权创建支付记录', 403);
    }

    // 验证学生是否存在
    const student = await Student.findById(req.body.student);
    if (!student) {
      return errorResponse(res, '学生不存在', 404);
    }

    const payment = new Payment(req.body);
    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('student', 'studentId profile academicInfo');

    successResponse(res, populatedPayment, '创建支付记录成功', 201);
  } catch (error) {
    console.error('创建支付记录失败:', error);
    errorResponse(res, '创建支付记录失败', 500);
  }
};

// 更新支付记录
exports.updatePayment = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, '输入数据有误', 400, errors.array());
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return errorResponse(res, '支付记录不存在', 404);
    }

    // 只有管理员可以更新支付记录
    if (req.user.role !== 'admin') {
      return errorResponse(res, '无权更新支付记录', 403);
    }

    // 已支付的记录不能修改金额和类型
    if (payment.status === 'paid' && (req.body.amount || req.body.type)) {
      return errorResponse(res, '已支付的记录不能修改金额和类型', 400);
    }

    // 更新支付记录
    Object.assign(payment, req.body);
    await payment.save();

    const updatedPayment = await Payment.findById(payment._id)
      .populate('student', 'studentId profile academicInfo');

    successResponse(res, updatedPayment, '更新支付记录成功');
  } catch (error) {
    console.error('更新支付记录失败:', error);
    errorResponse(res, '更新支付记录失败', 500);
  }
};

// 删除支付记录
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return errorResponse(res, '支付记录不存在', 404);
    }

    // 只有管理员可以删除支付记录
    if (req.user.role !== 'admin') {
      return errorResponse(res, '无权删除支付记录', 403);
    }

    // 已支付的记录不能删除
    if (payment.status === 'paid') {
      return errorResponse(res, '已支付的记录不能删除', 400);
    }

    await Payment.findByIdAndDelete(req.params.id);
    successResponse(res, null, '删除支付记录成功');
  } catch (error) {
    console.error('删除支付记录失败:', error);
    errorResponse(res, '删除支付记录失败', 500);
  }
};

// 处理支付
exports.processPayment = async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return errorResponse(res, '支付记录不存在', 404);
    }

    // 检查权限
    if (req.user.role === 'parent') {
      const student = await Student.findById(payment.student);
      if (student.parentId.toString() !== req.user._id.toString()) {
        return errorResponse(res, '无权处理此支付', 403);
      }
    } else if (req.user.role !== 'admin') {
      return errorResponse(res, '无权处理支付', 403);
    }

    if (payment.status === 'paid') {
      return errorResponse(res, '该记录已支付', 400);
    }

    // 更新支付状态
    payment.status = 'paid';
    payment.paymentDate = new Date();
    payment.paymentMethod = paymentMethod;
    payment.transactionId = transactionId;
    
    await payment.save();

    const updatedPayment = await Payment.findById(payment._id)
      .populate('student', 'studentId profile academicInfo');

    successResponse(res, updatedPayment, '支付处理成功');
  } catch (error) {
    console.error('支付处理失败:', error);
    errorResponse(res, '支付处理失败', 500);
  }
};

// 批量创建支付记录
exports.batchCreatePayments = async (req, res) => {
  try {
    const { students, paymentData } = req.body;

    // 只有管理员可以批量创建
    if (req.user.role !== 'admin') {
      return errorResponse(res, '无权批量创建支付记录', 403);
    }

    const payments = [];
    for (const studentId of students) {
      const payment = new Payment({
        ...paymentData,
        student: studentId
      });
      payments.push(payment);
    }

    const savedPayments = await Payment.insertMany(payments);
    
    const populatedPayments = await Payment.find({
      _id: { $in: savedPayments.map(p => p._id) }
    }).populate('student', 'studentId profile academicInfo');

    successResponse(res, populatedPayments, '批量创建支付记录成功', 201);
  } catch (error) {
    console.error('批量创建支付记录失败:', error);
    errorResponse(res, '批量创建支付记录失败', 500);
  }
};

// 获取财务统计信息
exports.getFinancialStats = async (req, res) => {
  try {
    const { academicYear, semester, startDate, endDate } = req.query;
    
    // 构建时间查询条件
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }
    if (academicYear) dateQuery.academicYear = academicYear;
    if (semester) dateQuery.semester = semester;

    // 总收入统计
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid', ...dateQuery } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // 待收费用统计
    const pendingAmount = await Payment.aggregate([
      { $match: { status: 'pending', ...dateQuery } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // 按费用类型统计
    const typeStats = await Payment.aggregate([
      { $match: { status: 'paid', ...dateQuery } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // 按月份统计收入
    const monthlyStats = await Payment.aggregate([
      { $match: { status: 'paid', ...dateQuery } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 支付状态统计
    const statusStats = await Payment.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // 逾期费用统计
    const overdueAmount = await Payment.aggregate([
      { 
        $match: { 
          status: 'pending',
          dueDate: { $lt: new Date() },
          ...dateQuery
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    successResponse(res, {
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      overdueAmount: overdueAmount[0]?.total || 0,
      overdueCount: overdueAmount[0]?.count || 0,
      typeStats,
      monthlyStats,
      statusStats
    }, '获取财务统计信息成功');
  } catch (error) {
    console.error('获取财务统计信息失败:', error);
    errorResponse(res, '获取财务统计信息失败', 500);
  }
};

// 生成财务报表
exports.generateReport = async (req, res) => {
  try {
    const { type, academicYear, semester, startDate, endDate } = req.query;

    // 只有管理员可以生成报表
    if (req.user.role !== 'admin') {
      return errorResponse(res, '无权生成财务报表', 403);
    }

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }
    if (academicYear) dateQuery.academicYear = academicYear;
    if (semester) dateQuery.semester = semester;

    let reportData;

    switch (type) {
      case 'revenue':
        // 收入报表
        reportData = await Payment.aggregate([
          { $match: { status: 'paid', ...dateQuery } },
          {
            $group: {
              _id: {
                type: '$type',
                month: { $month: '$paymentDate' },
                year: { $year: '$paymentDate' }
              },
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.type': 1 } }
        ]);
        break;

      case 'outstanding':
        // 欠费报表
        reportData = await Payment.find({
          status: 'pending',
          ...dateQuery
        })
        .populate('student', 'studentId profile academicInfo')
        .sort({ dueDate: 1 });
        break;

      case 'detailed':
        // 详细报表
        reportData = await Payment.find(dateQuery)
          .populate('student', 'studentId profile academicInfo')
          .sort({ createdAt: -1 });
        break;

      default:
        return errorResponse(res, '无效的报表类型', 400);
    }

    successResponse(res, {
      type,
      dateRange: { startDate, endDate, academicYear, semester },
      data: reportData,
      generatedAt: new Date()
    }, '生成财务报表成功');
  } catch (error) {
    console.error('生成财务报表失败:', error);
    errorResponse(res, '生成财务报表失败', 500);
  }
};