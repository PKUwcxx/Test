import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginForm, RegisterForm } from '../types';
import api from '../services/api';
import { message } from 'antd';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User['profile']>) => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (roles: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // 验证token是否仍然有效
          await api.get('/auth/profile');
        } catch (error) {
          // Token无效，清除存储
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginForm) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', credentials);
      
      const { user: userData, token: userToken } = response.data;
      
      setUser(userData);
      setToken(userToken);
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      message.success('登录成功');
    } catch (error: any) {
      message.error(error.message || '登录失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterForm) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', userData);
      
      const { user: newUser, token: userToken } = response.data;
      
      setUser(newUser);
      setToken(userToken);
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      message.success('注册成功');
    } catch (error: any) {
      message.error(error.message || '注册失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
  };

  const updateProfile = async (profileData: Partial<User['profile']>) => {
    try {
      const response = await api.put('/auth/profile', { profile: profileData });
      const updatedUser = response.data;
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      message.success('资料更新成功');
    } catch (error: any) {
      message.error(error.message || '更新失败');
      throw error;
    }
  };

  const isAuthenticated = !!user && !!token;

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};