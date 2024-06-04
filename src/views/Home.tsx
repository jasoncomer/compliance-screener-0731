import React from 'react';
import { Layout } from 'antd';
import Sidebar from '../components/Sidebar';
// import Navbar from '../components/Navbar';
import { Route, RouteProps, Routes } from 'react-router-dom';
import Cases from '../components/Cases';
import Explorer from './Explorer';
import Settings from './Settings';

const { Content } = Layout;

const contentStyle: React.CSSProperties = {
  display: 'flex',
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  color: '#fff',
  // backgroundColor: '#0958d9',
};

const Home: React.FC<RouteProps> = () => {
  return (
    <Layout>
      <Sidebar />
      <Layout>
        {/* <Navbar /> */}
        <Content style={contentStyle}>
          <Routes>
            <Route path="cases" element={<Cases />} />
            <Route path="settings" element={<Settings />} />
            <Route path="explorer" element={<Explorer />} />
            {/** Redirect to cases for all other paths */}

          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home;