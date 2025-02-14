import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { Route, RouteProps, Routes } from 'react-router-dom';

import Admin from './Admin';
import BlockHam from './BlockHam';
import Cases from './Cases';
import Explorer from './Explorer';
import Settings from './Settings';
import RiskScoring from './RiskScoring';

import { setAuthToken } from '../api/api';
import Sidebar from '../components/Sidebar';
import BlockExplorer from './blockexplorer/BlockExplorer';

const { Content } = Layout;


const Home: React.FC<RouteProps> = () => {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) setAuthToken(token);
  }, [])

  return (
    <Layout>
      <Sidebar />
      <Layout>
        <Content>
          <Routes>
            <Route path="/admin" element={<Admin />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/blockham" element={<BlockHam />} />
            <Route path="/block-explorer/*" element={<BlockExplorer />} />
            <Route path="/risk-scoring" element={<RiskScoring />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home;