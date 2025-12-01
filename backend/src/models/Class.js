const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '班级名称不能为空'],
    trim: true,
    unique: true
  },
  grade: {
    type: String,
    required: [true, '年级不能为空'],
    enum: ['小班', '中班', '大班', '学前班']
  },
  capacity: {
    type: Number,
    required: [true, '班级容量不能为空'],
    min: [1, '班级容量至少为1'],
    max: [50, '班级容量不能超过50']
  },
  currentEnrollment: {
    type: Number,
    default: 0,
    min: 0
  },
  teachers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['head_teacher', 'assistant_teacher', 'subject_teacher'],
      default: 'assistant_teacher'
    },
    subjects: [{
      type: String,
      trim: true
    }]
  }],
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      required: true
    },
    periods: [{
      startTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '请输入有效的时间格式 (HH:MM)']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '请输入有效的时间格式 (HH:MM)']
      },
      subject: {
        type: String,
        required: true,
        trim: true
      },
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      room: {
        type: String,
        trim: true
      }
    }]
  }],
  classroom: {
    number: {
      type: String,
      required: [true, '教室号不能为空'],
      trim: true
    },
    building: {
      type: String,
      trim: true
    },
    floor: {
      type: Number,
      min: 1
    },
    facilities: [{
      type: String,
      trim: true
    }]
  },
  academicYear: {
    type: String,
    required: [true, '学年不能为空'],
    match: [/^\d{4}-\d{4}$/, '学年格式应为 YYYY-YYYY']
  },
  semester: {
    type: String,
    enum: ['spring', 'fall'],
    required: [true, '学期不能为空']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '描述不能超过500个字符']
  }
}, {
  timestamps: true
});

// 检查班级是否已满
classSchema.virtual('isFull').get(function() {
  return this.currentEnrollment >= this.capacity;
});

// 获取可用名额
classSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.capacity - this.currentEnrollment);
});

// 获取班主任
classSchema.virtual('headTeacher').get(function() {
  return this.teachers.find(teacher => teacher.role === 'head_teacher');
});

// 更新当前学生数量的中间件
classSchema.methods.updateEnrollment = async function() {
  const Student = mongoose.model('Student');
  const count = await Student.countDocuments({ class: this._id, 'academicInfo.status': 'active' });
  this.currentEnrollment = count;
  return this.save();
};

// 确保虚拟字段被序列化
classSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);