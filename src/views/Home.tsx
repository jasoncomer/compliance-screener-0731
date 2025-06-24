import React, { useEffect, useState } from 'react';

import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../utils/storage';
import { setAuthToken } from '../api/api';
import SideNav from '../components/SideNav';
import { MainContent } from '../styles/Layout';

const Home: React.FC = () => {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = storage.auth.getAccessToken();
    if (token) setAuthToken(token);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden font-mono bg-background">
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
    </div>
  );
};

export default Home;