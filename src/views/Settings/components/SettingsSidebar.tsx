import React from 'react';
import { 
  SettingOutlined, 
  UserOutlined, 
  BellOutlined,
  SecurityScanOutlined 
} from '@ant-design/icons';
import { Sidebar, SidebarItem } from './styled';
import { SettingSection } from '../../../typings/settings';

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
        active={activeSection === 'profile'}
        onClick={() => onSectionChange('profile')}
      >
        <UserOutlined className="icon" />
        <span>Profile</span>
      </SidebarItem>
      <SidebarItem 
        theme={{ theme }} 
        active={activeSection === 'preferences'}
        onClick={() => onSectionChange('preferences')}
      >
        <SettingOutlined className="icon" />
        <span>Preferences</span>
      </SidebarItem>
      <SidebarItem 
        theme={{ theme }} 
        active={activeSection === 'notifications'}
        onClick={() => onSectionChange('notifications')}
      >
        <BellOutlined className="icon" />
        <span>Notifications</span>
      </SidebarItem>
      <SidebarItem 
        theme={{ theme }} 
        active={activeSection === 'security'}
        onClick={() => onSectionChange('security')}
      >
        <SecurityScanOutlined className="icon" />
        <span>Security</span>
      </SidebarItem>
      <SidebarItem 
        theme={{ theme }} 
        active={activeSection === 'organization'}
        onClick={() => onSectionChange('organization')}
      >
        <SettingOutlined className="icon" />
        <span>Organization</span>
      </SidebarItem>
    </Sidebar>
  );
};

export default SettingsSidebar; 