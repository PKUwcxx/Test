const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: [true, '教师姓名不能为空'],
    trim: true
  },
  employeeId: {
    type: String,
    required: [true, '工号不能为空'],
    unique: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['男', '女'],
    required: [true, '性别不能为空']
  },
  dateOfBirth: {
    type: Date,
    required: [true, '出生日期不能为空']
  },
  phone: {
    type: String,
    required: [true, '联系电话不能为空'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  
  // 职业信息
  position: {
    type: String,
    required: [true, '职位不能为空'],
    enum: ['园长', '副园长', '主班教师', '配班教师', '保育员', '特长教师', '后勤人员']
  },
  department: {
    type: String,
    required: [true, '部门不能为空'],
    enum: ['教学部', '保育部', '后勤部', '行政部']
  },
  hireDate: {
    type: Date,
    required: [true, '入职日期不能为空'],
    default: Date.now
  },
  salary: {
    type: Number,
    required: [true, '薪资不能为空'],
    min: 0
  },
  
  // 教育背景
  education: {
    degree: {
      type: String,
      enum: ['高中', '中专', '大专', '本科', '硕士', '博士']
    },
    major: String,
    school: String,
    graduationYear: Number
  },
  
  // 资质证书
  certificates: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date
  }],
  
  // 分配的班级
  assignedClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  
  // 教学科目
  subjects: [{
    type: String,
    enum: ['语言', '数学', '科学', '艺术', '体育', '音乐', '英语', '手工', '游戏']
  }],
  
  // 工作状态
  status: {
    type: String,
    enum: ['在职', '请假', '离职', '退休'],
    default: '在职'
  },
  
  // 紧急联系人
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // 备注
  notes: String,
  
  // 头像
  avatar: String,
  
  // 创建和更新时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
teacherSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 虚拟字段：年龄
teacherSchema.virtual('age').get(function() {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  return null;
});

// 虚拟字段：工作年限
teacherSchema.virtual('workYears').get(function() {
  if (this.hireDate) {
    const today = new Date();
    const hireDate = new Date(this.hireDate);
    let years = today.getFullYear() - hireDate.getFullYear();
    const monthDiff = today.getMonth() - hireDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hireDate.getDate())) {
      years--;
    }
    
    return Math.max(0, years);
  }
  return 0;
});

// 确保虚拟字段在JSON中显示
teacherSchema.set('toJSON', { virtuals: true });
teacherSchema.set('toObject', { virtuals: true });

// 索引
teacherSchema.index({ employeeId: 1 });
teacherSchema.index({ name: 1 });
teacherSchema.index({ position: 1 });
teacherSchema.index({ department: 1 });
teacherSchema.index({ status: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);