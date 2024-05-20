import { useState } from 'react'
import './App.css'
import styled from 'styled-components';
import { Input } from './styles/Common';

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;

  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 400px;
  }
`;

const BtnDiv = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 16px;
  justify-content: end;
`;

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Perform login logic here
  };

  const handleRegister = () => {
    // Navigate to the register view
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
          <a href="#" onClick={handleRegister}>Register</a>
          <button type="button" onClick={handleLogin}>Login</button>
        </BtnDiv>
      </form>
    </FormWrapper>
  )
}

export default App
