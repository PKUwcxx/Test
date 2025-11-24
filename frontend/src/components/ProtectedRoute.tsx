import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // 保存当前路径，登录后可以重定向回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查角色权限
  if (roles && !hasRole(roles)) {
    // 没有权限访问，重定向到仪表板
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;