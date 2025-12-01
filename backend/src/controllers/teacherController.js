const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/response');

// 获取教师列表
exports.getTeachers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      position,
      department,
      status = '在职'
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (position) query.position = position;
    if (department) query.department = department;
    if (status) query.status = status;

    // 分页查询
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const teachers = await Teacher.find(query)
      .populate('assignedClasses', 'name level')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Teacher.countDocuments(query);

    successResponse(res, {
      teachers,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, '获取教师列表成功');
  } catch (error) {
    console.error('获取教师列表失败:', error);
    errorResponse(res, '获取教师列表失败', 500);
  }
};

// 获取教师详情
exports.getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('assignedClasses', 'name level studentCount');
    
    if (!teacher) {
      return errorResponse(res, '教师不存在', 404);
    }

    successResponse(res, teacher, '获取教师详情成功');
  } catch (error) {
    console.error('获取教师详情失败:', error);
    errorResponse(res, '获取教师详情失败', 500);
  }
};

// 创建教师
exports.createTeacher = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, '输入数据有误', 400, errors.array());
    }

    // 检查工号是否已存在
    const existingTeacher = await Teacher.findOne({ employeeId: req.body.employeeId });
    if (existingTeacher) {
      return errorResponse(res, '工号已存在', 400);
    }

    const teacher = new Teacher(req.body);
    await teacher.save();

    successResponse(res, teacher, '创建教师成功', 201);
  } catch (error) {
    console.error('创建教师失败:', error);
    if (error.code === 11000) {
      return errorResponse(res, '工号已存在', 400);
    }
    errorResponse(res, '创建教师失败', 500);
  }
};

// 更新教师信息
exports.updateTeacher = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, '输入数据有误', 400, errors.array());
    }

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return errorResponse(res, '教师不存在', 404);
    }

    // 如果更新工号，检查是否与其他教师冲突
    if (req.body.employeeId && req.body.employeeId !== teacher.employeeId) {
      const existingTeacher = await Teacher.findOne({ 
        employeeId: req.body.employeeId,
        _id: { $ne: req.params.id }
      });
      if (existingTeacher) {
        return errorResponse(res, '工号已存在', 400);
      }
    }

    // 更新教师信息
    Object.assign(teacher, req.body);
    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacher._id)
      .populate('assignedClasses', 'name level');

    successResponse(res, updatedTeacher, '更新教师信息成功');
  } catch (error) {
    console.error('更新教师信息失败:', error);
    if (error.code === 11000) {
      return errorResponse(res, '工号已存在', 400);
    }
    errorResponse(res, '更新教师信息失败', 500);
  }
};

// 删除教师
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return errorResponse(res, '教师不存在', 404);
    }

    // 检查是否有分配的班级
    if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
      return errorResponse(res, '该教师还有分配的班级，无法删除', 400);
    }

    await Teacher.findByIdAndDelete(req.params.id);
    successResponse(res, null, '删除教师成功');
  } catch (error) {
    console.error('删除教师失败:', error);
    errorResponse(res, '删除教师失败', 500);
  }
};

// 分配班级给教师
exports.assignClass = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { classId } = req.body;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return errorResponse(res, '教师不存在', 404);
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return errorResponse(res, '班级不存在', 404);
    }

    // 检查班级是否已分配给该教师
    if (teacher.assignedClasses.includes(classId)) {
      return errorResponse(res, '班级已分配给该教师', 400);
    }

    // 添加班级到教师的分配列表
    teacher.assignedClasses.push(classId);
    await teacher.save();

    // 更新班级的教师信息
    if (!classObj.teachers.includes(teacherId)) {
      classObj.teachers.push(teacherId);
      await classObj.save();
    }

    const updatedTeacher = await Teacher.findById(teacherId)
      .populate('assignedClasses', 'name level');

    successResponse(res, updatedTeacher, '分配班级成功');
  } catch (error) {
    console.error('分配班级失败:', error);
    errorResponse(res, '分配班级失败', 500);
  }
};

// 取消班级分配
exports.unassignClass = async (req, res) => {
  try {
    const { teacherId, classId } = req.params;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return errorResponse(res, '教师不存在', 404);
    }

    // 从教师的分配列表中移除班级
    teacher.assignedClasses = teacher.assignedClasses.filter(
      id => id.toString() !== classId
    );
    await teacher.save();

    // 从班级的教师列表中移除教师
    const classObj = await Class.findById(classId);
    if (classObj) {
      classObj.teachers = classObj.teachers.filter(
        id => id.toString() !== teacherId
      );
      await classObj.save();
    }

    const updatedTeacher = await Teacher.findById(teacherId)
      .populate('assignedClasses', 'name level');

    successResponse(res, updatedTeacher, '取消班级分配成功');
  } catch (error) {
    console.error('取消班级分配失败:', error);
    errorResponse(res, '取消班级分配失败', 500);
  }
};

// 获取教师统计信息
exports.getTeacherStats = async (req, res) => {
  try {
    const totalTeachers = await Teacher.countDocuments({ status: '在职' });
    
    // 按职位统计
    const positionStats = await Teacher.aggregate([
      { $match: { status: '在职' } },
      { $group: { _id: '$position', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 按部门统计
    const departmentStats = await Teacher.aggregate([
      { $match: { status: '在职' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 按年龄段统计
    const ageStats = await Teacher.aggregate([
      { $match: { status: '在职' } },
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365.25 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 25] }, then: '25岁以下' },
                { case: { $lt: ['$age', 35] }, then: '25-35岁' },
                { case: { $lt: ['$age', 45] }, then: '35-45岁' },
                { case: { $lt: ['$age', 55] }, then: '45-55岁' }
              ],
              default: '55岁以上'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    successResponse(res, {
      totalTeachers,
      positionStats,
      departmentStats,
      ageStats
    }, '获取教师统计信息成功');
  } catch (error) {
    console.error('获取教师统计信息失败:', error);
    errorResponse(res, '获取教师统计信息失败', 500);
  }
};