import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout as AntLayout,
  Menu,
  Dropdown,
  Avatar,
  Button,
  Space,
  Typography,
  MenuProps,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  BookOutlined,
  UsergroupAddOutlined,
  NotificationOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  // 侧边栏菜单项
  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '仪表板',
      },
    ];

    // 根据用户角色显示不同菜单
    if (hasRole(['admin', 'teacher'])) {
      items.push({
        key: '/students',
        icon: <TeamOutlined />,
        label: '学生管理',
      });
    }

    if (hasRole(['admin'])) {
      items.push({
        key: '/teachers',
        icon: <UsergroupAddOutlined />,
        label: '教师管理',
      });
    }

    if (hasRole(['admin', 'teacher'])) {
      items.push({
        key: '/classes',
        icon: <BookOutlined />,
        label: '班级管理',
      });
    }

    // 通知管理 - 所有用户可访问
    items.push({
      key: '/notifications',
      icon: <NotificationOutlined />,
      label: '通知管理',
    });

    // 财务管理 - 管理员和家长可访问
    if (hasRole(['admin', 'parent'])) {
      items.push({
        key: '/payments',
        icon: <DollarOutlined />,
        label: '财务管理',
      });
    }

    if (hasRole(['admin'])) {
      items.push({
        key: '/users',
        icon: <UserOutlined />,
        label: '用户管理',
      });
    }

    return items;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="layout-sider"
        width={250}
      >
        <div className="sider-logo">
          {!collapsed ? '幼儿园管理系统' : '幼管'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <AntLayout>
        <Header className="layout-header">
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
          </Space>

          <Space size="middle">
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: '16px' }}
            />
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={user?.profile?.avatar}
                />
                <Text strong>
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content className="layout-content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;