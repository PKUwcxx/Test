const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, '学生信息不能为空']
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '付款人不能为空']
  },
  type: {
    type: String,
    enum: ['tuition', 'meal', 'activity', 'material', 'transportation', 'other'],
    required: [true, '费用类型不能为空']
  },
  description: {
    type: String,
    required: [true, '费用描述不能为空'],
    trim: true,
    maxlength: [200, '描述不能超过200个字符']
  },
  amount: {
    type: Number,
    required: [true, '金额不能为空'],
    min: [0, '金额不能为负数']
  },
  currency: {
    type: String,
    default: 'CNY',
    enum: ['CNY', 'USD', 'EUR']
  },
  dueDate: {
    type: Date,
    required: [true, '到期日期不能为空']
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'alipay', 'wechat_pay', 'other']
  },
  transactionId: {
    type: String,
    trim: true
  },
  receipt: {
    number: {
      type: String,
      unique: true,
      sparse: true
    },
    url: {
      type: String
    }
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
  notes: {
    type: String,
    trim: true,
    maxlength: [500, '备注不能超过500个字符']
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refund: {
    amount: {
      type: Number,
      min: 0
    },
    reason: {
      type: String,
      trim: true
    },
    date: {
      type: Date
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// 检查是否逾期
paymentSchema.virtual('isOverdue').get(function() {
  if (this.status === 'paid' || this.status === 'cancelled' || this.status === 'refunded') {
    return false;
  }
  return new Date() > this.dueDate;
});

// 获取逾期天数
paymentSchema.virtual('overdueDays').get(function() {
  if (!this.isOverdue) return 0;
  const today = new Date();
  const diffTime = today - this.dueDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 生成收据号码
paymentSchema.pre('save', function(next) {
  if (this.status === 'paid' && !this.receipt.number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.receipt.number = `RCP${year}${month}${random}`;
  }
  next();
});

// 更新逾期状态的静态方法
paymentSchema.statics.updateOverdueStatus = async function() {
  const today = new Date();
  await this.updateMany(
    {
      status: 'pending',
      dueDate: { $lt: today }
    },
    {
      status: 'overdue'
    }
  );
};

// 确保虚拟字段被序列化
paymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);