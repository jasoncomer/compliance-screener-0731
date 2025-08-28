import React from 'react';
import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { BASE_API_URL } from '@/api/api';

interface GoogleLoginButtonProps {
  loading?: boolean;
  disabled?: boolean;
  onError?: (error: Error) => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  loading = false,
  disabled = false,
  onError,
}) => {
  const handleGoogleLogin = () => {
    try {
      // Redirect to backend Google OAuth endpoint
      window.location.href = `${BASE_API_URL}/auth/google`;
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  return (
    <Button
      type="default"
      size="large"
      icon={<GoogleOutlined />}
      loading={loading}
      disabled={disabled}
      onClick={handleGoogleLogin}
      style={{
        width: '100%',
        height: '45px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#4285f4',
        color: '#4285f4',
        backgroundColor: '#fff',
        fontWeight: 500,
        marginBottom: '16px',
      }}
    >
      Sign in with Google
    </Button>
  );
};

export default GoogleLoginButton; 