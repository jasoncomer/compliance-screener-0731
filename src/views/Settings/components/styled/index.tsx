import styled from 'styled-components';

const transitionLength = '1s';

export const SettingsLayout = styled.div`
  display: flex;
  gap: 2rem;
  width: 100%;
  min-height: calc(100vh - 200px);
`;

export const Sidebar = styled.div`
  width: 250px;
  flex-shrink: 0;
  background: ${props => props.theme.theme === 'dark' ? '#1f1f1f' : 'white'};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px ${props => props.theme.theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
`;

export const SidebarItem = styled.div<{ 'data-active'?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all ${transitionLength} ease;
  background: ${props => props['data-active'] 
    ? props.theme.theme === 'dark' 
      ? '#2d2d2d' 
      : '#f0f0f0'
    : 'transparent'
  };

  &:hover {
    background: ${props => props.theme.theme === 'dark' ? '#2d2d2d' : '#f0f0f0'};
  }

  .icon {
    font-size: 18px;
    color: ${props => props['data-active']
      ? props.theme.theme === 'dark'
        ? '#3498db'
        : '#2980b9'
      : props.theme.theme === 'dark'
        ? '#a0a0a0'
        : '#7f8c8d'
    };
  }

  span {
    font-size: 15px;
    color: ${props => props['data-active']
      ? props.theme.theme === 'dark'
        ? '#ffffff'
        : '#2c3e50'
      : props.theme.theme === 'dark'
        ? '#a0a0a0'
        : '#7f8c8d'
    };
  }
`;

export const ContentArea = styled.div`
  flex: 1;
  max-width: 800px;
`;

export const Card = styled.div`
  padding: 2em;
  background: ${props => props.theme.theme === 'dark' ? '#1f1f1f' : 'white'};
  border-radius: 12px;
  box-shadow: 0 4px 6px ${props => props.theme.theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  margin-bottom: 0;
`;

export const SubTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  margin: 0em 0 1em 0;
  color: ${props => props.theme.theme === 'dark' ? '#ffffff' : '#34495e'};
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  margin-top: 0;

  &:after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${props => props.theme.theme === 'dark' ? '#303030' : '#e0e0e0'};
    margin-left: 8px;
  }
`;

export const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
`;

export const InfoItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme.theme === 'dark' ? '#141414' : '#f8f9fa'};
  padding: 12px 16px;
  border-radius: 8px;
  transition: all ${transitionLength} ease;
  min-height: 50px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px ${props => props.theme.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

export const Label = styled.span`
  font-size: 14px;
  color: ${props => props.theme.theme === 'dark' ? '#a0a0a0' : '#7f8c8d'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 200px;
  text-align: left;
  line-height: 1.5;
`;

export const Value = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.theme === 'dark' ? '#ffffff' : '#2c3e50'};
  margin: 0;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &.capitalize {
    text-transform: capitalize;
  }
`;

export const Button = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background ${transitionLength} ease;

  &:hover {
    background: #2980b9;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &.delete-button {
    background: #e74c3c;

    &:hover {
      background: #c0392b;
    }
  }
`;

export const PreferencesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
`;

export const PreferenceToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme.theme === 'dark' ? '#141414' : '#f8f9fa'};
  border-radius: 8px;

  label {
    width: auto;
    margin-right: 16px;
  }
`; 