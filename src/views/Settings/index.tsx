import { useState } from 'react';
import { Switch } from 'antd';
import { 
  SettingOutlined, 
  UserOutlined, 
  TeamOutlined, 
  BellOutlined,
  SecurityScanOutlined 
} from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import ViewWrapper from '../../components/ViewWrapper';
import ProfileSection from './components/ProfileSection';
import MembersSection from './components/MembersSection';
import OrganizationSection from './components/OrganizationSection';
import { IMember, IInvitation, IOrganization } from '../../typings/organization';
import {
  SettingsLayout,
  Sidebar,
  SidebarItem,
  ContentArea,
  Card,
  SubTitle,
  InfoList,
  InfoItem,
  Label,
  Value,
  PreferencesGrid,
  PreferenceToggle
} from './components/styled';

// ... keep existing styled components ...

type SettingSection = 'profile' | 'preferences' | 'members' | 'notifications' | 'security' | 'organization';

const Settings = () => {
  const { theme } = useTheme();
  const { user } = useAppContext();
  const [organization, setOrganization] = useState<IOrganization>();
  const [members, setMembers] = useState<IMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<IInvitation[]>([]);
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');

  // These handlers will be implemented when we add the API
  const handleInviteMember = async (email: string, role: 'manager' | 'team_member') => {
    // TODO: Implement with API
    console.log('Invite member:', email, role);
  };

  const handleRemoveMember = async (memberId: string) => {
    // TODO: Implement with API
    console.log('Remove member:', memberId);
    if (!organization) return;
    setMembers(prev => prev.filter(member => member._id !== memberId));
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'manager' | 'team_member') => {
    // TODO: Implement with API
    console.log('Update member role:', memberId, newRole);
    if (!organization) return;
  };

  const handleGenerateInviteCode = async () => {
    // TODO: Implement with API
    return 'MOCK-INVITE-CODE';
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    // TODO: Implement with API
    console.log('Revoke invitation:', invitationId);
    if (!organization) return;
    setPendingInvitations(prev => prev.filter(invitation => invitation.id !== invitationId));
  };

  const handleUpdateOrganization = async (data: Partial<IOrganization>) => {
    // TODO: Implement with API
    console.log('Update organization:', data);
    if (!organization) return;
    setOrganization({ ...organization, ...data });
  };

  const renderPreferencesSection = () => (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>Preferences</SubTitle>
      <PreferencesGrid>
        <PreferenceToggle theme={{ theme }}>
          <Label theme={{ theme }} style={{ margin: 0 }}>Email Notifications</Label>
          <Switch
            checked={true}
            onChange={() => {}}
          />
        </PreferenceToggle>
        <PreferenceToggle theme={{ theme }}>
          <Label theme={{ theme }} style={{ margin: 0 }}>Dark Mode</Label>
          <Switch
            checked={theme === 'dark'}
            onChange={() => {}}
            checkedChildren="🌙"
            unCheckedChildren="☀️"
          />
        </PreferenceToggle>
      </PreferencesGrid>
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
        return <ProfileSection user={user || undefined} enabled theme={theme} />;
      case 'preferences':
        return renderPreferencesSection();
      case 'members':
        return (
          <MembersSection
            theme={theme}
            currentUser={user || undefined}
            members={members}
            pendingInvitations={pendingInvitations}
            onInviteMember={handleInviteMember}
            onRemoveMember={handleRemoveMember}
            onUpdateMemberRole={handleUpdateMemberRole}
            onGenerateInviteCode={handleGenerateInviteCode}
            onRevokeInvitation={handleRevokeInvitation}
          />
        );
      case 'notifications':
        return renderNotificationsSection();
      case 'security':
        return renderSecuritySection();
      case 'organization':
        return (
          <OrganizationSection
            theme={theme}
            organization={organization}
            onUpdateOrganization={handleUpdateOrganization}
          />
        );
      default:
        return <ProfileSection user={user || undefined} enabled theme={theme} />;
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
          <SidebarItem 
            theme={{ theme }} 
            active={activeSection === 'organization'}
            onClick={() => setActiveSection('organization')}
          >
            <SettingOutlined className="icon" />
            <span>Organization</span>
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