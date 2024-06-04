import React from 'react';

interface SettingsProps {
  userSettings?: {
    name: string;
    email: string;
    notifications: boolean;
  };
}

const Settings: React.FC<SettingsProps> = ({ userSettings }) => {

  if (!userSettings) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>User Settings</h2>
      <p>Name: {userSettings.name}</p>
      <p>Email: {userSettings.email}</p>
      <p>Notifications: {userSettings.notifications ? 'Enabled' : 'Disabled'}</p>
    </div>
  );
};

export default Settings;