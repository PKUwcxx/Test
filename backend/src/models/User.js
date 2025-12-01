const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名不能超过20个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符']
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'parent'],
    default: 'parent'
  },
  profile: {
    firstName: {
      type: String,
      required: [true, '姓名不能为空'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, '姓氏不能为空'],
      trim: true
    },
    phone: {
      type: String,
      match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
    },
    avatar: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 获取用户全名
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// 确保虚拟字段被序列化
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);