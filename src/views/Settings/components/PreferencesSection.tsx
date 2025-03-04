import React from 'react';
import { Switch } from 'antd';
import { Card, SubTitle, PreferencesGrid, PreferenceToggle, Label } from './styled';

interface PreferencesSectionProps {
  theme: 'dark' | 'light';
  notifications: boolean;
  onNotificationsChange: (checked: boolean) => void;
  onThemeChange: () => void;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  theme,
  notifications,
  onNotificationsChange,
  onThemeChange
}) => {
  return (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>Preferences</SubTitle>
      <PreferencesGrid>
        <PreferenceToggle theme={{ theme }}>
          <Label theme={{ theme }} style={{ margin: 0 }}>Email Notifications</Label>
          <Switch
            checked={notifications}
            onChange={onNotificationsChange}
          />
        </PreferenceToggle>
        <PreferenceToggle theme={{ theme }}>
          <Label theme={{ theme }} style={{ margin: 0 }}>Dark Mode</Label>
          <Switch
            checked={theme === 'dark'}
            onChange={onThemeChange}
            checkedChildren="🌙"
            unCheckedChildren="☀️"
          />
        </PreferenceToggle>
      </PreferencesGrid>
    </Card>
  );
};

export default PreferencesSection; 