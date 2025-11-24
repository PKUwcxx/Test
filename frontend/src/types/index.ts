// 用户相关类型
export interface User {
  id: string;
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
  id: string;
  studentId: string;
  profile: {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
    dateOfBirth: string;
    avatar?: string;
    address?: string;
  };
  parents: Array<{
    user: User;
    relationship: 'father' | 'mother' | 'guardian';
    isPrimary: boolean;
  }>;
  class?: Class;
  enrollmentDate: string;
  healthInfo: {
    allergies?: string[];
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      notes?: string;
    }>;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    bloodType?: string;
  };
  academicInfo: {
    grade: string;
    status: 'active' | 'inactive' | 'graduated' | 'transferred';
  };
  notes: Array<{
    date: string;
    content: string;
    author: User;
    type: 'general' | 'behavior' | 'academic' | 'health';
  }>;
  fullName: string;
  age: number;
  createdAt: string;
  updatedAt: string;
}

// 班级相关类型
export interface Class {
  id: string;
  name: string;
  grade: '小班' | '中班' | '大班' | '学前班';
  capacity: number;
  currentEnrollment: number;
  teachers: Array<{
    user: User;
    role: 'head_teacher' | 'assistant_teacher' | 'subject_teacher';
    subjects?: string[];
  }>;
  schedule: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
    periods: Array<{
      startTime: string;
      endTime: string;
      subject: string;
      teacher?: User;
      room?: string;
    }>;
  }>;
  classroom: {
    number: string;
    building?: string;
    floor?: number;
    facilities?: string[];
  };
  academicYear: string;
  semester: 'spring' | 'fall';
  isActive: boolean;
  description?: string;
  isFull: boolean;
  availableSpots: number;
  headTeacher?: {
    user: User;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 通知相关类型
export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event' | 'academic' | 'health' | 'payment';
  priority: 'low' | 'medium' | 'high';
  author: User;
  recipients: {
    type: 'all' | 'role' | 'class' | 'individual';
    roles?: string[];
    classes?: Class[];
    users?: User[];
  };
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  }>;
  publishDate: string;
  expiryDate?: string;
  isPublished: boolean;
  readBy: Array<{
    user: User;
    readAt: string;
  }>;
  statistics: {
    totalRecipients: number;
    readCount: number;
  };
  isExpired: boolean;
  readRate: string;
  createdAt: string;
  updatedAt: string;
}

// 支付相关类型
export interface Payment {
  id: string;
  student: Student;
  payer: User;
  type: 'tuition' | 'meal' | 'activity' | 'material' | 'transportation' | 'other';
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  paymentDate?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'credit_card' | 'alipay' | 'wechat_pay' | 'other';
  transactionId?: string;
  receipt?: {
    number: string;
    url?: string;
  };
  academicYear: string;
  semester: 'spring' | 'fall';
  notes?: string;
  processedBy?: User;
  refund?: {
    amount: number;
    reason: string;
    date: string;
    processedBy: User;
  };
  isOverdue: boolean;
  overdueDays: number;
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