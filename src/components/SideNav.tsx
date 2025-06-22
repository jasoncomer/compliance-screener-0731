import React from 'react';
import { Layout, Menu, Button, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined, 
  TeamOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  DashboardOutlined,
  GlobalOutlined,
  BarChartOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Theme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import BSLogo from '../assets/darkmode_logo.png';
import './SideNav.css';

const { Sider } = Layout;

interface SideNavProps {
  theme: Theme;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const SideNav: React.FC<SideNavProps> = ({ theme, collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAppData } = useAppContext();

  const getActiveKey = () => {
    const parts = location.pathname.split('/');
    if (parts.length >= 3 && parts[2]) {
      return parts[2];
    }
    return 'compliance-screener';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/home/${key}`);
  };

  const handleLogout = () => {
    clearAppData();
    navigate('/login');
  };

  const handleUserMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'admin') {
      navigate('/home/admin');
    } else if (e.key === 'settings') {
      navigate('/home/settings');
    } else if (e.key === 'logout') {
      handleLogout();
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />
    }
  ];

  // Add admin menu item for blockscout.ai users
  if (user?.email.includes('@blockscout.ai')) {
    userMenuItems.unshift({
      key: 'admin',
      label: 'Admin Panel',
      icon: <TeamOutlined />,
    });
  }

  const navigationItems = [
    {
      key: 'compliance-screener',
      icon: <SearchOutlined />,
      label: 'Compliance Screener',
    },
    {
      key: 'compliance-dashboard',
      icon: <DashboardOutlined />,
      label: 'Compliance Dashboard',
    },
    {
      key: 'block-explorer',
      icon: <GlobalOutlined />,
      label: 'Block Explorer',
    },
    {
      key: 'risk-scoring',
      icon: <BarChartOutlined />,
      label: 'Risk Scoring',
    },
    {
      key: 'risk-dashboard',
      icon: <BarChartOutlined />,
      label: 'Risk Dashboard',
    },
    {
      key: 'blockham',
      icon: <DatabaseOutlined />,
      label: 'VASP Entity Explorer',
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className={cn(
        "sticky top-0 h-screen transition-all duration-300",
        theme === 'light' ? "bg-white border-r border-gray-200" : "bg-gray-900 border-r border-gray-700"
      )}
      width={288}
      collapsedWidth={96}
    >
      <div className="flex flex-col h-full">
        <div className={cn(
          "flex items-center p-4 border-b",
          collapsed ? "justify-center" : "justify-between",
          theme === 'light' ? "border-gray-200" : "border-gray-700"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <img 
                src={BSLogo}
                alt="Logo"
                className="h-8 w-auto"
              />
              <span className={cn(
                "font-semibold text-lg",
                theme === 'light' ? "text-gray-900" : "text-white"
              )}>
                BlockScout
              </span>
            </div>
          )}
          {collapsed ? (
            <Tooltip 
              title="Expand Menu"
              placement="right"
            >
              <Button
                type="text"
                icon={<img src={BSLogo} alt="Logo" className="h-12 w-auto" />}
                onClick={() => onCollapse(!collapsed)}
                className={cn(
                  "flex items-center justify-center side-nav-toggle-btn collapsed",
                  theme === 'light' ? "text-gray-600 hover:text-gray-900" : "text-gray-400 hover:text-white"
                )}
              />
            </Tooltip>
          ) : (
            <Button
              type="text"
              icon={<MenuFoldOutlined />}
              onClick={() => onCollapse(!collapsed)}
              className={cn(
                "flex items-center justify-center side-nav-toggle-btn expanded",
                theme === 'light' ? "text-gray-600 hover:text-gray-900" : "text-gray-400 hover:text-white"
              )}
            />
          )}
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          <Menu
            mode="inline"
            selectedKeys={[getActiveKey()]}
            items={navigationItems}
            onClick={handleMenuClick}
            className={cn(
              "border-0 side-nav-menu",
              theme === 'light' ? "bg-white" : "bg-gray-900 dark"
            )}
            theme={theme === 'light' ? 'light' : 'dark'}
          />
        </div>

        <div className={cn(
          "p-4 border-t",
          theme === 'light' ? "border-gray-200" : "border-gray-700"
        )}>
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="topRight"
            trigger={['click']}
          >
            <div className={cn(
              "flex items-center gap-3 cursor-pointer p-2 rounded-md transition-colors",
              collapsed && "justify-center",
              theme === 'light' 
                ? "hover:bg-gray-100 text-gray-700" 
                : "hover:bg-gray-800 text-gray-300"
            )}>
              <UserOutlined className="text-lg" />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-medium truncate",
                    theme === 'light' ? "text-gray-900" : "text-white"
                  )}>
                    {user?.name || 'User'}
                  </div>
                  <div className={cn(
                    "text-xs truncate",
                    theme === 'light' ? "text-gray-500" : "text-gray-400"
                  )}>
                    {user?.email}
                  </div>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </div>
    </Sider>
  );
};

export default SideNav; 