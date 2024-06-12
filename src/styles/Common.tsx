import styled from "styled-components";

export const BtnDiv = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
  justify-content: end;
  margin-top: 1em;
`;

export const Input = styled.input`
  padding: 13px;
  border-radius: 16px;
  border: 1px solid #ccc;
  flex: 1;
`;

export const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;

  form {
    display: flex;
    flex-direction: column;
    width: 400px;
    gap: 1em;
  }
`;
