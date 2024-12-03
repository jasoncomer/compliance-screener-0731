import React, { useEffect } from 'react';
import { Layout } from 'antd';
import Sidebar from '../components/Sidebar';
// import Navbar from '../components/Navbar';
import { Route, RouteProps, Routes } from 'react-router-dom';
import Cases from './Cases';
import Explorer from './Explorer';
import Settings from './Settings';
import { setAuthToken } from '../api/api';
import BlockExplorer from './blockexplorer/BlockExplorer';
import BlockHam from './BlockHam';

const { Content } = Layout;

const contentStyle: React.CSSProperties = {
  display: 'flex',
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  color: '#fff',
  overflow: 'auto',
};

const Home: React.FC<RouteProps> = () => {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) setAuthToken(token);
  }, [])

  return (
    <Layout>
      <Sidebar />
      <Layout>
        {/* <Navbar /> */}
        
        <Content style={contentStyle}>
          <Routes>
            <Route path="/cases" element={<Cases />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/blockham" element={<BlockHam />} />
            <Route path="/block-explorer/*" element={<BlockExplorer />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home;