import { useState } from 'react';
import { Button, notification, Modal, Form, Divider } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, setAuthToken } from '../api/api';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import Input from '../components/common/Input';
import { useAnalytics } from '../hooks/useAnalytics';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/variables';
import GoogleLoginButton from '../components/GoogleLoginButton';
import PageTransition from '../components/PageTransition';
import styled from 'styled-components';

import type { NotificationArgsProps } from 'antd';

type NotificationPlacement = NotificationArgsProps['placement'];

// Styled components for modern design
const LoginContainer = styled.div<{ $theme: string }>`
  min-height: 100vh;
  width: 100vw;
  background: ${({ $theme }) => $theme === 'dark' ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LoginCard = styled.div<{ $theme: string }>`
  background: ${({ $theme }) => $theme === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 420px;
  box-shadow: ${({ $theme }) => $theme === 'dark' 
    ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
    : '0 25px 50px -12px rgba(0, 0, 0, 0.1)'};
  border: ${({ $theme }) => $theme === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid rgba(0, 0, 0, 0.05)'};
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LogoContainer = styled.div<{ $theme: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
`;

const Logo = styled.img`
  width: 130px;
  height: 110px;
  border-radius: 16px;
  opacity: 0.9;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
`;

const BrandName = styled.h1<{ $theme: string }>`
  font-size: 24px;
  font-weight: 700;
  color: ${({ $theme }) => $theme === 'dark' ? '#ffffff' : '#1a202c'};
  margin: 0 0 8px 0;
  letter-spacing: -0.025em;
`;

const Tagline = styled.p<{ $theme: string }>`
  font-size: 14px;
  color: ${({ $theme }) => $theme === 'dark' ? '#a0aec0' : '#718096'};
  margin: 0;
  font-weight: 400;
`;



const GoogleButtonWrapper = styled.div`
  margin-bottom: 24px;
`;

const StyledDivider = styled(Divider)`
  margin: 32px 0 !important;
  color: #a0aec0 !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  
  &::before,
  &::after {
    border-color: #e2e8f0 !important;
  }
`;

const FormSection = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ForgotPasswordLink = styled.a<{ $theme: string }>`
  color: ${({ $theme }) => $theme === 'dark' ? colors.primary : colors.primary};
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
  display: block;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
`;

const StyledButton = styled(Button)<{ variant: 'primary' | 'secondary' }>`
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  border: ${({ variant }) => variant === 'secondary' 
    ? '2px solid #e2e8f0'
    : 'none'};
  background: ${({ variant }) => variant === 'primary' 
    ? colors.primary 
    : 'transparent'};
  color: ${({ variant }) => variant === 'primary' 
    ? '#ffffff' 
    : '#1a202c'};
  
  &:hover {
    background: ${({ variant }) => variant === 'primary' 
      ? colors.primaryDark 
      : '#f7fafc'};
    border-color: ${({ variant }) => variant === 'secondary' 
      ? '#cbd5e0'
      : 'transparent'};
  }
  
  &:focus {
    box-shadow: 0 0 0 2px ${colors.primary}40;
  }
`;

const Login = () => {
  const nav = useNavigate();
  const location = useLocation();
  const { setUser } = useAppContext();
  const [notifApi, contextHolder] = notification.useNotification();
  const { trackEvent, trackError } = useAnalytics();
  const { theme } = useTheme();
  console.log('Current theme in Login:', theme);

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const openNotification = (placement: NotificationPlacement, message: string, description: string) => {
    notifApi[message === 'Success' ? 'success' : 'error']({
      message,
      description,
      placement,
      duration: 4,
    });
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await api.users.authenticateUser(email, password);
      const { accessToken, refreshToken, user } = response.data;
      
      setAuthToken(accessToken);
      storage.auth.setTokens(accessToken, refreshToken || '');
      storage.auth.setUser(user);
      setUser(user);
      
      trackEvent('login_success', { method: 'email' });
      
      const from = location.state?.from?.pathname || '/home/block-explorer';
      nav(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      trackError(error, { context: 'email_login' });
      
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      openNotification('topRight', 'Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      openNotification('topRight', 'Error', 'Please enter your email address.');
      return;
    }

    setIsResetting(true);
    try {
      await api.users.resetPassword(resetEmail);
      openNotification('topRight', 'Success', 'Password reset email sent. Please check your inbox.');
      setIsResetModalVisible(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      openNotification('topRight', 'Error', errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  const navRegister = () => {
    // Add a small delay for smooth transition
    setTimeout(() => {
      nav('/register');
    }, 150);
  };

  return (
    <PageTransition>
      <LoginContainer $theme={theme}>
        {contextHolder}
        <LoginCard $theme={theme}>
        <LogoSection>
                  <LogoContainer $theme={theme}>
          <Logo 
            src='https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg' 
            alt="Blockscout Research Logo"
          />
        </LogoContainer>
        <BrandName $theme={theme}>BLOCKSCOUT RESEARCH</BrandName>
        <Tagline $theme={theme}>Advanced blockchain analytics and compliance</Tagline>
        </LogoSection>
        {/* Google OAuth Button */}
        <GoogleButtonWrapper>
          <GoogleLoginButton
            onError={(error) => {
              trackError(error, { context: 'google_oauth' });
              openNotification('topRight', 'Google Login Failed', 'Failed to initiate Google login. Please try again.');
            }}
          />
        </GoogleButtonWrapper>
        
        <StyledDivider>or continue with email</StyledDivider>
        
        <FormSection onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}>
          <InputGroup>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter your email'
            />

            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter your password'
            />
          </InputGroup>
          
          <ForgotPasswordLink
            $theme={theme}
            href="#"
            onClick={e => { e.preventDefault(); setIsResetModalVisible(true); }}
          >
            Forgot your password?
          </ForgotPasswordLink>
          
          <ActionButtons>
            <StyledButton 
              type='default' 
              variant="secondary"
              onClick={navRegister}
            >
              Create account
            </StyledButton>
            <StyledButton 
              type="primary" 
              variant="primary"
              htmlType="submit" 
              loading={isLoading}
            >
              Sign in
            </StyledButton>
          </ActionButtons>
        </FormSection>
      </LoginCard>

      <Modal
        title="Reset Password"
        open={isResetModalVisible}
        onCancel={() => {
          setIsResetModalVisible(false);
          setResetEmail('');
        }}
        onOk={handleResetPassword}
        confirmLoading={isResetting}
      >
        <Form layout="vertical">
          <Form.Item
            label="Email"
            required
            help="Enter the email address associated with your account"
          >
            <Input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </Form.Item>
        </Form>
      </Modal>
        </LoginContainer>
      </PageTransition>
    );
  };

export default Login;