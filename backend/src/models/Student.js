const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, '学号不能为空'],
    unique: true,
    trim: true
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
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, '性别不能为空']
    },
    dateOfBirth: {
      type: Date,
      required: [true, '出生日期不能为空']
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
  parents: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    relationship: {
      type: String,
      enum: ['father', 'mother', 'guardian'],
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  enrollmentDate: {
    type: Date,
    required: [true, '入学日期不能为空']
  },
  healthInfo: {
    allergies: [{
      type: String,
      trim: true
    }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      notes: String
    }],
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    }
  },
  academicInfo: {
    grade: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'transferred'],
      default: 'active'
    }
  },
  notes: [{
    date: {
      type: Date,
      default: Date.now
    },
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['general', 'behavior', 'academic', 'health'],
      default: 'general'
    }
  }]
}, {
  timestamps: true
});

// 获取学生全名
studentSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// 获取年龄
studentSchema.virtual('age').get(function() {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.profile.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// 确保虚拟字段被序列化
studentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);