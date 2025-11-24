import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  Row,
  Col,
  Typography,
  Divider,
  message,
  Space,
  Tag,
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  SaveOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileUpdate = async (values: any) => {
    try {
      setLoading(true);
      await updateProfile(values);
      message.success('个人资料更新成功');
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      setPasswordLoading(true);
      // 这里应该调用修改密码的API
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    listType: 'picture-card',
    className: 'avatar-uploader',
    showUploadList: false,
    action: '/api/upload/avatar',
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片!');
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
      }
      return isJpgOrPng && isLt2M;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success('头像上传成功');
        // 这里应该更新用户头像
      } else if (info.file.status === 'error') {
        message.error('头像上传失败');
      }
    },
  };

  const getRoleText = (role: string) => {
    const texts = {
      admin: '管理员',
      teacher: '教师',
      parent: '家长',
    };
    return texts[role as keyof typeof texts] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'red',
      teacher: 'blue',
      parent: 'green',
    };
    return colors[role as keyof typeof colors] || 'default';
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">个人资料</Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* 基本信息卡片 */}
        <Col xs={24} lg={8}>
          <Card title="基本信息">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Upload {...uploadProps}>
                <Avatar
                  size={100}
                  src={user.profile.avatar}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: getRoleColor(user.role) }}
                >
                  {user.profile.firstName}
                </Avatar>
                <div style={{ marginTop: 8 }}>
                  <Button
                    type="link"
                    icon={<CameraOutlined />}
                    size="small"
                  >
                    更换头像
                  </Button>
                </div>
              </Upload>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Title level={4} style={{ marginBottom: 8 }}>
                {user.profile.lastName}{user.profile.firstName}
              </Title>
              <Tag color={getRoleColor(user.role)} style={{ marginBottom: 16 }}>
                {getRoleText(user.role)}
              </Tag>
              <div>
                <Text type="secondary">用户名：{user.username}</Text>
              </div>
              <div>
                <Text type="secondary">邮箱：{user.email}</Text>
              </div>
              {user.lastLogin && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    最后登录：{dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  注册时间：{dayjs(user.createdAt).format('YYYY-MM-DD')}
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 编辑资料 */}
        <Col xs={24} lg={16}>
          <Card title="编辑资料" style={{ marginBottom: 24 }}>
            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
                phone: user.profile.phone,
                address: user.profile.address,
              }}
              onFinish={handleProfileUpdate}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label="姓"
                    rules={[{ required: true, message: '请输入姓' }]}
                  >
                    <Input placeholder="请输入姓" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label="名"
                    rules={[{ required: true, message: '请输入名' }]}
                  >
                    <Input placeholder="请输入名" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="phone"
                label="电话"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
                ]}
              >
                <Input placeholder="请输入电话号码" />
              </Form.Item>

              <Form.Item
                name="address"
                label="地址"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="请输入地址"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* 修改密码 */}
          <Card title="修改密码">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password
                  placeholder="请输入当前密码"
                  prefix={<LockOutlined />}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password
                  placeholder="请输入新密码"
                  prefix={<LockOutlined />}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="请确认新密码"
                  prefix={<LockOutlined />}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={passwordLoading}
                    icon={<LockOutlined />}
                  >
                    修改密码
                  </Button>
                  <Button onClick={() => passwordForm.resetFields()}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;