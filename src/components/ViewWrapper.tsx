import React, { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';
import styled from 'styled-components';
import { colors } from '../styles/variables';

const ViewContainer = styled.div<{ $theme: 'light' | 'dark'; $fullWidth?: boolean }>`
  width: 100%;
  height: auto;
  background-color: ${props => props.$theme === 'light' ? colors.white : 'inherit'};
  max-width: ${props => props.$fullWidth ? '100%' : '1200px'};
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  margin-top: 0;
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