const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const { success, error, paginated, notFound } = require('../utils/response');

// 获取所有学生
const getAllStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { classId, grade, status, search } = req.query;
    
    // 构建查询条件
    const query = {};
    
    if (classId) {
      query.class = classId;
    }
    
    if (grade) {
      query['academicInfo.grade'] = grade;
    }
    
    if (status) {
      query['academicInfo.status'] = status;
    }
    
    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('parents.user', 'username email profile')
      .populate('class', 'name grade')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(query);

    paginated(res, students, { page, limit, total }, '获取学生列表成功');

  } catch (err) {
    next(err);
  }
};

// 根据ID获取学生
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('parents.user', 'username email profile')
      .populate('class', 'name grade teachers')
      .populate('notes.author', 'username profile');
    
    if (!student) {
      return notFound(res, '学生不存在');
    }

    success(res, student, '获取学生信息成功');

  } catch (err) {
    next(err);
  }
};

// 创建学生
const createStudent = async (req, res, next) => {
  try {
    const { studentId, profile, parents, classId, enrollmentDate, healthInfo, academicInfo } = req.body;

    // 检查学号是否已存在
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return error(res, '学号已存在', 400);
    }

    // 验证家长用户是否存在
    if (parents && parents.length > 0) {
      for (const parent of parents) {
        const user = await User.findById(parent.user);
        if (!user) {
          return error(res, `家长用户 ${parent.user} 不存在`, 400);
        }
        if (user.role !== 'parent') {
          return error(res, `用户 ${user.username} 不是家长角色`, 400);
        }
      }
    }

    // 验证班级是否存在
    let classObj = null;
    if (classId) {
      classObj = await Class.findById(classId);
      if (!classObj) {
        return error(res, '班级不存在', 400);
      }
      
      // 检查班级是否已满
      if (classObj.isFull) {
        return error(res, '班级已满，无法添加更多学生', 400);
      }
    }

    // 创建学生
    const student = new Student({
      studentId,
      profile,
      parents: parents || [],
      class: classId,
      enrollmentDate,
      healthInfo: healthInfo || {},
      academicInfo: academicInfo || { grade: '小班', status: 'active' }
    });

    await student.save();

    // 更新班级学生数量
    if (classObj) {
      await classObj.updateEnrollment();
    }

    const populatedStudent = await Student.findById(student._id)
      .populate('parents.user', 'username email profile')
      .populate('class', 'name grade');

    success(res, populatedStudent, '创建学生成功', 201);

  } catch (err) {
    next(err);
  }
};

// 更新学生信息
const updateStudent = async (req, res, next) => {
  try {
    const { profile, parents, classId, healthInfo, academicInfo, notes } = req.body;
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return notFound(res, '学生不存在');
    }

    const oldClassId = student.class;

    // 验证家长用户是否存在
    if (parents && parents.length > 0) {
      for (const parent of parents) {
        const user = await User.findById(parent.user);
        if (!user) {
          return error(res, `家长用户 ${parent.user} 不存在`, 400);
        }
        if (user.role !== 'parent') {
          return error(res, `用户 ${user.username} 不是家长角色`, 400);
        }
      }
    }

    // 验证新班级是否存在
    let newClassObj = null;
    if (classId && classId !== oldClassId?.toString()) {
      newClassObj = await Class.findById(classId);
      if (!newClassObj) {
        return error(res, '班级不存在', 400);
      }
      
      // 检查新班级是否已满
      if (newClassObj.isFull) {
        return error(res, '目标班级已满，无法转入', 400);
      }
    }

    // 更新学生信息
    if (profile) student.profile = { ...student.profile, ...profile };
    if (parents) student.parents = parents;
    if (classId) student.class = classId;
    if (healthInfo) student.healthInfo = { ...student.healthInfo, ...healthInfo };
    if (academicInfo) student.academicInfo = { ...student.academicInfo, ...academicInfo };

    await student.save();

    // 更新班级学生数量
    if (oldClassId && oldClassId.toString() !== classId) {
      const oldClass = await Class.findById(oldClassId);
      if (oldClass) {
        await oldClass.updateEnrollment();
      }
    }
    
    if (newClassObj) {
      await newClassObj.updateEnrollment();
    }

    const populatedStudent = await Student.findById(student._id)
      .populate('parents.user', 'username email profile')
      .populate('class', 'name grade');

    success(res, populatedStudent, '更新学生信息成功');

  } catch (err) {
    next(err);
  }
};

// 删除学生
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return notFound(res, '学生不存在');
    }

    const classId = student.class;

    await Student.findByIdAndDelete(req.params.id);

    // 更新班级学生数量
    if (classId) {
      const classObj = await Class.findById(classId);
      if (classObj) {
        await classObj.updateEnrollment();
      }
    }

    success(res, null, '删除学生成功');

  } catch (err) {
    next(err);
  }
};

// 添加学生备注
const addStudentNote = async (req, res, next) => {
  try {
    const { content, type } = req.body;
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return notFound(res, '学生不存在');
    }

    const note = {
      content,
      type: type || 'general',
      author: req.user._id,
      date: new Date()
    };

    student.notes.push(note);
    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('notes.author', 'username profile');

    success(res, populatedStudent.notes, '添加备注成功');

  } catch (err) {
    next(err);
  }
};

// 获取学生统计信息
const getStudentStats = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ 'academicInfo.status': 'active' });
    
    const gradeStats = await Student.aggregate([
      {
        $group: {
          _id: '$academicInfo.grade',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$academicInfo.status', 'active'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const genderStats = await Student.aggregate([
      {
        $group: {
          _id: '$profile.gender',
          count: { $sum: 1 }
        }
      }
    ]);

    const ageStats = await Student.aggregate([
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$profile.dateOfBirth'] },
                365.25 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$age',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const result = {
      total: totalStudents,
      active: activeStudents,
      inactive: totalStudents - activeStudents,
      byGrade: gradeStats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          active: stat.active,
          inactive: stat.count - stat.active
        };
        return acc;
      }, {}),
      byGender: genderStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byAge: ageStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    success(res, result, '获取学生统计成功');

  } catch (err) {
    next(err);
  }
};

// 获取家长的孩子列表
const getMyChildren = async (req, res, next) => {
  try {
    const students = await Student.find({
      'parents.user': req.user._id
    })
      .populate('class', 'name grade teachers')
      .populate('notes.author', 'username profile')
      .sort({ createdAt: -1 });

    success(res, students, '获取孩子列表成功');

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  addStudentNote,
  getStudentStats,
  getMyChildren
};