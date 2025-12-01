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
  Tooltip,
  InputNumber,
  Badge,
  Progress,
  Descriptions,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  PayCircleOutlined,
  FileTextOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Payment, Student, ApiResponse } from '../types';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const Payments: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [form] = Form.useForm();
  const [payForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    academicYear: '',
    semester: ''
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    overdueCount: 0,
    typeStats: [],
    statusStats: []
  });

  // 获取支付记录列表
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.semester) params.append('semester', filters.semester);

      const response = await api.get<ApiResponse<{ payments: Payment[] }>>(`/payments?${params}`);
      if (response.data.success) {
        setPayments(response.data.data.payments);
      }
    } catch (error) {
      message.error('获取支付记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    if (user?.role !== 'admin') return;
    
    try {
      const response = await api.get<ApiResponse<any>>('/payments/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 获取学生列表
  const fetchStudents = async () => {
    if (user?.role !== 'admin') return;
    
    try {
      const response = await api.get<ApiResponse<{ students: Student[] }>>('/students?limit=1000');
      if (response.data.success) {
        setStudents(response.data.data.students);
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();
    fetchStudents();
  }, [searchText, filters]);

  // 处理添加/编辑支付记录
  const handleSubmit = async (values: any) => {
    try {
      const paymentData = {
        ...values,
        dueDate: values.dueDate?.format('YYYY-MM-DD')
      };

      if (editingPayment) {
        await api.put(`/payments/${editingPayment._id}`, paymentData);
        message.success('更新支付记录成功');
      } else {
        await api.post('/payments', paymentData);
        message.success('创建支付记录成功');
      }

      setModalVisible(false);
      setEditingPayment(null);
      form.resetFields();
      fetchPayments();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 处理删除支付记录
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/payments/${id}`);
      message.success('删除支付记录成功');
      fetchPayments();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // 打开编辑模态框
  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    form.setFieldsValue({
      ...payment,
      dueDate: payment.dueDate ? dayjs(payment.dueDate) : null
    });
    setModalVisible(true);
  };

  // 查看支付详情
  const handleViewDetail = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailModalVisible(true);
  };

  // 处理支付
  const handlePay = (payment: Payment) => {
    setSelectedPayment(payment);
    payForm.resetFields();
    setPayModalVisible(true);
  };

  // 确认支付
  const handleConfirmPay = async (values: any) => {
    if (!selectedPayment) return;
    
    try {
      await api.post(`/payments/${selectedPayment._id}/pay`, values);
      message.success('支付成功');
      setPayModalVisible(false);
      fetchPayments();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '支付失败');
    }
  };

  // 获取费用类型颜色
  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'tuition': 'blue',
      'meal': 'green',
      'activity': 'orange',
      'material': 'purple',
      'transportation': 'cyan',
      'other': 'gray'
    };
    return colors[type] || 'default';
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'orange',
      'paid': 'green',
      'overdue': 'red',
      'cancelled': 'gray'
    };
    return colors[status] || 'default';
  };

  // 获取费用类型中文名
  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'tuition': '学费',
      'meal': '餐费',
      'activity': '活动费',
      'material': '材料费',
      'transportation': '交通费',
      'other': '其他'
    };
    return labels[type] || type;
  };

  // 获取状态中文名
  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'pending': '待支付',
      'paid': '已支付',
      'overdue': '逾期',
      'cancelled': '已取消'
    };
    return labels[status] || status;
  };

  // 检查是否逾期
  const isOverdue = (payment: Payment) => {
    return payment.status === 'pending' && dayjs().isAfter(dayjs(payment.dueDate));
  };

  // 表格列定义
  const columns = [
    {
      title: '学生信息',
      key: 'student',
      render: (record: Payment) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.student?.profile?.firstName} {record.student?.profile?.lastName}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            学号: {record.student?.studentId}
          </div>
        </div>
      ),
    },
    {
      title: '费用类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '费用描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          ¥{amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '到期日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (dueDate: string, record: Payment) => {
        const isLate = isOverdue(record);
        return (
          <div style={{ color: isLate ? '#ff4d4f' : undefined }}>
            {dayjs(dueDate).format('YYYY-MM-DD')}
            {isLate && <Badge status="error" text="逾期" style={{ marginLeft: 8 }} />}
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Payment) => {
        const actualStatus = isOverdue(record) ? 'overdue' : status;
        return (
          <Tag color={getStatusColor(actualStatus)}>
            {getStatusLabel(actualStatus)}
          </Tag>
        );
      },
    },
    {
      title: '支付日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (paymentDate: string) => 
        paymentDate ? dayjs(paymentDate).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (record: Payment) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="支付">
              <Button
                icon={<PayCircleOutlined />}
                size="small"
                onClick={() => handlePay(record)}
                style={{ color: '#52c41a', borderColor: '#52c41a' }}
              />
            </Tooltip>
          )}
          {user?.role === 'admin' && (
            <>
              <Tooltip title="编辑">
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEdit(record)}
                  disabled={record.status === 'paid'}
                />
              </Tooltip>
              <Popconfirm
                title="确定要删除这条支付记录吗？"
                onConfirm={() => handleDelete(record._id)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="删除">
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    disabled={record.status === 'paid'}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 - 仅管理员可见 */}
      {user?.role === 'admin' && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总收入"
                value={stats.totalRevenue}
                prefix={<DollarOutlined />}
                formatter={(value) => `¥${value?.toLocaleString()}`}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待收费用"
                value={stats.pendingAmount}
                formatter={(value) => `¥${value?.toLocaleString()}`}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="逾期费用"
                value={stats.overdueAmount}
                formatter={(value) => `¥${value?.toLocaleString()}`}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="逾期笔数"
                value={stats.overdueCount}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Search
                placeholder="搜索学生姓名、学号或费用描述"
                allowClear
                style={{ width: 300 }}
                onSearch={setSearchText}
                enterButton={<SearchOutlined />}
              />
              <Select
                placeholder="费用类型"
                allowClear
                style={{ width: 120 }}
                value={filters.type || undefined}
                onChange={(value) => setFilters({ ...filters, type: value || '' })}
              >
                <Option value="tuition">学费</Option>
                <Option value="meal">餐费</Option>
                <Option value="activity">活动费</Option>
                <Option value="material">材料费</Option>
                <Option value="transportation">交通费</Option>
                <Option value="other">其他</Option>
              </Select>
              <Select
                placeholder="状态"
                allowClear
                style={{ width: 100 }}
                value={filters.status || undefined}
                onChange={(value) => setFilters({ ...filters, status: value || '' })}
              >
                <Option value="pending">待支付</Option>
                <Option value="paid">已支付</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
              <Select
                placeholder="学年"
                allowClear
                style={{ width: 120 }}
                value={filters.academicYear || undefined}
                onChange={(value) => setFilters({ ...filters, academicYear: value || '' })}
              >
                <Option value="2023-2024">2023-2024</Option>
                <Option value="2024-2025">2024-2025</Option>
                <Option value="2025-2026">2025-2026</Option>
              </Select>
              <Select
                placeholder="学期"
                allowClear
                style={{ width: 100 }}
                value={filters.semester || undefined}
                onChange={(value) => setFilters({ ...filters, semester: value || '' })}
              >
                <Option value="spring">春季</Option>
                <Option value="fall">秋季</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              {user?.role === 'admin' && (
                <Button
                  icon={<FileTextOutlined />}
                  onClick={() => {
                    // 生成报表功能
                    message.info('报表生成功能开发中');
                  }}
                >
                  生成报表
                </Button>
              )}
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchPayments();
                  fetchStats();
                }}
              >
                刷新
              </Button>
              {user?.role === 'admin' && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingPayment(null);
                    form.resetFields();
                    setModalVisible(true);
                  }}
                >
                  创建缴费
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 支付记录表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={payments}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: payments.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 创建/编辑支付记录模态框 */}
      <Modal
        title={editingPayment ? '编辑支付记录' : '创建支付记录'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPayment(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            academicYear: '2024-2025',
            semester: 'fall'
          }}
        >
          <Form.Item
            name="student"
            label="学生"
            rules={[{ required: true, message: '请选择学生' }]}
          >
            <Select
              placeholder="请选择学生"
              showSearch
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
            >
              {students.map(student => (
                <Option key={student._id} value={student._id}>
                  {student.profile.firstName} {student.profile.lastName} ({student.studentId})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="费用类型"
                rules={[{ required: true, message: '请选择费用类型' }]}
              >
                <Select placeholder="请选择费用类型">
                  <Option value="tuition">学费</Option>
                  <Option value="meal">餐费</Option>
                  <Option value="activity">活动费</Option>
                  <Option value="material">材料费</Option>
                  <Option value="transportation">交通费</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="金额"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入金额"
                  min={0}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (parseFloat(value!.replace(/¥\s?|(,*)/g, '')) || 0) as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="费用描述"
            rules={[{ required: true, message: '请输入费用描述' }]}
          >
            <Input placeholder="请输入费用描述" />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="到期日期"
            rules={[{ required: true, message: '请选择到期日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="请选择到期日期" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="academicYear"
                label="学年"
                rules={[{ required: true, message: '请选择学年' }]}
              >
                <Select placeholder="请选择学年">
                  <Option value="2023-2024">2023-2024</Option>
                  <Option value="2024-2025">2024-2025</Option>
                  <Option value="2025-2026">2025-2026</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="semester"
                label="学期"
                rules={[{ required: true, message: '请选择学期' }]}
              >
                <Select placeholder="请选择学期">
                  <Option value="spring">春季</Option>
                  <Option value="fall">秋季</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPayment ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 支付模态框 */}
      <Modal
        title="确认支付"
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedPayment && (
          <div>
            <Descriptions column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="学生">
                {selectedPayment.student?.profile?.firstName} {selectedPayment.student?.profile?.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="费用类型">
                {getTypeLabel(selectedPayment.type)}
              </Descriptions.Item>
              <Descriptions.Item label="费用描述">
                {selectedPayment.description}
              </Descriptions.Item>
              <Descriptions.Item label="金额">
                <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                  ¥{selectedPayment.amount.toLocaleString()}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Form
              form={payForm}
              layout="vertical"
              onFinish={handleConfirmPay}
            >
              <Form.Item
                name="paymentMethod"
                label="支付方式"
                rules={[{ required: true, message: '请选择支付方式' }]}
              >
                <Select placeholder="请选择支付方式">
                  <Option value="cash">现金</Option>
                  <Option value="bank_transfer">银行转账</Option>
                  <Option value="alipay">支付宝</Option>
                  <Option value="wechat">微信支付</Option>
                  <Option value="card">银行卡</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="transactionId"
                label="交易号"
              >
                <Input placeholder="请输入交易号（可选）" />
              </Form.Item>

              <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                <Space>
                  <Button onClick={() => setPayModalVisible(false)}>
                    取消
                  </Button>
                  <Button type="primary" htmlType="submit">
                    确认支付
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 支付详情模态框 */}
      <Modal
        title="支付详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedPayment && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="学生姓名" span={2}>
              {selectedPayment.student?.profile?.firstName} {selectedPayment.student?.profile?.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="学号">
              {selectedPayment.student?.studentId}
            </Descriptions.Item>
            <Descriptions.Item label="费用类型">
              <Tag color={getTypeColor(selectedPayment.type)}>
                {getTypeLabel(selectedPayment.type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="费用描述" span={2}>
              {selectedPayment.description}
            </Descriptions.Item>
            <Descriptions.Item label="金额">
              <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                ¥{selectedPayment.amount.toLocaleString()}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(selectedPayment.status)}>
                {getStatusLabel(selectedPayment.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="到期日期">
              {dayjs(selectedPayment.dueDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="支付日期">
              {selectedPayment.paymentDate 
                ? dayjs(selectedPayment.paymentDate).format('YYYY-MM-DD HH:mm:ss')
                : '-'
              }
            </Descriptions.Item>
            <Descriptions.Item label="支付方式">
              {selectedPayment.paymentMethod || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="交易号">
              {selectedPayment.transactionId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="学年">
              {selectedPayment.academicYear}
            </Descriptions.Item>
            <Descriptions.Item label="学期">
              {selectedPayment.semester === 'spring' ? '春季' : '秋季'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {dayjs(selectedPayment.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Payments;