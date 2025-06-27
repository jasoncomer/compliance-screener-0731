import React, { useEffect, useState } from 'react';

import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../utils/storage';
import { setAuthToken } from '../api/api';
import SideNav from '../components/SideNav';

const Home: React.FC = () => {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = storage.auth.getAccessToken();
    if (token) setAuthToken(token);
  }, []);

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900">
      <SideNav
        theme={theme}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Home;