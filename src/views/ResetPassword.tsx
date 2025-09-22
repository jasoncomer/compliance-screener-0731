import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, notification } from 'antd';
import { FormWrapper } from '../styles/Common';
import { api } from '../api/api';
import { useAnalytics } from '../hooks/useAnalytics';
import { useTheme } from '../context/ThemeContext';
import styled from 'styled-components';
import { colors } from '@/design-system/tokens'
import { Theme } from '../context/ThemeContext';

interface StyledFormWrapperProps {
  $theme: Theme;
}

const PageContainer = styled.div<StyledFormWrapperProps>`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$theme === 'dark' ? '#141414' : '#f0f2f5'};
  padding: 1rem;
  font-family: 'Inter', 'Roboto', 'system-ui', 'sans-serif';
`;

const ModalFormWrapper = styled(FormWrapper)<StyledFormWrapperProps>`
  background: ${props => props.$theme === 'dark' ? '#18191a' : '#fff'};
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 4px 0 rgba(0,0,0,0.10);
  max-width: 400px;
  width: 100%;
  margin: 0;
  padding: 3rem 2rem 2.5rem 2rem;
  font-family: 'Inter', 'Roboto', 'system-ui', 'sans-serif';
  display: flex;
  flex-direction: column;
  align-items: center;

  h2 {
    color: ${props => props.$theme === 'dark' ? '#ffffff' : '#2c3e50'};
    margin-bottom: 2.2rem;
    text-align: center;
    font-weight: 600;
    font-size: 1.3rem;
    letter-spacing: 0.02em;
    font-family: 'Inter', 'Roboto', 'system-ui', 'sans-serif';
  }

  .ant-form {
    width: 100%;
  }

  .ant-form-item {
    margin-bottom: 1.5rem;
  }

  .ant-form-item:last-child {
    margin-bottom: 0;
  }

  .ant-form-item-label > label {
    color: ${colors.brand.primary};
    font-weight: 500;
    font-family: 'Inter', 'Roboto', 'system-ui', 'sans-serif';
    letter-spacing: 0.01em;
  }

  .ant-input-affix-wrapper {
    background: ${props => props.$theme === 'dark' ? '#141414' : '#ffffff'};
    border-color: ${props => props.$theme === 'dark' ? '#434343' : '#d9d9d9'};
    
    &:hover, &:focus {
      border-color: ${colors.brand.primary};
    }
  }

  .ant-input {
    background: ${props => props.$theme === 'dark' ? '#141414' : '#ffffff'};
    color: ${props => props.$theme === 'dark' ? '#ffffff' : '#2c3e50'};
    font-family: 'Inter', 'Roboto', 'system-ui', 'sans-serif';
    
    &::placeholder {
      color: ${props => props.$theme === 'dark' ? '#666666' : '#999999'};
    }
  }

  .ant-btn-primary {
    height: 44px;
    font-size: 17px;
    font-weight: 600;
    border-radius: 8px;
    background: ${colors.brand.primary};
    border: none;
    box-shadow: 0 2px 8px 0 rgba(232, 126, 79, 0.18);
    transition: transform 0.12s cubic-bezier(0.4,0,0.2,1), box-shadow 0.12s cubic-bezier(0.4,0,0.2,1);
    font-family: 'Inter', 'Roboto', 'system-ui', 'sans-serif';
    
    &:hover, &:focus {
      box-shadow: 0 4px 16px 0 rgba(232, 126, 79, 0.28);
      transform: translateY(-2px) scale(1.03);
      background: ${colors.brand.primaryDark || colors.brand.primary};
    }
    &:active {
      box-shadow: 0 1px 4px 0 rgba(232, 126, 79, 0.12);
      transform: translateY(2px) scale(0.98);
      background: ${colors.brand.primary};
    }
  }
`;

const Logo = styled.img`
  width: 200px;
  margin-bottom: 2.5rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
`;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackEvent, trackError } = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);
  const [notifApi, contextHolder] = notification.useNotification();
  const { theme } = useTheme();

  const userId = searchParams.get('id');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!userId || !token) {
      navigate('/login');
    }
  }, [userId, token, navigate]);

  const openNotification = (message: string, description: string, type: 'success' | 'error') => {
    notifApi[type]({
      message,
      description,
      placement: 'topRight',
      duration: 4,
      className: `notification-${theme}`,
    });
  };

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      openNotification('Error', 'Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      trackEvent('Reset Password Attempt');
      
      const response = await api.users.resetPasswordWithToken(userId!, token!, values.password, values.confirmPassword);
      
      if (response.success) {
        openNotification('Success', 'Your password has been reset successfully', 'success');
        trackEvent('Reset Password Success');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      trackError(err as Error);
      openNotification('Error', 'Failed to reset password. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer $theme={theme}>
      {contextHolder}
      <ModalFormWrapper $theme={theme}>
        <Logo src='https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg' alt="Logo" />
        <h2>Reset Password</h2>
        <Form
          name="reset-password"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="password"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            rules={[
              { required: true, message: 'Please confirm your new password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} block>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </ModalFormWrapper>
    </PageContainer>
  );
};

export default ResetPassword; 