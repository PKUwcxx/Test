const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Teacher = require('../src/models/Teacher');
const Class = require('../src/models/Class');
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

const initUsers = async () => {
  try {
    // 清除现有用户
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    
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
    await admin.save();
    console.log('管理员用户创建成功');

    // 创建教师用户
    const teacher1 = new User({
      username: 'teacher1',
      email: 'teacher@kindergarten.com',
      password: 'teacher123',
      role: 'teacher',
      profile: {
        firstName: '张',
        lastName: '老师',
        phone: '13800138001'
      },
      isActive: true
    });
    await teacher1.save();

    const teacher2 = new User({
      username: 'teacher2',
      email: 'teacher2@kindergarten.com',
      password: 'teacher123',
      role: 'teacher',
      profile: {
        firstName: '李',
        lastName: '老师',
        phone: '13800138002'
      },
      isActive: true
    });
    await teacher2.save();
    console.log('教师用户创建成功');

    // 创建家长用户
    const parent1 = new User({
      username: 'parent1',
      email: 'parent@kindergarten.com',
      password: 'parent123',
      role: 'parent',
      profile: {
        firstName: '王',
        lastName: '家长',
        phone: '13800138003'
      },
      isActive: true
    });
    await parent1.save();

    const parent2 = new User({
      username: 'parent2',
      email: 'parent2@kindergarten.com',
      password: 'parent123',
      role: 'parent',
      profile: {
        firstName: '刘',
        lastName: '家长',
        phone: '13800138004'
      },
      isActive: true
    });
    await parent2.save();
    console.log('家长用户创建成功');

    // 创建教师详细信息
    const teacherInfo1 = new Teacher({
      user: teacher1._id,
      employeeId: 'T001',
      department: '小班部',
      position: '班主任',
      qualification: '学前教育本科',
      experience: 5,
      specialties: ['音乐', '美术'],
      hireDate: new Date('2020-09-01'),
      salary: 8000,
      emergencyContact: {
        name: '张家属',
        phone: '13900139001',
        relationship: '配偶'
      }
    });
    await teacherInfo1.save();

    const teacherInfo2 = new Teacher({
      user: teacher2._id,
      employeeId: 'T002',
      department: '中班部',
      position: '副班主任',
      qualification: '学前教育专科',
      experience: 3,
      specialties: ['体育', '舞蹈'],
      hireDate: new Date('2022-03-01'),
      salary: 7000,
      emergencyContact: {
        name: '李家属',
        phone: '13900139002',
        relationship: '父母'
      }
    });
    await teacherInfo2.save();
    console.log('教师详细信息创建成功');

    // 创建班级
    const class1 = new Class({
      name: '小一班',
      level: '小班',
      capacity: 25,
      currentCount: 20,
      teacher: teacherInfo1._id,
      assistantTeacher: teacherInfo2._id,
      classroom: 'A101',
      schedule: {
        monday: ['语言', '数学', '音乐', '户外活动'],
        tuesday: ['数学', '美术', '体育', '游戏'],
        wednesday: ['语言', '科学', '音乐', '户外活动'],
        thursday: ['数学', '手工', '体育', '游戏'],
        friday: ['语言', '美术', '音乐', '户外活动']
      },
      description: '小一班是一个充满活力的班级，注重培养孩子的基础能力和社交技能。'
    });
    await class1.save();

    const class2 = new Class({
      name: '中一班',
      level: '中班',
      capacity: 30,
      currentCount: 25,
      teacher: teacherInfo2._id,
      assistantTeacher: teacherInfo1._id,
      classroom: 'B201',
      schedule: {
        monday: ['语言', '数学', '英语', '户外活动'],
        tuesday: ['数学', '美术', '体育', '科学'],
        wednesday: ['语言', '音乐', '手工', '户外活动'],
        thursday: ['数学', '英语', '体育', '游戏'],
        friday: ['语言', '美术', '音乐', '户外活动']
      },
      description: '中一班专注于提升孩子的学习能力和创造力，为升入大班做好准备。'
    });
    await class2.save();
    console.log('班级信息创建成功');

    // 创建学生信息
    const student1 = new Student({
      name: '小明',
      gender: '男',
      birthDate: new Date('2019-05-15'),
      studentId: 'S001',
      class: class1._id,
      parent: parent1._id,
      enrollmentDate: new Date('2023-09-01'),
      status: 'active',
      medicalInfo: {
        allergies: ['花生'],
        medications: [],
        emergencyContact: {
          name: '王妈妈',
          phone: '13800138003',
          relationship: '母亲'
        },
        doctor: {
          name: '李医生',
          phone: '13900139999',
          hospital: '儿童医院'
        }
      },
      address: '北京市朝阳区xxx街道xxx号',
      notes: '活泼好动，喜欢画画'
    });
    await student1.save();

    const student2 = new Student({
      name: '小红',
      gender: '女',
      birthDate: new Date('2019-08-20'),
      studentId: 'S002',
      class: class1._id,
      parent: parent2._id,
      enrollmentDate: new Date('2023-09-01'),
      status: 'active',
      medicalInfo: {
        allergies: [],
        medications: [],
        emergencyContact: {
          name: '刘爸爸',
          phone: '13800138004',
          relationship: '父亲'
        },
        doctor: {
          name: '张医生',
          phone: '13900139998',
          hospital: '儿童医院'
        }
      },
      address: '北京市海淀区xxx街道xxx号',
      notes: '安静乖巧，喜欢阅读'
    });
    await student2.save();

    const student3 = new Student({
      name: '小刚',
      gender: '男',
      birthDate: new Date('2018-12-10'),
      studentId: 'S003',
      class: class2._id,
      parent: parent1._id,
      enrollmentDate: new Date('2023-09-01'),
      status: 'active',
      medicalInfo: {
        allergies: ['海鲜'],
        medications: [],
        emergencyContact: {
          name: '王爸爸',
          phone: '13800138005',
          relationship: '父亲'
        },
        doctor: {
          name: '赵医生',
          phone: '13900139997',
          hospital: '儿童医院'
        }
      },
      address: '北京市西城区xxx街道xxx号',
      notes: '聪明好学，数学能力强'
    });
    await student3.save();
    console.log('学生信息创建成功');

    console.log('\n=== 初始化数据完成 ===');
    console.log('管理员账户: admin@kindergarten.com / admin123');
    console.log('教师账户: teacher@kindergarten.com / teacher123');
    console.log('家长账户: parent@kindergarten.com / parent123');
    console.log('========================');

  } catch (error) {
    console.error('初始化数据失败:', error);
  } finally {
    mongoose.connection.close();
  }
};

const init = async () => {
  await connectDB();
  await initUsers();
};

init();