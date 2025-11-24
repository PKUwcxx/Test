const Class = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/response');

// 获取班级列表
exports.getClasses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      grade,
      academicYear,
      semester,
      status = 'active'
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'classroom.number': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (grade) query.grade = grade;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (status) query.status = status;

    // 分页查询
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const classes = await Class.find(query)
      .populate('teachers', 'name position')
      .populate('students', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Class.countDocuments(query);

    successResponse(res, {
      classes,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, '获取班级列表成功');
  } catch (error) {
    console.error('获取班级列表失败:', error);
    errorResponse(res, '获取班级列表失败', 500);
  }
};

// 获取班级详情
exports.getClass = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('teachers', 'name position phone email')
      .populate('students', 'studentId profile academicInfo');
    
    if (!classObj) {
      return errorResponse(res, '班级不存在', 404);
    }

    successResponse(res, classObj, '获取班级详情成功');
  } catch (error) {
    console.error('获取班级详情失败:', error);
    errorResponse(res, '获取班级详情失败', 500);
  }
};

// 创建班级
exports.createClass = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, '输入数据有误', 400, errors.array());
    }

    // 检查班级名称是否已存在
    const existingClass = await Class.findOne({ 
      name: req.body.name,
      academicYear: req.body.academicYear,
      semester: req.body.semester
    });
    if (existingClass) {
      return errorResponse(res, '该学年学期的班级名称已存在', 400);
    }

    const classObj = new Class(req.body);
    await classObj.save();

    const populatedClass = await Class.findById(classObj._id)
      .populate('teachers', 'name position');

    successResponse(res, populatedClass, '创建班级成功', 201);
  } catch (error) {
    console.error('创建班级失败:', error);
    errorResponse(res, '创建班级失败', 500);
  }
};

// 更新班级信息
exports.updateClass = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, '输入数据有误', 400, errors.array());
    }

    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
      return errorResponse(res, '班级不存在', 404);
    }

    // 如果更新班级名称，检查是否与其他班级冲突
    if (req.body.name && req.body.name !== classObj.name) {
      const existingClass = await Class.findOne({ 
        name: req.body.name,
        academicYear: req.body.academicYear || classObj.academicYear,
        semester: req.body.semester || classObj.semester,
        _id: { $ne: req.params.id }
      });
      if (existingClass) {
        return errorResponse(res, '该学年学期的班级名称已存在', 400);
      }
    }

    // 更新班级信息
    Object.assign(classObj, req.body);
    await classObj.save();

    const updatedClass = await Class.findById(classObj._id)
      .populate('teachers', 'name position')
      .populate('students', 'profile.firstName profile.lastName');

    successResponse(res, updatedClass, '更新班级信息成功');
  } catch (error) {
    console.error('更新班级信息失败:', error);
    errorResponse(res, '更新班级信息失败', 500);
  }
};

// 删除班级
exports.deleteClass = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
      return errorResponse(res, '班级不存在', 404);
    }

    // 检查是否有学生
    if (classObj.students && classObj.students.length > 0) {
      return errorResponse(res, '该班级还有学生，无法删除', 400);
    }

    // 从教师的分配列表中移除该班级
    if (classObj.teachers && classObj.teachers.length > 0) {
      await Teacher.updateMany(
        { _id: { $in: classObj.teachers } },
        { $pull: { assignedClasses: req.params.id } }
      );
    }

    await Class.findByIdAndDelete(req.params.id);
    successResponse(res, null, '删除班级成功');
  } catch (error) {
    console.error('删除班级失败:', error);
    errorResponse(res, '删除班级失败', 500);
  }
};

// 添加学生到班级
exports.addStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return errorResponse(res, '班级不存在', 404);
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return errorResponse(res, '学生不存在', 404);
    }

    // 检查班级容量
    if (classObj.students.length >= classObj.capacity) {
      return errorResponse(res, '班级已满，无法添加更多学生', 400);
    }

    // 检查学生是否已在该班级
    if (classObj.students.includes(studentId)) {
      return errorResponse(res, '学生已在该班级中', 400);
    }

    // 检查学生是否已在其他班级
    if (student.academicInfo.currentClass) {
      return errorResponse(res, '学生已在其他班级中，请先转班', 400);
    }

    // 添加学生到班级
    classObj.students.push(studentId);
    await classObj.save();

    // 更新学生的班级信息
    student.academicInfo.currentClass = classId;
    student.academicInfo.grade = classObj.grade;
    await student.save();

    const updatedClass = await Class.findById(classId)
      .populate('students', 'studentId profile academicInfo');

    successResponse(res, updatedClass, '添加学生到班级成功');
  } catch (error) {
    console.error('添加学生到班级失败:', error);
    errorResponse(res, '添加学生到班级失败', 500);
  }
};

// 从班级移除学生
exports.removeStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return errorResponse(res, '班级不存在', 404);
    }

    // 从班级中移除学生
    classObj.students = classObj.students.filter(
      id => id.toString() !== studentId
    );
    await classObj.save();

    // 更新学生的班级信息
    const student = await Student.findById(studentId);
    if (student) {
      student.academicInfo.currentClass = null;
      await student.save();
    }

    const updatedClass = await Class.findById(classId)
      .populate('students', 'studentId profile academicInfo');

    successResponse(res, updatedClass, '从班级移除学生成功');
  } catch (error) {
    console.error('从班级移除学生失败:', error);
    errorResponse(res, '从班级移除学生失败', 500);
  }
};

// 分配教师到班级
exports.assignTeacher = async (req, res) => {
  try {
    const { classId } = req.params;
    const { teacherId } = req.body;

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return errorResponse(res, '班级不存在', 404);
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return errorResponse(res, '教师不存在', 404);
    }

    // 检查教师是否已分配到该班级
    if (classObj.teachers.includes(teacherId)) {
      return errorResponse(res, '教师已分配到该班级', 400);
    }

    // 添加教师到班级
    classObj.teachers.push(teacherId);
    await classObj.save();

    // 更新教师的分配班级列表
    if (!teacher.assignedClasses.includes(classId)) {
      teacher.assignedClasses.push(classId);
      await teacher.save();
    }

    const updatedClass = await Class.findById(classId)
      .populate('teachers', 'name position');

    successResponse(res, updatedClass, '分配教师到班级成功');
  } catch (error) {
    console.error('分配教师到班级失败:', error);
    errorResponse(res, '分配教师到班级失败', 500);
  }
};

// 从班级移除教师
exports.removeTeacher = async (req, res) => {
  try {
    const { classId, teacherId } = req.params;

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return errorResponse(res, '班级不存在', 404);
    }

    // 从班级中移除教师
    classObj.teachers = classObj.teachers.filter(
      id => id.toString() !== teacherId
    );
    await classObj.save();

    // 从教师的分配列表中移除班级
    const teacher = await Teacher.findById(teacherId);
    if (teacher) {
      teacher.assignedClasses = teacher.assignedClasses.filter(
        id => id.toString() !== classId
      );
      await teacher.save();
    }

    const updatedClass = await Class.findById(classId)
      .populate('teachers', 'name position');

    successResponse(res, updatedClass, '从班级移除教师成功');
  } catch (error) {
    console.error('从班级移除教师失败:', error);
    errorResponse(res, '从班级移除教师失败', 500);
  }
};

// 获取班级统计信息
exports.getClassStats = async (req, res) => {
  try {
    const totalClasses = await Class.countDocuments({ status: 'active' });
    
    // 按年级统计
    const gradeStats = await Class.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // 按学年统计
    const yearStats = await Class.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$academicYear', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    // 班级容量统计
    const capacityStats = await Class.aggregate([
      { $match: { status: 'active' } },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: [{ $size: '$students' }, '$capacity'] },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$occupancyRate', 50] }, then: '50%以下' },
                { case: { $lt: ['$occupancyRate', 80] }, then: '50%-80%' },
                { case: { $lt: ['$occupancyRate', 100] }, then: '80%-100%' }
              ],
              default: '满员'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    successResponse(res, {
      totalClasses,
      gradeStats,
      yearStats,
      capacityStats
    }, '获取班级统计信息成功');
  } catch (error) {
    console.error('获取班级统计信息失败:', error);
    errorResponse(res, '获取班级统计信息失败', 500);
  }
};