import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../utils/storage';
import { setAuthToken } from '../api/api';
import SideNav from '../components/SideNav';
import { StyledLayout, MainContent } from '../styles/Layout';

const Home: React.FC = () => {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = storage.auth.getAccessToken();
    if (token) setAuthToken(token);
  }, []);

  return (
    <StyledLayout>
      <Layout>
        <SideNav 
          theme={theme} 
          collapsed={sidebarCollapsed} 
          onCollapse={setSidebarCollapsed} 
        />
        <MainContent 
          $theme={theme} 
          sidebarCollapsed={sidebarCollapsed}
        >
          <Outlet />
        </MainContent>
      </Layout>
    </StyledLayout>
  );
};

export default Home;