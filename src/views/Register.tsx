import React, { useState } from 'react';
import { Button, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import Input from '../components/common/Input';
import { useTheme } from '../context/ThemeContext';
import { colors } from '@/design-system/tokens'
import { useAnalytics } from '../hooks/useAnalytics';
import PageTransition from '../components/PageTransition';
import styled from 'styled-components';

import type { NotificationArgsProps } from 'antd';

type NotificationPlacement = NotificationArgsProps['placement'];

// Styled components for modern design - matching Login view
const RegisterContainer = styled.div<{ $theme: string }>`
  min-height: 100vh;
  width: 100vw;
  background: ${({ $theme }) => $theme === 'dark' ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const RegisterCard = styled.div<{ $theme: string }>`
  background: ${({ $theme }) => $theme === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 480px;
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
  width: 280px;
  height: 130px;
  margin-bottom: 20px;
`;

const Logo = styled.img<{ $theme: string }>`
  width: 280px;
  height: 130px;
  border-radius: 16px;
  filter: ${({ $theme }) => $theme === 'dark' ? 'brightness(0.9) contrast(1.1)' : 'brightness(1) contrast(1)'};
  opacity: 0.9;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
`;



const Tagline = styled.p<{ $theme: string }>`
  font-size: 14px;
  color: ${({ $theme }) => $theme === 'dark' ? '#a0aec0' : '#718096'};
  margin: 0;
  font-weight: 400;
`;

const RegisterTitle = styled.h2<{ $theme: string }>`
  font-size: 28px;
  font-weight: 600;
  color: ${({ $theme }) => $theme === 'dark' ? '#ffffff' : '#1a202c'};
  margin: 0 0 32px 0;
  text-align: center;
  letter-spacing: -0.025em;
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

const NameRow = styled.div`
  display: flex;
  gap: 16px;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
`;

const StyledButton = styled(Button)<{ variant: 'primary' | 'secondary'; $theme?: string }>`
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  border: ${({ variant, $theme }) => variant === 'secondary' 
    ? `2px solid ${$theme === 'dark' ? '#4a5568' : '#e2e8f0'}` 
    : 'none'};
  background: ${({ variant }) => variant === 'primary' 
    ? colors.brand.primary 
    : 'transparent'};
  color: ${({ variant, $theme }) => variant === 'primary' 
    ? '#ffffff' 
    : $theme === 'dark' ? '#ffffff' : '#1a202c'};
  
  &:hover {
    background: ${({ variant, $theme }) => variant === 'primary' 
      ? colors.brand.primaryDark 
      : $theme === 'dark' ? '#4a5568' : '#f7fafc'};
    border-color: ${({ variant, $theme }) => variant === 'secondary' 
      ? $theme === 'dark' ? '#718096' : '#cbd5e0' 
      : 'transparent'};
  }
  
  &:focus {
    box-shadow: 0 0 0 2px ${colors.brand.primary}40;
  }
`;

const Register = () => {
  const navigate = useNavigate();
  const [notifApi, contextHolder] = notification.useNotification();
  const { trackEvent, trackError } = useAnalytics();
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const openNotification = (placement: NotificationPlacement, message: string, description: string) => {
    notifApi[message === 'Success' ? 'success' : 'error']({
      message,
      description,
      placement,
      duration: 4,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    if (loading) return;
    
    if (!name || !surname || !email || !password) {
      openNotification('topRight', 'Error', 'Please fill in all fields');
      return;
    }

    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.users.registerUser({ name, surname, email, password });
      const { data } = response;
      const { user } = data;
      const { accessToken } = user;
      
      // Save to local storage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      trackEvent('registration_success', { method: 'email' });
      openNotification('topRight', 'Success', 'Account created successfully!');
      
      // Redirect to welcome page
      window.location.href = '/welcome';
    } catch (error: any) {
      console.error('Registration error:', error);
      trackError(error, { context: 'user_registration' });
      
      const errorMessage = error.response?.data?.message || 'Error creating account. Please check your details and try again.';
      openNotification('topRight', 'Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const navLogin = () => {
    // Add a small delay for smooth transition
    setTimeout(() => {
      navigate('/login');
    }, 150);
  };

  return (
    <PageTransition>
      <RegisterContainer $theme={theme}>
        {contextHolder}
        <RegisterCard $theme={theme}>
        <LogoSection>
          <LogoContainer $theme={theme}>
            <Logo 
              src='/aws_blockscout_banner_logo-removebg-preview.png' 
              alt="Blockscout Research Logo"
              $theme={theme}
            />
          </LogoContainer>
          <Tagline $theme={theme}>Advanced blockchain analytics and compliance</Tagline>
        </LogoSection>
        
        <RegisterTitle $theme={theme}>Create your account</RegisterTitle>
        
        <FormSection onSubmit={handleSubmit}>
          <NameRow>
            <Input
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder='First Name'
            />
            <Input
              type="text"
              value={surname}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSurname(e.target.value)}
              placeholder='Last Name'
            />
          </NameRow>

          <InputGroup>
            <Input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder='Enter your email'
            />
            <Input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder='Create a password'
            />
          </InputGroup>
          
          <ActionButtons>
            <StyledButton 
              type='default' 
              variant="secondary"
              $theme={theme}
              onClick={navLogin}
            >
              Back to login
            </StyledButton>
            <StyledButton 
              type="primary" 
              variant="primary"
              $theme={theme}
              htmlType="submit" 
              loading={loading}
            >
              Create account
            </StyledButton>
          </ActionButtons>
        </FormSection>
      </RegisterCard>
    </RegisterContainer>
    </PageTransition>
  );
};

export default Register;