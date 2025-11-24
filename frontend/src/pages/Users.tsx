import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  Select,
  Row,
  Col,
  Card,
  Typography,
  Popconfirm,
  message,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { User, RegisterForm } from '../types';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // 这里应该调用实际的API，现在使用模拟数据
      const mockUsers: User[] = [
        {
          _id: '1',
          username: 'admin',
          email: 'admin@kindergarten.com',
          role: 'admin',
          profile: {
            firstName: '管理员',
            lastName: '系统',
            phone: '13800138000',
          },
          isActive: true,
          lastLogin: '2024-01-20T10:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-20T10:00:00Z',
        },
        {
          _id: '2',
          username: 'teacher1',
          email: 'teacher1@kindergarten.com',
          role: 'teacher',
          profile: {
            firstName: '小丽',
            lastName: '王',
            phone: '13800138001',
          },
          isActive: true,
          lastLogin: '2024-01-19T15:30:00Z',
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-19T15:30:00Z',
        },
        {
          _id: '3',
          username: 'parent1',
          email: 'parent1@example.com',
          role: 'parent',
          profile: {
            firstName: '建国',
            lastName: '张',
            phone: '13800138002',
          },
          isActive: true,
          lastLogin: '2024-01-18T09:00:00Z',
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-18T09:00:00Z',
        },
      ];
      
      setTimeout(() => {
        setUsers(mockUsers);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      phone: user.profile.phone,
      isActive: user.isActive,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // 这里应该调用实际的删除API
      setUsers(users.filter(user => user._id !== id));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      // 这里应该调用实际的API
      setUsers(users.map(user => 
        user._id === id ? { ...user, isActive } : user
      ));
      message.success(isActive ? '用户已激活' : '用户已禁用');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const userData: RegisterForm = {
        username: values.username,
        email: values.email,
        password: values.password || 'defaultPassword123',
        role: values.role,
        profile: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
        },
      };

      if (editingUser) {
        // 更新用户
        message.success('更新成功');
      } else {
        // 添加用户
        message.success('添加成功');
      }

      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error(editingUser ? '更新失败' : '添加失败');
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'red',
      teacher: 'blue',
      parent: 'green',
    };
    return colors[role as keyof typeof colors] || 'default';
  };

  const getRoleText = (role: string) => {
    const texts = {
      admin: '管理员',
      teacher: '教师',
      parent: '家长',
    };
    return texts[role as keyof typeof texts] || role;
  };

  const columns: ColumnsType<User> = [
    {
      title: '头像',
      dataIndex: ['profile', 'avatar'],
      key: 'avatar',
      width: 80,
      render: (avatar, record) => (
        <Avatar
          size={40}
          src={avatar}
          icon={<UserOutlined />}
          style={{ backgroundColor: getRoleColor(record.role) }}
        >
          {record.profile.firstName}
        </Avatar>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      key: 'fullName',
      width: 120,
      render: (_, record) => `${record.profile.lastName}${record.profile.firstName}`,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '电话',
      dataIndex: ['profile', 'phone'],
      key: 'phone',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {getRoleText(role)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleStatus(record._id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (lastLogin) => 
        lastLogin ? dayjs(lastLogin).format('YYYY-MM-DD HH:mm') : '从未登录',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (createdAt) => dayjs(createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    `${user.profile.lastName}${user.profile.firstName}`.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">用户管理</Title>
      </div>

      <Card>
        <div className="table-toolbar">
          <Input
            placeholder="搜索用户名、邮箱或姓名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="table-search"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加用户
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredUsers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 添加/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value="admin">管理员</Option>
                  <Option value="teacher">教师</Option>
                  <Option value="parent">家长</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="lastName"
                label="姓"
                rules={[{ required: true, message: '请输入姓' }]}
              >
                <Input placeholder="请输入姓" />
              </Form.Item>
            </Col>
            <Col span={8}>
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

          {editingUser && (
            <Form.Item
              name="isActive"
              label="状态"
              valuePropName="checked"
            >
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '添加'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;