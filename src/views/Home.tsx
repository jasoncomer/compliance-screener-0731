import React, { useEffect } from 'react';
import { Layout, Tabs } from 'antd';
import { Route, Routes, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';

import Admin from './Admin';
import Alerts from './Alerts';
import BlockHam from './BlockHam';
import Cases from './Cases';
import Explorer from './Explorer';
import Settings from './Settings';
import RiskScoring from './RiskScoring';
import ComplianceScreener from './ComplianceScreener';
import BlockExplorer from './blockexplorer/BlockExplorer';
import { setAuthToken } from '../api/api';
import { useTheme } from '../context/ThemeContext';

const { Content, Header } = Layout;
const { TabPane } = Tabs;

const Home: React.FC = () => {
  const { theme } = useTheme();
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <Header style={{ position: 'sticky', top: 0, zIndex: 1000, background: theme === 'light' ? '#fff' : '#141414', padding: '0 24px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg" alt="Logo" style={{ height: '80px', marginTop: 0 }} />
            <Tabs activeKey={activeKey} onChange={handleTabChange} style={{ alignSelf: 'flex-end' }}
              tabBarStyle={{ background: theme === 'light' ? '#fff' : '#141414' }}>
              <TabPane tab="Compliance Screener" key="compliance-screener" />
              <TabPane tab="Explorer" key="explorer" />
              <TabPane tab="Block Explorer" key="block-explorer" />
              <TabPane tab="Risk Scoring" key="risk-scoring" />
              <TabPane tab="Alerts" key="alerts" />
              <TabPane tab="Cases" key="cases" />
              <TabPane tab="VASP Entity Explorer" key="blockham" />
              <TabPane tab="Flow Trace" key="flow-trace" />
            </Tabs>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a onClick={() => navigate('/home/admin')} style={{ color: '#C74D1B', cursor: 'pointer' }}>Admin</a>
            <a onClick={() => navigate('/home/settings')} style={{ color: '#C74D1B', cursor: 'pointer' }}>Settings</a>
          </div>
        </Header>
        <Content style={{ background: theme === 'light' ? '#fff' : '#141414', padding: '24px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home;