const { body, param, query, validationResult } = require('express-validator');
const { error } = require('../utils/response');

// 处理验证结果
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));
    return error(res, '数据验证失败', 400, formattedErrors);
  }
  next();
};

// 用户注册验证
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度应在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少6个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含大小写字母和数字'),
  
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'parent'])
    .withMessage('无效的用户角色'),
  
  body('profile.firstName')
    .notEmpty()
    .withMessage('姓名不能为空')
    .isLength({ max: 50 })
    .withMessage('姓名不能超过50个字符'),
  
  body('profile.lastName')
    .notEmpty()
    .withMessage('姓氏不能为空')
    .isLength({ max: 50 })
    .withMessage('姓氏不能超过50个字符'),
  
  body('profile.phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  
  handleValidationErrors
];

// 用户登录验证
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
  
  handleValidationErrors
];

// 学生创建验证
const validateStudentCreation = [
  body('studentId')
    .notEmpty()
    .withMessage('学号不能为空')
    .isLength({ max: 20 })
    .withMessage('学号不能超过20个字符'),
  
  body('profile.firstName')
    .notEmpty()
    .withMessage('姓名不能为空')
    .isLength({ max: 50 })
    .withMessage('姓名不能超过50个字符'),
  
  body('profile.lastName')
    .notEmpty()
    .withMessage('姓氏不能为空')
    .isLength({ max: 50 })
    .withMessage('姓氏不能超过50个字符'),
  
  body('profile.gender')
    .isIn(['male', 'female'])
    .withMessage('性别必须是 male 或 female'),
  
  body('profile.dateOfBirth')
    .isISO8601()
    .withMessage('请输入有效的出生日期')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 2 || age > 8) {
        throw new Error('学生年龄应在2-8岁之间');
      }
      return true;
    }),
  
  body('enrollmentDate')
    .isISO8601()
    .withMessage('请输入有效的入学日期'),
  
  body('academicInfo.grade')
    .isIn(['小班', '中班', '大班', '学前班'])
    .withMessage('年级必须是小班、中班、大班或学前班'),
  
  handleValidationErrors
];

// 班级创建验证
const validateClassCreation = [
  body('name')
    .notEmpty()
    .withMessage('班级名称不能为空')
    .isLength({ max: 50 })
    .withMessage('班级名称不能超过50个字符'),
  
  body('grade')
    .isIn(['小班', '中班', '大班', '学前班'])
    .withMessage('年级必须是小班、中班、大班或学前班'),
  
  body('capacity')
    .isInt({ min: 1, max: 50 })
    .withMessage('班级容量应在1-50之间'),
  
  body('classroom.number')
    .notEmpty()
    .withMessage('教室号不能为空'),
  
  body('academicYear')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('学年格式应为 YYYY-YYYY'),
  
  body('semester')
    .isIn(['spring', 'fall'])
    .withMessage('学期必须是 spring 或 fall'),
  
  handleValidationErrors
];

// 通知创建验证
const validateNotificationCreation = [
  body('title')
    .notEmpty()
    .withMessage('通知标题不能为空')
    .isLength({ max: 100 })
    .withMessage('标题不能超过100个字符'),
  
  body('content')
    .notEmpty()
    .withMessage('通知内容不能为空')
    .isLength({ max: 2000 })
    .withMessage('内容不能超过2000个字符'),
  
  body('type')
    .optional()
    .isIn(['general', 'urgent', 'event', 'academic', 'health', 'payment'])
    .withMessage('无效的通知类型'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('优先级必须是 low、medium 或 high'),
  
  body('recipients.type')
    .isIn(['all', 'role', 'class', 'individual'])
    .withMessage('收件人类型必须是 all、role、class 或 individual'),
  
  handleValidationErrors
];

// 支付创建验证
const validatePaymentCreation = [
  body('student')
    .isMongoId()
    .withMessage('无效的学生ID'),
  
  body('type')
    .isIn(['tuition', 'meal', 'activity', 'material', 'transportation', 'other'])
    .withMessage('无效的费用类型'),
  
  body('description')
    .notEmpty()
    .withMessage('费用描述不能为空')
    .isLength({ max: 200 })
    .withMessage('描述不能超过200个字符'),
  
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('金额必须大于等于0'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('请输入有效的到期日期'),
  
  body('academicYear')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('学年格式应为 YYYY-YYYY'),
  
  body('semester')
    .isIn(['spring', 'fall'])
    .withMessage('学期必须是 spring 或 fall'),
  
  handleValidationErrors
];

// ID参数验证
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`无效的${paramName}`),
  
  handleValidationErrors
];

// 分页参数验证
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量应在1-100之间'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateStudentCreation,
  validateClassCreation,
  validateNotificationCreation,
  validatePaymentCreation,
  validateObjectId,
  validatePagination,
  handleValidationErrors
};