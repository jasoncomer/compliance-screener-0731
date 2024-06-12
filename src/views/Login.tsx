import { useState } from 'react';
import { BtnDiv, FormWrapper, Input } from '../styles/Common';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '../api/api';
import { useAppContext } from '../context/AppContext';

const Login = () => {
  const nav = useNavigate();
  const { setUser } = useAppContext();

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleLogin = async () => {
    await api.users.authenticateUser(email, password)
      .then(res => {
        if (res.success) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          setAuthToken(res.data.accessToken);
          setUser(res.data.user);
          nav('/home/cases');
        }
      })
      .catch(console.error)
  };

  const navRegister = () => {
    window.location.href = '/register';
  };

  return (
    <FormWrapper>
      <img src='https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg' style={{ width: '300px' }} />
      <h2>Login</h2>
      <form>

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
          <Button type="primary" onClick={handleLogin}>Login</Button>
        </BtnDiv>
      </form>
    </FormWrapper>
  );
};

export default Login;