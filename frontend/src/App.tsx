import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Notifications from './pages/Notifications';
import Payments from './pages/Payments';
import Users from './pages/Users';
import Profile from './pages/Profile';

import './App.css';

// 设置dayjs中文语言
dayjs.locale('zh-cn');

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* 公开路由 */}
              <Route path="/login" element={<Login />} />
              
              {/* 受保护的路由 */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                
                {/* 学生管理 - 教师和管理员可访问 */}
                <Route path="students" element={
                  <ProtectedRoute roles={['admin', 'teacher']}>
                    <Students />
                  </ProtectedRoute>
                } />
                
                {/* 教师管理 - 仅管理员可访问 */}
                <Route path="teachers" element={
                  <ProtectedRoute roles={['admin']}>
                    <Teachers />
                  </ProtectedRoute>
                } />
                
                {/* 班级管理 - 教师和管理员可访问 */}
                <Route path="classes" element={
                  <ProtectedRoute roles={['admin', 'teacher']}>
                    <Classes />
                  </ProtectedRoute>
                } />
                
                {/* 通知管理 - 所有用户可访问 */}
                <Route path="notifications" element={<Notifications />} />
                
                {/* 财务管理 - 管理员和家长可访问 */}
                <Route path="payments" element={
                  <ProtectedRoute roles={['admin', 'parent']}>
                    <Payments />
                  </ProtectedRoute>
                } />
                
                {/* 用户管理 - 仅管理员可访问 */}
                <Route path="users" element={
                  <ProtectedRoute roles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* 404重定向 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;