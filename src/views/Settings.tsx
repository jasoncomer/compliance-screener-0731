import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Switch } from 'antd';

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background-color: transparent;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 32px;
  color: ${props => props.theme.theme === 'dark' ? '#ffffff' : '#2c3e50'};
  height: 40px;
`;

const Card = styled.div`
  padding: 2em;
  background: ${props => props.theme.theme === 'dark' ? '#1f1f1f' : 'white'};
  border-radius: 12px;
  box-shadow: 0 4px 6px ${props => props.theme.theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  margin-bottom: 2em;
`;

const SubTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  margin: 0em 0 1em 0;
  color: ${props => props.theme.theme === 'dark' ? '#ffffff' : '#34495e'};
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  margin-top: 0x;

  &:after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${props => props.theme.theme === 'dark' ? '#303030' : '#e0e0e0'};
    margin-left: 8px;
  }
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  background: ${props => props.theme.theme === 'dark' ? '#141414' : '#f8f9fa'};
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  height: 50px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px ${props => props.theme.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const Label = styled.span`
  font-size: 14px;
  color: ${props => props.theme.theme === 'dark' ? '#a0a0a0' : '#7f8c8d'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 200px;
  text-align: left;
  line-height: 1.5;
`;

const Value = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.theme === 'dark' ? '#ffffff' : '#2c3e50'};
  margin: 0;
  line-height: 1.5;
  &.capitalize {
    text-transform: capitalize;
  }
`;

const Button = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: 24px;

  &:hover {
    background: #2980b9;
  }
`;

const PreferencesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
`;

const PreferenceToggle = styled.div`
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

const Settings: React.FC = () => {
  const { user } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  
  const enabled = true;

  return (
    <Container theme={{ theme }}>
      <Title theme={{ theme }}>Settings</Title>
      
      <Card theme={{ theme }}>
        <SubTitle theme={{ theme }}>User Information</SubTitle>
        <InfoList>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Name</Label>
            <Value theme={{ theme }} className='capitalize'>{user?.name || 'N/A'} {user?.surname || 'N/A'}</Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Email</Label>
            <Value theme={{ theme }}>{user?.email || 'N/A'}</Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Email Verified</Label>
            <Value theme={{ theme }}>{user?.isVerified ? 'Yes' : 'No'}</Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Account Created</Label>
            <Value theme={{ theme }}>
              {user?.createdAt 
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'N/A'}
            </Value>
          </InfoItem>
        </InfoList>
        {enabled && <Button>Edit Profile</Button>}
      </Card>

      <Card theme={{ theme }}>
        <SubTitle theme={{ theme }}>Preferences</SubTitle>
        <PreferencesGrid>
          <PreferenceToggle theme={{ theme }}>
            <Label theme={{ theme }} style={{ margin: 0 }}>Email Notifications</Label>
            <Switch
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
            />
          </PreferenceToggle>
          <PreferenceToggle theme={{ theme }}>
            <Label theme={{ theme }} style={{ margin: 0 }}>Dark Mode</Label>
            <Switch
              checked={theme === 'dark'}
              onChange={toggleTheme}
              checkedChildren="🌙"
              unCheckedChildren="☀️"
            />
          </PreferenceToggle>
        </PreferencesGrid>
      </Card>
    </Container>
  );
};

export default Settings;