import React, { useState } from 'react';
import styled from 'styled-components';
import { Switch } from 'antd';
import { 
  SettingOutlined, 
  UserOutlined, 
  TeamOutlined, 
  BellOutlined,
  SecurityScanOutlined 
} from '@ant-design/icons';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import ViewWrapper from '../components/ViewWrapper';

const SettingsLayout = styled.div`
  display: flex;
  gap: 2rem;
  width: 100%;
  min-height: calc(100vh - 200px);
`;

const Sidebar = styled.div`
  width: 250px;
  flex-shrink: 0;
  background: ${props => props.theme.theme === 'dark' ? '#1f1f1f' : 'white'};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px ${props => props.theme.theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
`;

const SidebarItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.active 
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
    color: ${props => props.active
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
    color: ${props => props.active
      ? props.theme.theme === 'dark'
        ? '#ffffff'
        : '#2c3e50'
      : props.theme.theme === 'dark'
        ? '#a0a0a0'
        : '#7f8c8d'
    };
  }
`;

const ContentArea = styled.div`
  flex: 1;
  max-width: 800px;
`;

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background-color: transparent;
  padding: 0 1rem;
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2em;
  width: 100%;
`;

const Card = styled.div`
  padding: 2em;
  background: ${props => props.theme.theme === 'dark' ? '#1f1f1f' : 'white'};
  border-radius: 12px;
  box-shadow: 0 4px 6px ${props => props.theme.theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  margin-bottom: 0;
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

type SettingSection = 'profile' | 'preferences' | 'members' | 'notifications' | 'security';

const Settings: React.FC = () => {
  const { user } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const enabled = true;

  const renderProfileSection = () => (
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
  );

  const renderPreferencesSection = () => (
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
  );

  const renderMembersSection = () => (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>Members</SubTitle>
      <InfoList>
        <InfoItem theme={{ theme }}>
          <Label theme={{ theme }}>Coming Soon</Label>
          <Value theme={{ theme }}>Members management will be available soon.</Value>
        </InfoItem>
      </InfoList>
    </Card>
  );

  const renderNotificationsSection = () => (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>Notifications</SubTitle>
      <InfoList>
        <InfoItem theme={{ theme }}>
          <Label theme={{ theme }}>Coming Soon</Label>
          <Value theme={{ theme }}>Detailed notification settings will be available soon.</Value>
        </InfoItem>
      </InfoList>
    </Card>
  );

  const renderSecuritySection = () => (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>Security</SubTitle>
      <InfoList>
        <InfoItem theme={{ theme }}>
          <Label theme={{ theme }}>Coming Soon</Label>
          <Value theme={{ theme }}>Security settings will be available soon.</Value>
        </InfoItem>
      </InfoList>
    </Card>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'preferences':
        return renderPreferencesSection();
      case 'members':
        return renderMembersSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'security':
        return renderSecuritySection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <ViewWrapper
      icon={<SettingOutlined />}
      title="Settings"
    >
      <SettingsLayout>
        <Sidebar theme={{ theme }}>
          <SidebarItem 
            theme={{ theme }} 
            active={activeSection === 'profile'}
            onClick={() => setActiveSection('profile')}
          >
            <UserOutlined className="icon" />
            <span>Profile</span>
          </SidebarItem>
          <SidebarItem 
            theme={{ theme }} 
            active={activeSection === 'preferences'}
            onClick={() => setActiveSection('preferences')}
          >
            <SettingOutlined className="icon" />
            <span>Preferences</span>
          </SidebarItem>
          <SidebarItem 
            theme={{ theme }} 
            active={activeSection === 'members'}
            onClick={() => setActiveSection('members')}
          >
            <TeamOutlined className="icon" />
            <span>Members</span>
          </SidebarItem>
          <SidebarItem 
            theme={{ theme }} 
            active={activeSection === 'notifications'}
            onClick={() => setActiveSection('notifications')}
          >
            <BellOutlined className="icon" />
            <span>Notifications</span>
          </SidebarItem>
          <SidebarItem 
            theme={{ theme }} 
            active={activeSection === 'security'}
            onClick={() => setActiveSection('security')}
          >
            <SecurityScanOutlined className="icon" />
            <span>Security</span>
          </SidebarItem>
        </Sidebar>
        <ContentArea>
          {renderContent()}
        </ContentArea>
      </SettingsLayout>
    </ViewWrapper>
  );
};

export default Settings;