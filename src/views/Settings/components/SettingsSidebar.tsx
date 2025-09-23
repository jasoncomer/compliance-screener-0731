import React from 'react';

import { 
  BellOutlined,
  CrownOutlined,
  SecurityScanOutlined,
  SettingOutlined, 
  UserOutlined} from '@ant-design/icons';

import { SettingSection } from '../../../typings/settings';

import { Sidebar, SidebarItem } from './styled';

interface SettingsSidebarProps {
  activeSection: SettingSection;
  onSectionChange: (section: SettingSection) => void;
  theme: 'dark' | 'light';
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
  theme
}) => {
  return (
    <Sidebar theme={{ theme }}>
      <SidebarItem 
        theme={{ theme }} 
        data-active={activeSection === 'profile'}
        onClick={() => onSectionChange('profile')}
      >
        <UserOutlined className="icon" />
        <span>Profile</span>
      </SidebarItem>

      <SidebarItem 
        theme={{ theme }} 
        data-active={activeSection === 'organization'}
        onClick={() => onSectionChange('organization')}
      >
        <SettingOutlined className="icon" />
        <span>Organization</span>
      </SidebarItem>

      <SidebarItem 
        theme={{ theme }} 
        data-active={activeSection === 'subscription'}
        onClick={() => onSectionChange('subscription')}
      >
        <CrownOutlined className="icon" />
        <span>Subscription</span>
      </SidebarItem>

      <SidebarItem 
        theme={{ theme }} 
        data-active={activeSection === 'preferences'}
        onClick={() => onSectionChange('preferences')}
      >
        <SettingOutlined className="icon" />
        <span>Preferences</span>
      </SidebarItem>

      <SidebarItem 
        theme={{ theme }} 
        data-active={activeSection === 'notifications'}
        onClick={() => onSectionChange('notifications')}
      >
        <BellOutlined className="icon" />
        <span>Notifications</span>
      </SidebarItem>

      <SidebarItem 
        theme={{ theme }} 
        data-active={activeSection === 'security'}
        onClick={() => onSectionChange('security')}
      >
        <SecurityScanOutlined className="icon" />
        <span>Security</span>
      </SidebarItem>
    </Sidebar>
  );
};

export default SettingsSidebar; 