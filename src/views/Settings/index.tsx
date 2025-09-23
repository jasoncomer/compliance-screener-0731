import { useEffect,useState } from 'react';

import { SettingOutlined } from '@ant-design/icons';
import { message } from 'antd';

import ViewWrapper from '../../components/ViewWrapper';
import { useAppContext } from '../../context/AppContext';
import { useAutosave } from '../../context/AutosaveContext';
import { useTheme } from '../../context/ThemeContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchOrganizations,
  inviteMember,
  removeMember,
  revokeInvitationAsync,
  selectCurrentOrganization,
  updateOrganization,
} from '../../store/slices/organizationsSlice';
import { EMemberRole, IOrganization } from '../../typings/organization';
import { SettingSection } from '../../typings/settings';

import NotificationsSection from './components/NotificationsSection';
import OrganizationSection from './components/OrganizationSection';
import PreferencesSection from './components/PreferencesSection';
import ProfileSection from './components/ProfileSection';
import SecuritySection from './components/SecuritySection';
import SettingsSidebar from './components/SettingsSidebar';
import { ContentArea,SettingsLayout } from './components/styled';
import SubscriptionSection from './components/SubscriptionSection';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAppContext();
  const { autosaveInterval, setAutosaveInterval, isAutosaveEnabled, setIsAutosaveEnabled } = useAutosave();
  const dispatch = useAppDispatch();
  const organization = useAppSelector(selectCurrentOrganization);

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
    if (!organization) return;

    try {
      // Call the async thunk which handles the API call and state update
      await dispatch(revokeInvitationAsync({ 
        organizationId: organization._id, 
        invitationId 
      })).unwrap();
      
      // Refresh organization data to reflect the changes
      await dispatch(fetchOrganizations());
      
      message.success('Invitation revoked successfully');
    } catch (error) {
      console.error('Error revoking invitation:', error);
      message.error('Failed to revoke invitation');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization) return;

    try {
      await dispatch(removeMember({
        organizationId: organization._id,
        memberId
      })).unwrap();

      await dispatch(fetchOrganizations());
      message.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      message.error('Failed to remove member');
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
            autosaveInterval={autosaveInterval}
            onAutosaveIntervalChange={setAutosaveInterval}
            isAutosaveEnabled={isAutosaveEnabled}
            onAutosaveEnabledChange={setIsAutosaveEnabled}
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
            onInviteMember={handleInviteMember}
            onRevokeInvitation={handleRevokeInvitation}
            onUpdateOrganization={handleUpdateOrganization}
            onRemoveMember={handleRemoveMember}
          />
        );
      case 'subscription':
        return <SubscriptionSection theme={theme} />;
      default:
        return <ProfileSection user={user || undefined} enabled theme={theme} />;
    }
  };

  // Only use full width for subscription section
  const isFullWidth = activeSection === 'subscription';

  return (
    <ViewWrapper
      icon={<SettingOutlined />}
      title="Settings"
      fullWidth={true}
    >
      <SettingsLayout className={isFullWidth ? 'full-width-layout' : ''}>
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          theme={theme}
        />
        <ContentArea className={isFullWidth ? 'full-width-content' : ''}>
          {renderContent()}
        </ContentArea>
      </SettingsLayout>
    </ViewWrapper>
  );
};

export default Settings;
