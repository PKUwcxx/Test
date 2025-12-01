const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateTeacherCreation } = require('../middleware/validation');

// 所有路由都需要认证
router.use(authenticate);

// 获取教师列表
router.get('/', teacherController.getTeachers);

// 获取教师统计信息
router.get('/stats', teacherController.getTeacherStats);

// 获取教师详情
router.get('/:id', teacherController.getTeacher);

// 创建教师 (仅管理员)
router.post('/', requireAdmin, validateTeacherCreation, teacherController.createTeacher);

// 更新教师信息 (仅管理员)
router.put('/:id', requireAdmin, validateTeacherCreation, teacherController.updateTeacher);

// 删除教师 (仅管理员)
router.delete('/:id', requireAdmin, teacherController.deleteTeacher);

// 分配班级给教师 (仅管理员)
router.post('/:teacherId/assign-class', requireAdmin, teacherController.assignClass);

// 取消班级分配 (仅管理员)
router.delete('/:teacherId/classes/:classId', requireAdmin, teacherController.unassignClass);

module.exports = router;