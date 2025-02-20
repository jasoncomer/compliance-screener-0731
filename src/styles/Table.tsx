import styled from "styled-components";


export const BsBlock = styled.div`
  border-radius: 5px;
  padding: 10px;
  background-color: ${props => props.theme.theme === 'dark' ? '#1f1f1f' : '#fff'};
  margin-bottom: 20px;
  color: ${props => props.theme.theme === 'dark' ? '#ffffff' : '#000000'};

  h3 {
    color: ${props => props.theme.theme === 'dark' ? '#ffffff' : '#000000'};
  }

  hr {
    border-color: ${props => props.theme.theme === 'dark' ? '#303030' : '#f0f0f0'};
  }
`;