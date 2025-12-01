import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Badge,
  Tooltip,
  List,
  Avatar,
  Typography,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BellOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Notification, ApiResponse } from '../types';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;
const { Text, Title } = Typography;

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    status: ''
  });
  const [stats, setStats] = useState({
    totalNotifications: 0,
    typeStats: [],
    priorityStats: []
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // 获取通知列表
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (filters.type) params.append('type', filters.type);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get<ApiResponse<{ notifications: Notification[] }>>(`/notifications?${params}`);
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      message.error('获取通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    if (!['admin', 'teacher'].includes(user?.role || '')) return;
    
    try {
      const response = await api.get<ApiResponse<any>>('/notifications/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 获取未读通知数量
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      if (response.data.success) {
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    fetchUnreadCount();
  }, [searchText, filters]);

  // 处理添加/编辑通知
  const handleSubmit = async (values: any) => {
    try {
      if (editingNotification) {
        await api.put(`/notifications/${editingNotification._id}`, values);
        message.success('更新通知成功');
      } else {
        await api.post('/notifications', values);
        message.success('创建通知成功');
      }

      setModalVisible(false);
      setEditingNotification(null);
      form.resetFields();
      fetchNotifications();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 处理删除通知
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      message.success('删除通知成功');
      fetchNotifications();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // 打开编辑模态框
  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    form.setFieldsValue(notification);
    setModalVisible(true);
  };

  // 查看通知详情
  const handleViewDetail = async (notification: Notification) => {
    try {
      // 标记为已读
      if (!notification.readBy?.includes(user?._id || '')) {
        await api.put(`/notifications/${notification._id}/read`);
        fetchUnreadCount();
      }
      
      setSelectedNotification(notification);
      setDetailModalVisible(true);
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记所有为已读
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      message.success('已标记所有通知为已读');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 获取通知类型颜色
  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'general': 'blue',
      'urgent': 'red',
      'event': 'green',
      'academic': 'orange',
      'health': 'purple',
      'payment': 'gold'
    };
    return colors[type] || 'default';
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'low': 'green',
      'medium': 'orange',
      'high': 'red'
    };
    return colors[priority] || 'default';
  };

  // 获取通知类型中文名
  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'general': '一般通知',
      'urgent': '紧急通知',
      'event': '活动通知',
      'academic': '教学通知',
      'health': '健康通知',
      'payment': '缴费通知'
    };
    return labels[type] || type;
  };

  // 获取优先级中文名
  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      'low': '低',
      'medium': '中',
      'high': '高'
    };
    return labels[priority] || priority;
  };

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Notification) => {
        const isUnread = !record.readBy?.includes(user?._id || '');
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isUnread && <Badge status="processing" style={{ marginRight: 8 }} />}
            <div>
              <div style={{ fontWeight: isUnread ? 'bold' : 'normal' }}>{title}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{getPriorityLabel(priority)}</Tag>
      ),
    },
    {
      title: '发布者',
      key: 'author',
      render: (record: Notification) => (
        <div>
          {record.author?.profile?.firstName} {record.author?.profile?.lastName}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>
          {status === 'published' ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (record: Notification) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {['admin', 'teacher'].includes(user?.role || '') && (
            <>
              <Tooltip title="编辑">
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEdit(record)}
                  disabled={record.status === 'published'}
                />
              </Tooltip>
              <Popconfirm
                title="确定要删除这个通知吗？"
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
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 - 仅管理员和教师可见 */}
      {['admin', 'teacher'].includes(user?.role || '') && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="通知总数"
                value={stats.totalNotifications}
                prefix={<BellOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="未读通知"
                value={unreadCount}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="紧急通知"
                value={(stats.typeStats?.find((t: any) => t._id === 'urgent') as any)?.count || 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="高优先级"
                value={(stats.priorityStats?.find((p: any) => p._id === 'high') as any)?.count || 0}
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
                placeholder="搜索通知标题或内容"
                allowClear
                style={{ width: 300 }}
                onSearch={setSearchText}
                enterButton={<SearchOutlined />}
              />
              <Select
                placeholder="类型"
                allowClear
                style={{ width: 120 }}
                value={filters.type || undefined}
                onChange={(value) => setFilters({ ...filters, type: value || '' })}
              >
                <Option value="general">一般通知</Option>
                <Option value="urgent">紧急通知</Option>
                <Option value="event">活动通知</Option>
                <Option value="academic">教学通知</Option>
                <Option value="health">健康通知</Option>
                <Option value="payment">缴费通知</Option>
              </Select>
              <Select
                placeholder="优先级"
                allowClear
                style={{ width: 100 }}
                value={filters.priority || undefined}
                onChange={(value) => setFilters({ ...filters, priority: value || '' })}
              >
                <Option value="low">低</Option>
                <Option value="medium">中</Option>
                <Option value="high">高</Option>
              </Select>
              <Select
                placeholder="状态"
                allowClear
                style={{ width: 100 }}
                value={filters.status || undefined}
                onChange={(value) => setFilters({ ...filters, status: value || '' })}
              >
                <Option value="draft">草稿</Option>
                <Option value="published">已发布</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<CheckOutlined />}
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                全部已读
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchNotifications();
                  fetchStats();
                  fetchUnreadCount();
                }}
              >
                刷新
              </Button>
              {['admin', 'teacher'].includes(user?.role || '') && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingNotification(null);
                    form.resetFields();
                    setModalVisible(true);
                  }}
                >
                  创建通知
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 通知表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={notifications}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: notifications.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 创建/编辑通知模态框 */}
      <Modal
        title={editingNotification ? '编辑通知' : '创建通知'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingNotification(null);
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
            type: 'general',
            priority: 'medium',
            status: 'draft',
            recipients: { type: 'all' }
          }}
        >
          <Form.Item
            name="title"
            label="通知标题"
            rules={[{ required: true, message: '请输入通知标题' }]}
          >
            <Input placeholder="请输入通知标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="通知内容"
            rules={[{ required: true, message: '请输入通知内容' }]}
          >
            <TextArea rows={6} placeholder="请输入通知内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="type"
                label="通知类型"
                rules={[{ required: true, message: '请选择通知类型' }]}
              >
                <Select placeholder="请选择通知类型">
                  <Option value="general">一般通知</Option>
                  <Option value="urgent">紧急通知</Option>
                  <Option value="event">活动通知</Option>
                  <Option value="academic">教学通知</Option>
                  <Option value="health">健康通知</Option>
                  <Option value="payment">缴费通知</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择优先级">
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="draft">草稿</Option>
                  <Option value="published">发布</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['recipients', 'type']}
            label="接收者"
            rules={[{ required: true, message: '请选择接收者类型' }]}
          >
            <Select placeholder="请选择接收者类型">
              <Option value="all">所有用户</Option>
              <Option value="role">按角色</Option>
              <Option value="class">按班级</Option>
              <Option value="individual">指定用户</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingNotification ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 通知详情模态框 */}
      <Modal
        title="通知详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedNotification && (
          <div>
            <Title level={4}>{selectedNotification.title}</Title>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={getTypeColor(selectedNotification.type)}>
                {getTypeLabel(selectedNotification.type)}
              </Tag>
              <Tag color={getPriorityColor(selectedNotification.priority)}>
                优先级: {getPriorityLabel(selectedNotification.priority)}
              </Tag>
              <Tag color={selectedNotification.status === 'published' ? 'green' : 'orange'}>
                {selectedNotification.status === 'published' ? '已发布' : '草稿'}
              </Tag>
            </Space>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <Text strong>发布时间：</Text>
              <Text>{dayjs(selectedNotification.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>发布者：</Text>
              <Text>
                {selectedNotification.author?.profile?.firstName} {selectedNotification.author?.profile?.lastName}
              </Text>
            </div>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <Text strong>通知内容：</Text>
            </div>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '6px',
              whiteSpace: 'pre-wrap'
            }}>
              {selectedNotification.content}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Notifications;