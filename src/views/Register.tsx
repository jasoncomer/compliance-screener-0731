import React, { useState } from 'react';
import { BtnDiv, FormWrapper } from '../styles/Common';
import { Button, notification } from 'antd';
import { api } from '../api/api';
import Input from '../components/common/Input';
import { useTheme } from '../context/ThemeContext';
import { colors, darkTokens, lightTokens } from '../styles/variables';

import type { NotificationArgsProps } from 'antd';

type NotificationPlacement = NotificationArgsProps['placement'];

const Register = () => {
  const [notifApi, contextHolder] = notification.useNotification();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const openNotification = (placement: NotificationPlacement) => {
    notifApi.error({
      message: `Registration failed`,
      description: 'Error creating account. Please check your details and try again',
      placement,
      duration: 4,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    if (loading) return;
    setLoading(true);

    if (!name || !surname || !email || !password) {
      alert('Please fill in all fields');
      setLoading(false);
      return;
    }

    event.preventDefault();
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Password:', password);

    api.users.registerUser({ name, surname, email, password })
      .then((res) => {
        const { data } = res;
        const { user } = data;
        const { accessToken } = user;
        console.log('Register response:', res);
        // save to local storage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = '/welcome';
      })
      .catch((err) => {
        console.error(err);
        openNotification('topRight');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const navLogin = () => {
    window.location.href = '/login';
  }

  const { theme } = useTheme();

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: theme === 'dark' ? darkTokens.backgroundColor : lightTokens.backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {contextHolder}
      <FormWrapper theme={{ theme }}>
        <img src='https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg' style={{ width: '300px' }} />
        <h2 style={{ color: colors.primary }}>Register</h2>
        <form onSubmit={handleSubmit}>

          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '1em' }}>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='First Name'
            />
            <Input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder='Last Name'
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1em' }}>
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
          </div>

          <BtnDiv>
            <Button 
              ghost 
              type='default' 
              onClick={navLogin}
              style={{
                borderColor: colors.primary,
                color: colors.primary,
                fontWeight: 500,
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = colors.secondary;
                e.currentTarget.style.color = colors.secondary;
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.color = colors.primary;
              }}
            >
              Login
            </Button>
            <Button disabled={loading} type="primary" onClick={handleSubmit}>Register</Button>
          </BtnDiv>
        </form>
      </FormWrapper>
    </div>
  );
};

export default Register;