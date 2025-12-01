const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticate, requireAdmin, requireTeacher } = require('../middleware/auth');
const { validateClassCreation } = require('../middleware/validation');

// 所有路由都需要认证
router.use(authenticate);

// 获取班级列表
router.get('/', classController.getClasses);

// 获取班级统计信息
router.get('/stats', classController.getClassStats);

// 获取班级详情
router.get('/:id', classController.getClass);

// 创建班级 (仅管理员)
router.post('/', requireAdmin, validateClassCreation, classController.createClass);

// 更新班级信息 (仅管理员)
router.put('/:id', requireAdmin, validateClassCreation, classController.updateClass);

// 删除班级 (仅管理员)
router.delete('/:id', requireAdmin, classController.deleteClass);

// 添加学生到班级 (管理员和教师)
router.post('/:classId/students', requireTeacher, classController.addStudent);

// 从班级移除学生 (管理员和教师)
router.delete('/:classId/students/:studentId', requireTeacher, classController.removeStudent);

// 分配教师到班级 (仅管理员)
router.post('/:classId/teachers', requireAdmin, classController.assignTeacher);

// 从班级移除教师 (仅管理员)
router.delete('/:classId/teachers/:teacherId', requireAdmin, classController.removeTeacher);

module.exports = router;