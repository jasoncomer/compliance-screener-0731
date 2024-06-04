import React from 'react';
import { Layout } from 'antd';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
const { Header } = Layout;

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  height: 64,
  paddingInline: 48,
  lineHeight: '64px',
};

const LinkWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
`;

function Navbar() {
  return (
    <Header style={headerStyle}>
      <LinkWrapper>
        <Link to="/home">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </LinkWrapper>
    </Header>
  );
}

export default Navbar;