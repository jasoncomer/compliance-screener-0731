import styled from "styled-components";

export const BtnDiv = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
  justify-content: end;
  // margin-top: 1em;
`;

export const FormWrapper = styled.div<{ theme?: any }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
  background: ${({ theme }) => theme?.theme === 'dark' ? '#18191a' : '#fff'};
  padding: 2.5em 2em;

  form {
    display: flex;
    flex-direction: column;
    width: 400px;
    gap: 1em;
  }
`;
