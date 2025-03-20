import React, { useState } from 'react';
import { Card, SubTitle, InfoList, InfoItem, Label, Value, Button } from './styled';
import { IUser } from '../../../typings/interfaces';
import { Modal, message, Input, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useAppContext } from '../../../context/AppContext';
import { config } from '../../../config/config';
import { users } from '../../../api/auth';
import { useTheme } from '../../../context/ThemeContext';

const { Text } = Typography;

interface ProfileSectionProps {
  user?: IUser | null;
  enabled?: boolean;
  theme: 'dark' | 'light';
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, enabled = true, theme: themeMode }) => {
  const { setUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const { theme: appTheme } = useTheme();

  const handleDeleteAccount = () => {
    // Use state within modal scope
    let isConfirmed = false;
    
    const modal = Modal.confirm({
      title: 'Delete Account',
      icon: <ExclamationCircleOutlined style={{ color: '#e74c3c' }} />,
      content: (
        <div>
          <Text style={{ display: 'block', marginBottom: '16px', color: appTheme === 'dark' ? '#d9d9d9' : undefined }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Text>
          <Text style={{ display: 'block', marginBottom: '8px', color: appTheme === 'dark' ? '#d9d9d9' : undefined }}>
            Please type <Text strong keyboard style={{ color: appTheme === 'dark' ? '#ffffff' : undefined }}>delete</Text> to confirm:
          </Text>
          <Input
            placeholder="Type 'delete' here" 
            onChange={(e) => {
              isConfirmed = e.target.value === 'delete';
              
              // Get the OK button and update its disabled state
              const okButton = document.querySelector('.ant-modal-confirm-btns .ant-btn-primary') as HTMLButtonElement;
              if (okButton) {
                okButton.disabled = !isConfirmed;
                okButton.style.opacity = isConfirmed ? '1' : '0.5';
                okButton.style.cursor = isConfirmed ? 'pointer' : 'not-allowed';
                
                // Force rerender the modal to update button props
                if (isConfirmed) {
                  modal.update({
                    okButtonProps: {
                      danger: true,
                      disabled: false
                    }
                  });
                } else {
                  modal.update({
                    okButtonProps: {
                      danger: true,
                      disabled: true
                    }
                  });
                }
              }
            }}
          />
        </div>
      ),
      okText: 'Delete My Account',
      okButtonProps: { 
        danger: true,
        disabled: true, // Disabled by default
      },
      cancelText: 'Cancel',
      okCancel: true,
      width: 480,
      className: `custom-modal-${appTheme}`,
      maskClosable: false,
      onOk: async () => {
        if (!isConfirmed || !user || !user._id) {
          return Promise.reject('Please type "delete" to confirm account deletion');
        }
        
        setLoading(true);
        try {
          await users.deleteAccount(user._id);
          
          // Clear local storage
          localStorage.removeItem(config.localstorageKeys.accessToken);
          localStorage.removeItem(config.localstorageKeys.refreshToken);
          localStorage.removeItem(config.localstorageKeys.user);
          
          // Update application state
          setUser(null);
          
          message.success('Your account has been deleted successfully');
          
          // Redirect to login page
          window.location.href = '/login';
          return Promise.resolve();
        } catch (error) {
          console.error('Error deleting account:', error);
          message.error('Failed to delete account. Please try again later.');
          setLoading(false);
          return Promise.reject(error);
        }
      }
    });
  };

  return (
    <Card theme={{ theme: themeMode }}>
      <SubTitle theme={{ theme: themeMode }}>User Information</SubTitle>
      <InfoList>
        <InfoItem theme={{ theme: themeMode }}>
          <Label theme={{ theme: themeMode }}>Name</Label>
          <Value theme={{ theme: themeMode }} className='capitalize'>{user?.name || 'N/A'} {user?.surname || 'N/A'}</Value>
        </InfoItem>
        <InfoItem theme={{ theme: themeMode }}>
          <Label theme={{ theme: themeMode }}>Email</Label>
          <Value theme={{ theme: themeMode }}>{user?.email || 'N/A'}</Value>
        </InfoItem>
        <InfoItem theme={{ theme: themeMode }}>
          <Label theme={{ theme: themeMode }}>Email Verified</Label>
          <Value theme={{ theme: themeMode }}>{user?.isVerified ? 'Yes' : 'No'}</Value>
        </InfoItem>
        <InfoItem theme={{ theme: themeMode }}>
          <Label theme={{ theme: themeMode }}>Account Created</Label>
          <Value theme={{ theme: themeMode }}>
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
      <div style={{ display: 'flex', gap: '8px' }}>
        {enabled && <Button>Edit Profile</Button>}
        {enabled && (
          <Button 
            className="delete-button" 
            onClick={handleDeleteAccount} 
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ProfileSection; 