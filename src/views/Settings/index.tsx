import { useState, useEffect } from 'react';
import { message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useDispatch } from 'react-redux';
import ViewWrapper from '../../components/ViewWrapper';
import ProfileSection from './components/ProfileSection';
import PreferencesSection from './components/PreferencesSection';
import NotificationsSection from './components/NotificationsSection';
import SecuritySection from './components/SecuritySection';
import OrganizationSection from './components/OrganizationSection';
import SettingsSidebar from './components/SettingsSidebar';
import { IMember, IInvitation, IOrganization, IOrganizationMember } from '../../typings/organization';
import { SettingSection } from '../../typings/settings';
import { api } from '../../api/api';
import { SettingsLayout, ContentArea } from './components/styled';
import { setOrganization } from '../../store/slices/organizationSlice';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAppContext();
  const dispatch = useDispatch();
  const [members, setMembers] = useState<IMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<IInvitation[]>([]);
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [_, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
        dispatch(setOrganization(org));
        
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
    try {
      setLoading(true);
      const orgsResponse = await api.organizations.list();
      if (orgsResponse.data && orgsResponse.data.length > 0) {
        const org = orgsResponse.data[0];
        await api.organizations.invite(org._id, {
          emails: [email],
          role: role
        });
        
        message.success(`Invitation sent to ${email}`);
        
        // Refresh the pending invitations list
        // TODO: When API endpoint for fetching invitations is available
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      message.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setLoading(true);
      const orgsResponse = await api.organizations.list();
      if (orgsResponse.data && orgsResponse.data.length > 0) {
        const org = orgsResponse.data[0];
        await api.organizations.removeMember(org._id, memberId);
        
        setMembers(prev => prev.filter(member => member._id !== memberId));
        message.success('Member removed successfully');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      message.error('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'manager' | 'team_member') => {
    try {
      setLoading(true);
      const orgsResponse = await api.organizations.list();
      if (orgsResponse.data && orgsResponse.data.length > 0) {
        const org = orgsResponse.data[0];
        await api.organizations.updateMemberRole(org._id, memberId, newRole);
        
        setMembers(prev => 
          prev.map(member => 
            member._id === memberId ? { ...member, role: newRole } : member
          )
        );
        message.success('Member role updated successfully');
      }
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
    try {
      setLoading(true);
      const orgsResponse = await api.organizations.list();
      if (orgsResponse.data && orgsResponse.data.length > 0) {
        // const org = orgsResponse.data[0];
        // When API is available:
        // await api.organizations.revokeInvitation(org._id, invitationId);
        
        setPendingInvitations(prev => prev.filter(invitation => invitation.id !== invitationId));
        message.success('Invitation revoked successfully');
      }
    } catch (error) {
      console.error('Error revoking invitation:', error);
      message.error('Failed to revoke invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrganization = async (data: Partial<IOrganization>) => {
    try {
      setLoading(true);
      const orgsResponse = await api.organizations.list();
      if (orgsResponse.data && orgsResponse.data.length > 0) {
        const org = orgsResponse.data[0];
        const response = await api.organizations.update(org._id, data);
        
        if (response.data) {
          dispatch(setOrganization(response.data));
          message.success('Organization updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      message.error('Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsChange = (checked: boolean) => {
    setNotificationsEnabled(checked);
    // TODO: Implement API call to update notifications preference
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection user={user || undefined} enabled theme={theme} />;
      case 'preferences':
        return (
          <PreferencesSection 
            theme={theme} 
            notifications={notificationsEnabled}
            onNotificationsChange={handleNotificationsChange}
            onThemeChange={toggleTheme}
          />
        );
      case 'notifications':
        return <NotificationsSection theme={theme} />;
      case 'security':
        return <SecuritySection theme={theme} />;
      case 'organization':
        return (
          <OrganizationSection
            theme={theme}
            currentUser={user || undefined}
            members={members}
            pendingInvitations={pendingInvitations}
            onUpdateOrganization={handleUpdateOrganization}
            onInviteMember={handleInviteMember}
            onRemoveMember={handleRemoveMember}
            onUpdateMemberRole={handleUpdateMemberRole}
            onGenerateInviteCode={handleGenerateInviteCode}
            onRevokeInvitation={handleRevokeInvitation}
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
        <SettingsSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          theme={theme}
        />
        <ContentArea>
          {renderContent()}
        </ContentArea>
      </SettingsLayout>
    </ViewWrapper>
  );
};

export default Settings; 