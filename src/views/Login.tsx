import { useState } from 'react';
import { BtnDiv, FormWrapper } from '../styles/Common';
import { Button, notification, Modal, Form } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, setAuthToken } from '../api/api';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import Input from '../components/common/Input';
import { useAnalytics } from '../hooks/useAnalytics';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/variables';

import type { NotificationArgsProps } from 'antd';

type NotificationPlacement = NotificationArgsProps['placement'];

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
      trackEvent('Login Attempt', { email });
      
      const res = await api.users.authenticateUser(email, password);
      if (res.success) {
        // Store auth data
        storage.auth.setTokens(res.data.accessToken, res.data.refreshToken);
        storage.auth.setUser(res.data.user);
        
        // Update app state
        setAuthToken(res.data.accessToken);
        setUser(res.data.user);
        
        // Track successful login
        trackEvent('Login Success', {
          userId: res.data.user._id,
          email: res.data.user.email
        });
        
        // Navigate to the saved location or default route
        const from = (location.state as any)?.from?.pathname || '/home/cases';
        nav(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err); // Debug log
      trackError(err as Error, { email });
      openNotification('topRight', 'Login failed', 'Please check your email and password');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      openNotification('topRight', 'Error', 'Please enter your email address');
      return;
    }

    setIsResetting(true);
    try {
      await api.users.resetPassword(resetEmail);
      openNotification('topRight', 'Success', 'Password reset instructions have been sent to your email');
      setIsResetModalVisible(false);
      setResetEmail('');
    } catch (err) {
      trackError(err as Error, { email: resetEmail });
      openNotification('topRight', 'Error', 'Failed to send reset instructions. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const navRegister = () => {
    trackEvent('Navigate to Register');
    nav('/register');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: theme === 'dark' ? '#18191a' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {contextHolder}
      <FormWrapper theme={{ theme }}>
        <img src='https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg' style={{ width: '300px' }} />
        <h2 style={{ color: colors.primary }}>Login</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}>

          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Email'
          />

          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Password'
          />
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start'}}>
            <a
              href="#"
              onClick={e => { e.preventDefault(); setIsResetModalVisible(true); }}
              style={{ color: '#d26a3b', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}
            >
              Forgot Password?
            </a>
          </div>
          <BtnDiv>
            <Button type='primary' ghost onClick={navRegister}>Register</Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>Login</Button>
          </BtnDiv>
        </form>
      </FormWrapper>

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
    </div>
  );
};

export default Login;