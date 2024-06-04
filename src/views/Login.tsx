import { useState } from 'react';
import { BtnDiv, FormWrapper, Input } from '../styles/Common';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const nav = useNavigate();
  // const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleLogin = () => {
    nav('/home');
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