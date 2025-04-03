import React, { useEffect } from 'react';
import { Layout, Tabs, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import BSLogo from '../assets/darkmode_logo.png';
import { useAppContext } from '../context/AppContext';
import { setAuthToken } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import {
  StyledLayout,
  StyledHeader,
  HeaderSection,
  Logo,
  StyledContent,
  UserMenuButton,
  TabsContainer
} from '../styles/Layout';

const Home: React.FC = () => {
  const { theme } = useTheme();
  const { user, clearAppData } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) setAuthToken(token);
  }, []);

  const getActiveTabKey = () => {
    const parts = location.pathname.split('/');
    // Expected path: /home/<tab>
    if (parts.length >= 3 && parts[2]) {
      return parts[2];
    }
    return 'compliance-screener';
  };

  const activeKey = getActiveTabKey();

  const handleTabChange = (key: string) => {
    navigate(`/home/${key}`);
  };

  const handleLogout = () => {
    clearAppData();
    navigate('/login');
  };

  return (
    <StyledLayout>
      <Layout>
        <StyledHeader $theme={theme}>
          <HeaderSection>
            <Logo
              src={BSLogo}
              alt="Logo"
              $theme={theme}
            />
            <TabsContainer $theme={theme}>
              <Tabs
                activeKey={activeKey}
                onChange={handleTabChange}
                items={[
                  { key: 'compliance-screener', label: 'Compliance Screener' },
                  { key: 'block-explorer', label: 'Block Explorer' },
                  { key: 'risk-scoring', label: 'Risk Scoring' },
                  // { key: 'alerts', label: 'Alerts' },
                  { key: 'cases', label: 'Cases' },
                  { key: 'blockham', label: 'VASP Entity Explorer' },
                  // { key: 'flow-trace', label: 'Flow Trace' },
                ]}
              />
            </TabsContainer>
          </HeaderSection>
          <HeaderSection>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'admin',
                    label: 'Admin Panel',
                    icon: <TeamOutlined />,
                    onClick: () => navigate('/home/admin')
                  },
                  {
                    key: 'settings',
                    label: 'Settings',
                    icon: <SettingOutlined />,
                    onClick: () => navigate('/home/settings')
                  },
                  {
                    type: 'divider'
                  },
                  {
                    key: 'logout',
                    label: 'Logout',
                    icon: <LogoutOutlined />,
                    onClick: handleLogout
                  }
                ]
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <UserMenuButton $theme={theme}>
                <UserOutlined />
                <span>{user?.name || 'User'}</span>
              </UserMenuButton>
            </Dropdown>
          </HeaderSection>
        </StyledHeader>
        <StyledContent $theme={theme}>
          <Outlet />
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default Home;