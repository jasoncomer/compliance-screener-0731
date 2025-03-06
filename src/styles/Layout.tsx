import styled from 'styled-components';
import { Layout } from 'antd';
import { colors } from './variables';
import { Theme } from '../context/ThemeContext';

const { Header: AntHeader } = Layout;

export const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

export const StyledHeader = styled(AntHeader)<{ $theme: Theme }>`
  position: sticky;
  top: 0;
  z-index: 1000;
  background: ${props => props.$theme === 'light' ? '#fff' : '#141414'};
  padding: 0 24px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid ${props => props.$theme === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'};
`;

export const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

export const Logo = styled.img<{ $theme: Theme }>`
  height: 50px;
  margin-top: 0;
  filter: ${props => props.$theme === 'dark' ? 'brightness(0.9)' : 'none'};
`;

export const StyledContent = styled(Layout.Content)<{ $theme: Theme }>`
  background: ${props => props.$theme === 'light' ? '#fff' : '#141414'};
  padding: 24px;
`;

export const UserMenuButton = styled.div<{ $theme: Theme }>`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: ${colors.primary};
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
  background: transparent;

  &:hover {
    background: ${props => props.$theme === 'light' ? 'rgba(199, 77, 27, 0.1)' : 'rgba(199, 77, 27, 0.2)'};
  }

  .anticon {
    font-size: 16px;
  }

  span {
    font-size: 14px;
    font-weight: 500;
  }
`;

export const TabsContainer = styled.div<{ $theme: Theme }>`
  .ant-tabs-nav {
    margin-bottom: 0;
    background: ${props => props.$theme === 'light' ? '#fff' : '#141414'};
  }
`; 