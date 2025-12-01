const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  addStudentNote,
  getStudentStats,
  getMyChildren
} = require('../controllers/studentController');
const { authenticate, requireAdmin, requireTeacher, requireParent } = require('../middleware/auth');
const {
  validateStudentCreation,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');

// 所有路由都需要认证
router.use(authenticate);

// 家长专用路由
router.get('/my-children', requireParent, getMyChildren);

// 管理员和教师路由
router.get('/', requireTeacher, validatePagination, getAllStudents);
router.get('/stats', requireTeacher, getStudentStats);
router.get('/:id', requireTeacher, validateObjectId(), getStudentById);
router.post('/:id/notes', requireTeacher, validateObjectId(), addStudentNote);

// 管理员专用路由
router.post('/', requireAdmin, validateStudentCreation, createStudent);
router.put('/:id', requireAdmin, validateObjectId(), updateStudent);
router.delete('/:id', requireAdmin, validateObjectId(), deleteStudent);

module.exports = router;