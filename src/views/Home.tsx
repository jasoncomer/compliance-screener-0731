import React, { useEffect } from 'react';

import { Outlet } from 'react-router-dom';

import { setAuthToken } from '../api/api';
import SideNav from '../components/SideNav';
import { useTheme } from '../context/ThemeContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSidebarCollapsed } from '../store/slices/uiSlice';
import { storage } from '../utils/storage';

const Home: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const sidebarCollapsed = useAppSelector(state => state.ui.sidebarCollapsed);

  useEffect(() => {
    const token = storage.auth.getAccessToken();
    if (token) setAuthToken(token);
  }, []);

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900">
      <SideNav
        theme={theme}
        collapsed={sidebarCollapsed}
        onCollapse={(collapsed) => dispatch(setSidebarCollapsed(collapsed))}
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