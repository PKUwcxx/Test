import React, { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../types';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 如果已经登录，重定向到目标页面或仪表板
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (values: LoginForm) => {
    try {
      await login(values);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      // 错误已在AuthContext中处理
    }
  };

  const handleDemoLogin = (role: 'admin' | 'teacher' | 'parent') => {
    const demoCredentials = {
      admin: { email: 'admin@kindergarten.com', password: 'admin123' },
      teacher: { email: 'teacher@kindergarten.com', password: 'teacher123' },
      parent: { email: 'parent@kindergarten.com', password: 'parent123' },
    };

    form.setFieldsValue(demoCredentials[role]);
  };

  return (
    <div className="login-container">
      <Card className="login-form">
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2} className="login-title">
            幼儿园管理系统
          </Title>
          <Text type="secondary">请登录您的账户</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="邮箱地址"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ marginBottom: 16 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 16, display: 'block' }}>
            演示账户（点击快速填充）
          </Text>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button size="small" onClick={() => handleDemoLogin('admin')}>
              管理员
            </Button>
            <Button size="small" onClick={() => handleDemoLogin('teacher')}>
              教师
            </Button>
            <Button size="small" onClick={() => handleDemoLogin('parent')}>
              家长
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;