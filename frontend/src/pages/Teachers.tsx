import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Avatar,
  Tooltip,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Teacher, ApiResponse } from '../types';
import api from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    position: '',
    department: '',
    status: '在职'
  });
  const [stats, setStats] = useState({
    total: 0,
    positions: [],
    departments: []
  });

  // 获取教师列表
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (filters.position) params.append('position', filters.position);
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get<ApiResponse<{ teachers: Teacher[] }>>(`/teachers?${params}`);
      if (response.data.success) {
        setTeachers(response.data.data.teachers);
      }
    } catch (error) {
      message.error('获取教师列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await api.get<ApiResponse<any>>('/teachers/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchStats();
  }, [searchText, filters]);

  // 处理添加/编辑教师
  const handleSubmit = async (values: any) => {
    try {
      const teacherData = {
        ...values,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
        hireDate: values.hireDate?.format('YYYY-MM-DD')
      };

      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher._id}`, teacherData);
        message.success('更新教师信息成功');
      } else {
        await api.post('/teachers', teacherData);
        message.success('添加教师成功');
      }

      setModalVisible(false);
      setEditingTeacher(null);
      form.resetFields();
      fetchTeachers();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 处理删除教师
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/teachers/${id}`);
      message.success('删除教师成功');
      fetchTeachers();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // 打开编辑模态框
  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    form.setFieldsValue({
      ...teacher,
      dateOfBirth: teacher.dateOfBirth ? dayjs(teacher.dateOfBirth) : null,
      hireDate: teacher.hireDate ? dayjs(teacher.hireDate) : null
    });
    setModalVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string, record: Teacher) => (
        <Avatar 
          src={avatar} 
          icon={<UserOutlined />}
          size={40}
        />
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Teacher) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>工号: {record.employeeId}</div>
        </div>
      ),
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => (
        <Tag color={getPositionColor(position)}>{position}</Tag>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (record: Teacher) => (
        <div>
          <div>{record.phone}</div>
          {record.email && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          )}
        </div>
      ),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      render: (age: number) => age ? `${age}岁` : '-',
    },
    {
      title: '工作年限',
      dataIndex: 'workYears',
      key: 'workYears',
      width: 100,
      render: (years: number) => `${years}年`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '在职' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: Teacher) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个教师吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 获取职位颜色
  const getPositionColor = (position: string) => {
    const colors: { [key: string]: string } = {
      '园长': 'red',
      '副园长': 'orange',
      '主班教师': 'blue',
      '配班教师': 'green',
      '保育员': 'cyan',
      '特长教师': 'purple',
      '后勤人员': 'gray'
    };
    return colors[position] || 'default';
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="在职教师总数"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="主班教师"
              value={(stats.positions?.find((p: any) => p._id === '主班教师') as any)?.count || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="配班教师"
              value={(stats.positions?.find((p: any) => p._id === '配班教师') as any)?.count || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="保育员"
              value={(stats.positions?.find((p: any) => p._id === '保育员') as any)?.count || 0}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Search
                placeholder="搜索教师姓名、工号或电话"
                allowClear
                style={{ width: 300 }}
                onSearch={setSearchText}
                enterButton={<SearchOutlined />}
              />
              <Select
                placeholder="职位"
                allowClear
                style={{ width: 120 }}
                value={filters.position || undefined}
                onChange={(value) => setFilters({ ...filters, position: value || '' })}
              >
                <Option value="园长">园长</Option>
                <Option value="副园长">副园长</Option>
                <Option value="主班教师">主班教师</Option>
                <Option value="配班教师">配班教师</Option>
                <Option value="保育员">保育员</Option>
                <Option value="特长教师">特长教师</Option>
                <Option value="后勤人员">后勤人员</Option>
              </Select>
              <Select
                placeholder="部门"
                allowClear
                style={{ width: 120 }}
                value={filters.department || undefined}
                onChange={(value) => setFilters({ ...filters, department: value || '' })}
              >
                <Option value="教学部">教学部</Option>
                <Option value="保育部">保育部</Option>
                <Option value="后勤部">后勤部</Option>
                <Option value="行政部">行政部</Option>
              </Select>
              <Select
                placeholder="状态"
                style={{ width: 100 }}
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
              >
                <Option value="在职">在职</Option>
                <Option value="请假">请假</Option>
                <Option value="离职">离职</Option>
                <Option value="退休">退休</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchTeachers();
                  fetchStats();
                }}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingTeacher(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                添加教师
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 教师表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={teachers}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: teachers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 添加/编辑教师模态框 */}
      <Modal
        title={editingTeacher ? '编辑教师' : '添加教师'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTeacher(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: '在职',
            department: '教学部'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入教师姓名' }]}
              >
                <Input placeholder="请输入教师姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employeeId"
                label="工号"
                rules={[{ required: true, message: '请输入工号' }]}
              >
                <Input placeholder="请输入工号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dateOfBirth"
                label="出生日期"
                rules={[{ required: true, message: '请选择出生日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择出生日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="hireDate"
                label="入职日期"
                rules={[{ required: true, message: '请选择入职日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择入职日期" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                ]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="position"
                label="职位"
                rules={[{ required: true, message: '请选择职位' }]}
              >
                <Select placeholder="请选择职位">
                  <Option value="园长">园长</Option>
                  <Option value="副园长">副园长</Option>
                  <Option value="主班教师">主班教师</Option>
                  <Option value="配班教师">配班教师</Option>
                  <Option value="保育员">保育员</Option>
                  <Option value="特长教师">特长教师</Option>
                  <Option value="后勤人员">后勤人员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="department"
                label="部门"
                rules={[{ required: true, message: '请选择部门' }]}
              >
                <Select placeholder="请选择部门">
                  <Option value="教学部">教学部</Option>
                  <Option value="保育部">保育部</Option>
                  <Option value="后勤部">后勤部</Option>
                  <Option value="行政部">行政部</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="salary"
                label="薪资"
                rules={[{ required: true, message: '请输入薪资' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入薪资"
                  min={0}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (parseFloat(value!.replace(/¥\s?|(,*)/g, '')) || 0) as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="地址"
          >
            <Input.TextArea rows={2} placeholder="请输入地址" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTeacher ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Teachers;