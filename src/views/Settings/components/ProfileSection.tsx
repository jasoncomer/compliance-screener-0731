import React from 'react';
import { Card, SubTitle, InfoList, InfoItem, Label, Value, Button } from './styled';
import { IUser } from '../../../typings/interfaces';

interface ProfileSectionProps {
  user?: IUser | null;
  enabled?: boolean;
  theme: 'dark' | 'light';
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, enabled = true, theme }) => {
  return (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>User Information</SubTitle>
      <InfoList>
        <InfoItem theme={{ theme }}>
          <Label theme={{ theme }}>Name</Label>
          <Value theme={{ theme }} className='capitalize'>{user?.name || 'N/A'} {user?.surname || 'N/A'}</Value>
        </InfoItem>
        <InfoItem theme={{ theme }}>
          <Label theme={{ theme }}>Email</Label>
          <Value theme={{ theme }}>{user?.email || 'N/A'}</Value>
        </InfoItem>
        <InfoItem theme={{ theme }}>
          <Label theme={{ theme }}>Email Verified</Label>
          <Value theme={{ theme }}>{user?.isVerified ? 'Yes' : 'No'}</Value>
        </InfoItem>
        <InfoItem theme={{ theme }}>
          <Label theme={{ theme }}>Account Created</Label>
          <Value theme={{ theme }}>
            {user?.createdAt 
              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : 'N/A'}
          </Value>
        </InfoItem>
      </InfoList>
      {enabled && <Button>Edit Profile</Button>}
    </Card>
  );
};

export default ProfileSection; 