// Removed: import React from 'react';
import styled from 'styled-components';

export const BtnDiv = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
  justify-content: end;
`;

export const FormWrapper = styled.div<{ theme?: any }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
  background: ${({ theme }) => theme?.theme === 'dark' ? '#18191a' : '#fff'};
  padding: 2.5em 2em;
`;
