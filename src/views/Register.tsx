import React, { useState } from 'react';
import { BtnDiv, FormWrapper, Input } from '../styles/Common';
import { Button } from 'antd';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Perform registration logic here
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Password:', password);
  };

  const navLogin = () => {
    window.location.href = '/login';
  }

  return (
    <FormWrapper>
      <img src='https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg' style={{ width: '300px' }} />
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>

        <Input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder='Name'
        />

        <Input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder='Email'
        />
        <Input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder='Password'
        />

        <BtnDiv>
          <Button ghost type='default' onClick={navLogin}>Login</Button>
          <Button type="primary" onClick={handleSubmit}>Register</Button>
        </BtnDiv>
      </form>
    </FormWrapper>
  );
};

export default Register;