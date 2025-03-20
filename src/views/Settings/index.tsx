import { useState, useEffect } from 'react';
import { Switch, message } from 'antd';
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
import { IMember, IInvitation, IOrganization, IOrganizationMember } from '../../typings/organization';
import { api } from '../../api/api';
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
  const [/*loading*/, setLoading] = useState(false);

  useEffect(() => {
    // Load organization data when component mounts
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      // Fetch organizations where user is a member
      const orgsResponse = await api.organizations.list();
      if (orgsResponse.data && orgsResponse.data.length > 0) {
        // Use the first organization for now
        const org = orgsResponse.data[0];
        setOrganization(org);
        
        // Fetch members of that organization
        const membersResponse = await api.organizations.listMembers(org._id);
        if (membersResponse.data) {
          // Convert to IMember format
          const membersList = membersResponse.data.map((member: IOrganizationMember) => ({
            _id: member._id,
            user: {
              _id: member.userId,
              email: member.email,
              name: '',  // Required by IUser
              surname: '',  // Required by IUser
              password: '',  // Required by IUser
              plan: 'free',  // Required by IUser
              isVerified: true,  // Required by IUser
              isDeleted: false,  // Required by IUser
              status: 'active',  // Required by IUser
            },
            email: member.email,
            role: member.role,
            status: member.status,
            joinedAt: member.createdAt,
            invitedBy: member.invitedBy
          })) as IMember[];
          setMembers(membersList);
        }
        
        // TODO: Fetch pending invitations when API endpoint is available
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
      message.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (email: string, role: 'manager' | 'team_member') => {
    if (!organization) {
      message.error('No active organization');
      return;
    }
    
    try {
      setLoading(true);
      await api.organizations.invite(organization._id, {
        emails: [email],
        role: role
      });
      
      message.success(`Invitation sent to ${email}`);
      
      // Refresh the pending invitations list
      // TODO: When API endpoint for fetching invitations is available
    } catch (error) {
      console.error('Error inviting member:', error);
      message.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization) return;
    
    try {
      setLoading(true);
      await api.organizations.removeMember(organization._id, memberId);
      
      setMembers(prev => prev.filter(member => member._id !== memberId));
      message.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      message.error('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'manager' | 'team_member') => {
    if (!organization) return;
    
    try {
      setLoading(true);
      await api.organizations.updateMemberRole(organization._id, memberId, newRole);
      
      setMembers(prev => 
        prev.map(member => 
          member._id === memberId ? { ...member, role: newRole } : member
        )
      );
      message.success('Member role updated successfully');
    } catch (error) {
      console.error('Error updating member role:', error);
      message.error('Failed to update member role');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    // This API endpoint doesn't exist yet, should be added
    try {
      // For now, generate a mock code
      return 'MOCK-INVITE-CODE';
      
      // When API is available:
      // const response = await api.organizations.generateInviteCode(organization._id);
      // return response.data.code;
    } catch (error) {
      console.error('Error generating invite code:', error);
      message.error('Failed to generate invite code');
      throw error;
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    // This API endpoint doesn't exist yet, should be added
    if (!organization) return;
    
    try {
      // When API is available:
      // await api.organizations.revokeInvitation(organization._id, invitationId);
      
      setPendingInvitations(prev => prev.filter(invitation => invitation.id !== invitationId));
      message.success('Invitation revoked successfully');
    } catch (error) {
      console.error('Error revoking invitation:', error);
      message.error('Failed to revoke invitation');
    }
  };

  const handleUpdateOrganization = async (data: Partial<IOrganization>) => {
    if (!organization) return;
    
    try {
      setLoading(true);
      const response = await api.organizations.update(organization._id, data);
      
      if (response.data) {
        setOrganization(response.data);
        message.success('Organization updated successfully');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      message.error('Failed to update organization');
    } finally {
      setLoading(false);
    }
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