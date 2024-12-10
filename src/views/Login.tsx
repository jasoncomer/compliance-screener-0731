import { useState } from 'react';
import { BtnDiv, FormWrapper, Input } from '../styles/Common';
import { Button, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '../api/api';
import { useAppContext } from '../context/AppContext';
import { config } from '../config/config';


import type { NotificationArgsProps } from 'antd';

type NotificationPlacement = NotificationArgsProps['placement'];

const Login = () => {
  const nav = useNavigate();
  const { setUser } = useAppContext();
  const [notifApi, contextHolder] = notification.useNotification();

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken, refreshToken, user } = config.localstorageKeys;

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
    await api.users.authenticateUser(email, password)
      .then(res => {
        if (res.success) {
          localStorage.setItem(accessToken, res.data.accessToken);
          localStorage.setItem(refreshToken, res.data.refreshToken);
          localStorage.setItem(user, JSON.stringify(res.data.user));
          setAuthToken(res.data.accessToken);
          setUser(res.data.user);
          nav('/home/cases');
        }
      })
      .catch((err) => {
        openNotification('topRight');
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const navRegister = () => {
    window.location.href = '/register';
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
          <Button type='default' ghost onClick={navRegister}>Register</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>Login</Button>
        </BtnDiv>
      </form>
    </FormWrapper>

    </>
  );
};

export default Login;