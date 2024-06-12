import React, { useState } from 'react';
import { BtnDiv, FormWrapper, Input } from '../styles/Common';
import { Button } from 'antd';
import { api } from '../api/api';

const Register = () => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        alert('Registration successful!');
        window.location.href = '/home/cases';
      })
      .catch((err) => {
        console.error(err);
        alert('An error occurred. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const navLogin = () => {
    window.location.href = '/login';
  }

  return (
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
  );
};

export default Register;