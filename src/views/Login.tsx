import { useState } from 'react';
import { BtnDiv, FormWrapper } from '../styles/Common';
import { Button, notification } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, setAuthToken } from '../api/api';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import Input from '../components/common/Input';

import type { NotificationArgsProps } from 'antd';

type NotificationPlacement = NotificationArgsProps['placement'];

const Login = () => {
  const nav = useNavigate();
  const location = useLocation();
  const { setUser } = useAppContext();
  const [notifApi, contextHolder] = notification.useNotification();

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openNotification = (placement: NotificationPlacement) => {
    notifApi.error({
      message: `Login failed`,
      description: `Please check your email and password`,
      placement,
      duration: 4,
    });
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await api.users.authenticateUser(email, password);
      if (res.success) {
        // Store auth data
        storage.auth.setTokens(res.data.accessToken, res.data.refreshToken);
        storage.auth.setUser(res.data.user);
        
        // Update app state
        setAuthToken(res.data.accessToken);
        setUser(res.data.user);
        
        // Navigate to the saved location or default route
        const from = (location.state as any)?.from?.pathname || '/home/cases';
        nav(from, { replace: true });
      }
    } catch (err) {
      openNotification('topRight');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const navRegister = () => {
    nav('/register');
  };

  return (
    <>
    {contextHolder}
    <FormWrapper>
      <img src='https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg' style={{ width: '300px' }} />
      <h2>Login</h2>
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
        <BtnDiv>
          <Button type='primary' ghost onClick={navRegister}>Register</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>Login</Button>
        </BtnDiv>
      </form>
    </FormWrapper>

    </>
  );
};

export default Login;