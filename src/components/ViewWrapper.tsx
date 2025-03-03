import React, { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';


interface ViewWrapperProps {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ icon, title, children, className }) => {
  const { theme } = useTheme();
  
  return (
    <div
      className={`view-wrapper ${className || ''}`}
      style={{
        marginTop: 0,
        padding: '24px',
        paddingTop: 0,
        background: theme === 'light' ? '#fff' : '#141414',
        borderRadius: '4px'
      }}
    >
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', marginTop: 0 }}>
          {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
          <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: '28px' }}>{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
};

export default ViewWrapper; 