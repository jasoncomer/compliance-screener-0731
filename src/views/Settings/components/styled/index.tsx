import styled from 'styled-components';

const transitionLength = '1s';

export const SettingsLayout = styled.div`
  display: flex;
  gap: 2rem;
  width: 100%;
  min-height: calc(100vh - 200px);
  
  &.full-width-layout {
    max-width: 100%;
  }
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
  min-width: 0; /* This prevents flex items from overflowing */
  width: 100%;
  max-width: 800px;
  
  &.full-width-content {
    max-width: none;
  }
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
  color: ${props => props.theme.theme === 'dark' ? '#e0e0e0' : '#2c3e50'};
  font-weight: 500;
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
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
`;

export const PreferenceToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${props => props.theme.theme === 'dark' ? '#141414' : '#f8f9fa'};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.theme === 'dark' ? '#2d2d2d' : '#e0e0e0'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.theme === 'dark' ? '#1a1a1a' : '#f0f0f0'};
    border-color: ${props => props.theme.theme === 'dark' ? '#3d3d3d' : '#d0d0d0'};
  }

  label {
    width: auto;
    margin-right: 16px;
    font-weight: 500;
  }

  .ant-switch {
    background: ${props => props.theme.theme === 'dark' ? '#404040' : '#d0d0d0'};
  }

  .ant-switch-checked {
    background: #1890ff;
  }

  .ant-input-number,
  .ant-select {
    background: ${props => props.theme.theme === 'dark' ? '#2d2d2d' : '#ffffff'};
    border-color: ${props => props.theme.theme === 'dark' ? '#404040' : '#d0d0d0'};
  }

  .ant-input-number:focus,
  .ant-select:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`; 