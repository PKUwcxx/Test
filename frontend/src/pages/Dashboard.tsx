import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  List,
  Avatar,
  Tag,
  Space,
  Button,
  Spin,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  DollarOutlined,
  BellOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  pendingPayments: number;
  recentNotifications: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
}

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 这里应该调用实际的API，现在使用模拟数据
      const mockStats: DashboardStats = {
        totalStudents: 156,
        totalTeachers: 24,
        totalClasses: 8,
        pendingPayments: 12,
        recentNotifications: [
          {
            id: '1',
            title: '新学期开学通知',
            type: 'general',
            createdAt: '2024-01-15T10:00:00Z',
          },
          {
            id: '2',
            title: '家长会安排',
            type: 'event',
            createdAt: '2024-01-14T15:30:00Z',
          },
          {
            id: '3',
            title: '学费缴费提醒',
            type: 'payment',
            createdAt: '2024-01-13T09:00:00Z',
          },
        ],
        upcomingEvents: [
          {
            id: '1',
            title: '春季运动会',
            date: '2024-03-15',
            type: 'activity',
          },
          {
            id: '2',
            title: '家长开放日',
            date: '2024-02-20',
            type: 'meeting',
          },
          {
            id: '3',
            title: '期末汇报演出',
            date: '2024-06-30',
            type: 'performance',
          },
        ],
      };
      
      // 模拟API延迟
      setTimeout(() => {
        setStats(mockStats);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = '早上好';
    if (hour >= 12 && hour < 18) {
      greeting = '下午好';
    } else if (hour >= 18) {
      greeting = '晚上好';
    }

    const roleNames = {
      admin: '管理员',
      teacher: '老师',
      parent: '家长',
    };

    return `${greeting}，${roleNames[user?.role as keyof typeof roleNames]} ${user?.profile?.firstName}！`;
  };

  const getNotificationTypeColor = (type: string) => {
    const colors = {
      general: 'blue',
      event: 'green',
      payment: 'orange',
      urgent: 'red',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      activity: 'purple',
      meeting: 'blue',
      performance: 'gold',
      holiday: 'green',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">
          {getWelcomeMessage()}
        </Title>
        <Text type="secondary">
          欢迎回到幼儿园管理系统，今天是 {new Date().toLocaleDateString('zh-CN')}
        </Text>
      </div>

      {/* 统计卡片 - 仅管理员和教师可见 */}
      {hasRole(['admin', 'teacher']) && stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="学生总数"
                value={stats.totalStudents}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="教师总数"
                value={stats.totalTeachers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="班级总数"
                value={stats.totalClasses}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="待缴费用"
                value={stats.pendingPayments}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        {/* 最新通知 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BellOutlined />
                最新通知
              </Space>
            }
            extra={<Button type="link">查看全部</Button>}
          >
            <List
              dataSource={stats?.recentNotifications || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<BellOutlined />} />}
                    title={
                      <Space>
                        {item.title}
                        <Tag color={getNotificationTypeColor(item.type)}>
                          {item.type === 'general' && '通知'}
                          {item.type === 'event' && '活动'}
                          {item.type === 'payment' && '缴费'}
                          {item.type === 'urgent' && '紧急'}
                        </Tag>
                      </Space>
                    }
                    description={new Date(item.createdAt).toLocaleString('zh-CN')}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 即将到来的活动 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CalendarOutlined />
                即将到来的活动
              </Space>
            }
            extra={<Button type="link">查看日历</Button>}
          >
            <List
              dataSource={stats?.upcomingEvents || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<CalendarOutlined />} />}
                    title={
                      <Space>
                        {item.title}
                        <Tag color={getEventTypeColor(item.type)}>
                          {item.type === 'activity' && '活动'}
                          {item.type === 'meeting' && '会议'}
                          {item.type === 'performance' && '演出'}
                          {item.type === 'holiday' && '假期'}
                        </Tag>
                      </Space>
                    }
                    description={new Date(item.date).toLocaleDateString('zh-CN')}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 - 根据角色显示不同操作 */}
      <Card title="快捷操作" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          {hasRole(['admin', 'teacher']) && (
            <>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Button type="primary" block icon={<TeamOutlined />}>
                  添加学生
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Button block icon={<BellOutlined />}>
                  发布通知
                </Button>
              </Col>
            </>
          )}
          {hasRole(['admin']) && (
            <>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Button block icon={<UserOutlined />}>
                  添加用户
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Button block icon={<BookOutlined />}>
                  创建班级
                </Button>
              </Col>
            </>
          )}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Button block icon={<UserOutlined />}>
              个人资料
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;