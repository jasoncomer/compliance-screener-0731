import React from 'react';

import { Card, InfoItem, InfoList, Label, SubTitle, Value } from './styled';

interface NotificationsSectionProps {
  theme: 'dark' | 'light';
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({ theme }) => {
  return (
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
};

export default NotificationsSection; 