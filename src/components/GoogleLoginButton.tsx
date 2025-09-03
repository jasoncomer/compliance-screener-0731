import React from 'react';
import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { config } from '../config/config';
import styled from 'styled-components';

const { BASE_API_URL } = config;

interface GoogleLoginButtonProps {
  loading?: boolean;
  disabled?: boolean;
  onError?: (error: Error) => void;
}

const StyledGoogleButton = styled(Button)`
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e2e8f0;
  color: #374151;
  background-color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  border-radius: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  
  &:hover {
    border-color: #cbd5e0;
    background-color: #f9fafb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }
  
  &:focus {
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }
  
  .anticon {
    font-size: 18px;
    margin-right: 12px;
    color: #4285f4;
  }
`;

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  loading = false,
  disabled = false,
  onError,
}) => {
  const handleGoogleLogin = () => {
    try {
      // Redirect to backend Google OAuth endpoint
      window.location.href = `${BASE_API_URL}/api/v1/auth/google`;
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  return (
    <StyledGoogleButton
      type="default"
      size="large"
      icon={<GoogleOutlined />}
      loading={loading}
      disabled={disabled}
      onClick={handleGoogleLogin}
    >
      Continue with Google
    </StyledGoogleButton>
  );
};

export default GoogleLoginButton; 