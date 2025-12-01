const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kindergarten');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const testUser = async () => {
  try {
    // 清除现有用户
    await User.deleteMany({});
    console.log('清除现有数据...');

    // 创建管理员用户
    const admin = new User({
      username: 'admin',
      email: 'admin@kindergarten.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        firstName: '系统',
        lastName: '管理员',
        phone: '13800138000'
      },
      isActive: true
    });
    
    console.log('准备保存管理员用户...');
    await admin.save();
    console.log('管理员用户创建成功');

    console.log('\n=== 测试完成 ===');
    console.log('管理员账户: admin@kindergarten.com / admin123');

  } catch (error) {
    console.error('创建用户失败:', error);
  } finally {
    mongoose.connection.close();
  }
};

const init = async () => {
  await connectDB();
  await testUser();
};

init();