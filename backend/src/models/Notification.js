const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '通知标题不能为空'],
    trim: true,
    maxlength: [100, '标题不能超过100个字符']
  },
  content: {
    type: String,
    required: [true, '通知内容不能为空'],
    trim: true,
    maxlength: [2000, '内容不能超过2000个字符']
  },
  type: {
    type: String,
    enum: ['general', 'urgent', 'event', 'academic', 'health', 'payment'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '发布者不能为空']
  },
  recipients: {
    type: {
      type: String,
      enum: ['all', 'role', 'class', 'individual'],
      required: true
    },
    roles: [{
      type: String,
      enum: ['admin', 'teacher', 'parent']
    }],
    classes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }],
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  statistics: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    readCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// 检查通知是否过期
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// 获取阅读率
notificationSchema.virtual('readRate').get(function() {
  if (this.statistics.totalRecipients === 0) return 0;
  return (this.statistics.readCount / this.statistics.totalRecipients * 100).toFixed(2);
});

// 标记为已读
notificationSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId });
    this.statistics.readCount = this.readBy.length;
  }
  return this.save();
};

// 检查用户是否已读
notificationSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// 确保虚拟字段被序列化
notificationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);