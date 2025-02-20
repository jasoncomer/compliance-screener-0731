import React, { ReactNode } from 'react';
import { Space, Typography } from 'antd';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';

const { Title } = Typography;

const ViewContainer = styled.div`
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const TitleWrapper = styled(Space)`
  margin-bottom: 8px;
  align-items: center;

  .anticon {
    font-size: 24px;
    margin-right: 8px;
    color: ${props => props.theme.theme === 'dark' ? '#ffffff' : '#000000'};
  }

  .ant-typography {
    color: ${props => props.theme.theme === 'dark' ? '#ffffff' : '#000000'} !important;
  }
`;

interface ViewWrapperProps {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ icon, title, children }) => {
  const { theme } = useTheme();
  
  return (
    <ViewContainer>
      <TitleWrapper theme={{ theme }}>
        {icon && icon}
        <Title level={2} style={{ margin: 0 }}>{title}</Title>
      </TitleWrapper>
      {children}
    </ViewContainer>
  );
};

export default ViewWrapper; 