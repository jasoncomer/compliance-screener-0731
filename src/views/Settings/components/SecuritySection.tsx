import React from 'react';
import { Card, SubTitle, InfoList, InfoItem, Label, Value } from './styled';

interface SecuritySectionProps {
  theme: 'dark' | 'light';
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ theme }) => {
  return (
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
};

export default SecuritySection; 