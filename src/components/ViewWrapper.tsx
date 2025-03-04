import React, { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';
import styled from 'styled-components';

const ViewContainer = styled.div<{ $theme: 'light' | 'dark'; $fullWidth?: boolean }>`
  margin-top: 0;
  padding: ${props => props.$fullWidth ? '0' : '24px'};
  padding-top: 0;
  background: ${props => props.$theme === 'light' ? '#fff' : '#141414'};
  border-radius: 4px;
  width: 100%;
  height: 100%;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  margin-top: 0;
  padding: 24px 24px 0;

  .icon {
    margin-right: 8px;
  }

  h2 {
    margin: 0;
    font-size: 28px;
  }
`;

interface ViewWrapperProps {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ 
  icon, 
  title, 
  children, 
  className,
  fullWidth = false
}) => {
  const { theme } = useTheme();
  
  return (
    <ViewContainer 
      className={`view-wrapper ${className || ''}`}
      $theme={theme}
      $fullWidth={fullWidth}
    >
      {title && (
        <TitleContainer>
          {icon && <span className="icon">{icon}</span>}
          <h2>{title}</h2>
        </TitleContainer>
      )}
      {children}
    </ViewContainer>
  );
};

export default ViewWrapper; 