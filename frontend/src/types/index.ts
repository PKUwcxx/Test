// 用户相关类型
export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    address?: string;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// 学生相关类型
export interface Student {
  _id: string;
  studentId: string;
  profile: {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
    dateOfBirth: string;
    avatar?: string;
    address?: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  parentId?: string;
  parents?: Array<{
    user: User;
    relationship: 'father' | 'mother' | 'guardian';
    isPrimary: boolean;
  }>;
  enrollmentDate: string;
  academicInfo: {
    grade: '小班' | '中班' | '大班' | '学前班';
    currentClass?: string;
    previousClasses?: string[];
    academicYear: string;
    semester: 'spring' | 'fall';
  };
  healthInfo?: {
    allergies?: string[];
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      notes: string;
    }>;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    medicalConditions?: string[];
    emergencyMedicalInfo?: string;
  };
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 教师相关类型
export interface Teacher {
  _id: string;
  name: string;
  employeeId: string;
  gender: '男' | '女';
  dateOfBirth: string;
  age?: number;
  phone: string;
  email?: string;
  address?: string;
  avatar?: string;
  position: '园长' | '副园长' | '主班教师' | '配班教师' | '保育员' | '特长教师' | '后勤人员';
  department: '教学部' | '保育部' | '后勤部' | '行政部';
  salary: number;
  hireDate?: string;
  workYears?: number;
  status: '在职' | '请假' | '离职' | '退休';
  assignedClasses?: string[];
  qualifications?: {
    education: string;
    degree: string;
    major: string;
    graduationYear: number;
  };
  certificates?: Array<{
    name: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate?: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 班级相关类型
export interface Class {
  _id: string;
  name: string;
  grade: '小班' | '中班' | '大班' | '学前班';
  capacity: number;
  students: Student[] | string[];
  teachers: Teacher[] | string[];
  classroom: {
    number: string;
    building?: string;
    floor?: number;
    facilities?: string[];
  };
  academicYear: string;
  semester: 'spring' | 'fall';
  schedule?: Array<{
    day: string;
    startTime: string;
    endTime: string;
    subject?: string;
    teacher?: string;
  }>;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// 通知相关类型
export interface Notification {
  _id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event' | 'academic' | 'health' | 'payment';
  priority: 'low' | 'medium' | 'high';
  author: {
    _id: string;
    username: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  recipients: {
    type: 'all' | 'role' | 'class' | 'individual';
    values: string[];
  };
  status: 'draft' | 'published' | 'archived';
  readBy: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  scheduledDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

// 支付相关类型
export interface Payment {
  _id: string;
  student: Student;
  type: 'tuition' | 'meal' | 'activity' | 'material' | 'transportation' | 'other';
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  academicYear: string;
  semester: 'spring' | 'fall';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 表单类型
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'teacher' | 'parent';
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export interface StudentForm {
  studentId: string;
  profile: {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
    dateOfBirth: string;
    address?: string;
  };
  parents?: Array<{
    user: string;
    relationship: 'father' | 'mother' | 'guardian';
    isPrimary: boolean;
  }>;
  classId?: string;
  enrollmentDate: string;
  healthInfo?: {
    allergies?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    bloodType?: string;
  };
  academicInfo: {
    grade: string;
    status?: 'active' | 'inactive' | 'graduated' | 'transferred';
  };
}