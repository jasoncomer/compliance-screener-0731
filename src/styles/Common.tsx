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
  margin: 10px;
  border-radius: 16px;
  border: 1px solid #ccc;
  width: calc(100% - 20px);
`;

export const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;

  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 400px;
  }
`;
