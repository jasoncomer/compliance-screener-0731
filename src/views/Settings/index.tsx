import { useState, useEffect } from 'react';
import { message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchOrganizations,
  inviteMember,
  revokeInvitation,
  selectCurrentOrganization,
  selectPendingInvitations,
  updateOrganization,
} from '../../store/slices/organizationsSlice';
import ViewWrapper from '../../components/ViewWrapper';
import ProfileSection from './components/ProfileSection';
import PreferencesSection from './components/PreferencesSection';
import NotificationsSection from './components/NotificationsSection';
import SecuritySection from './components/SecuritySection';
import OrganizationSection from './components/OrganizationSection';
import SettingsSidebar from './components/SettingsSidebar';
import { SettingSection } from '../../typings/settings';
import { EMemberRole, IOrganization } from '../../typings/organization';
import { SettingsLayout, ContentArea } from './components/styled';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAppContext();
  const dispatch = useAppDispatch();
  const organization = useAppSelector(selectCurrentOrganization);
  const pendingInvitations = useAppSelector(selectPendingInvitations);
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    dispatch(fetchOrganizations());
  }, [dispatch]);

  const handleInviteMember = async (email: string, role: EMemberRole) => {
    if (!organization) {
      message.error('No active organization');
      return;
    }

    try {
      await dispatch(inviteMember({
        organizationId: organization._id,
        email,
        role
      })).unwrap();
      message.success(`Invitation sent to ${email}`);
    } catch (error) {
      console.error('Error inviting member:', error);
      message.error('Failed to send invitation');
    }
  };

  // const handleGenerateInviteCode = async () => {
  //   // This API endpoint doesn't exist yet, should be added
  //   try {
  //     // For now, generate a mock code
  //     return 'MOCK-INVITE-CODE';

  //     // When API is available:
  //     // const response = await api.organizations.generateInviteCode(organization._id);
  //     // return response.data.code;
  //   } catch (error) {
  //     console.error('Error generating invite code:', error);
  //     message.error('Failed to generate invite code');
  //     throw error;
  //   }
  // };

  const handleRevokeInvitation = async (invitationId: string) => {
    // This API endpoint doesn't exist yet, should be added
    if (!organization) return;

    try {
      // When API is available:
      // await api.organizations.revokeInvitation(organization._id, invitationId);

      dispatch(revokeInvitation(invitationId));
      message.success('Invitation revoked successfully');
    } catch (error) {
      console.error('Error revoking invitation:', error);
      message.error('Failed to revoke invitation');
    }
  };

  const handleNotificationsChange = (checked: boolean) => {
    setNotificationsEnabled(checked);
    // TODO: Implement API call to update notifications preference
  };

  const handleUpdateOrganization = async (data: Partial<IOrganization>) => {
    if (!organization) {
      message.error('No active organization');
      return;
    }

    try {
      await dispatch(updateOrganization({
        organizationId: organization._id,
        data
      })).unwrap();
      message.success('Organization settings updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      message.error('Failed to update organization settings');
    }
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
            pendingInvitations={pendingInvitations}
            onInviteMember={handleInviteMember}
            onRevokeInvitation={handleRevokeInvitation}
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
