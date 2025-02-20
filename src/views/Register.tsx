import React, { useState } from 'react';
import { BtnDiv, FormWrapper } from '../styles/Common';
import { Button, notification } from 'antd';
import { api } from '../api/api';
import Input from '../components/common/Input';

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
        window.location.href = '/home/cases';
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

  return (
    <>
      {contextHolder}
      <FormWrapper>
        <img src='https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg' style={{ width: '300px' }} />
        <h2>Register</h2>
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
            <Button ghost type='default' onClick={navLogin}>Login</Button>
            <Button disabled={loading} type="primary" onClick={handleSubmit}>Register</Button>
          </BtnDiv>
        </form>
      </FormWrapper>
    </>
  );
};

export default Register;