import React, { useState, useEffect } from 'react';
import { Form, Button, message, Table, Tag, Modal } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { Card as StyledCard, SubTitle, InfoList, InfoItem, Label, Value } from './styled';
import { IUser } from '../../../typings/interfaces';
import { IInvitation, EMemberRole } from '../../../typings/organization';
import Input from '../../../components/common/Input';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { getUserPendingInvitations, respondToInvitation, selectPendingInvitations } from '../../../store/slices/organizationsSlice';

interface ProfileSectionProps {
  user?: IUser;
  enabled: boolean;
  theme: 'dark' | 'light';
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, theme }) => {
  const dispatch = useAppDispatch();
  const pendingInvitations = useAppSelector(selectPendingInvitations);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    // Fetch user's pending invitations when component mounts
    dispatch(getUserPendingInvitations());
  }, [dispatch]);

  const handleSubmit = async (values: Partial<IUser>) => {
    try {
      // TODO: Implement profile update API call
      console.log('Profile update values:', values);
      message.success('Profile updated successfully');
      setIsEditModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    }
  };

  const handleRespondToInvitation = async (invitationId: string, organizationId: string, action: 'accept' | 'reject') => {
    try {
      await dispatch(respondToInvitation({ invitationId, organizationId, action })).unwrap();
      message.success(`Invitation ${action}ed successfully`);
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      message.error(`Failed to ${action} invitation`);
    }
  };

  const invitationColumns = [
    {
      title: 'Organization',
      dataIndex: 'organizationName',
      key: 'organizationName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: EMemberRole) => (
        <Tag color={role === 'manager' ? 'blue' : 'green'}>
          {role === 'manager' ? 'Manager' : 'Team Member'}
        </Tag>
      ),
    },
    {
      title: 'Invited By',
      dataIndex: 'invitedBy',
      key: 'invitedBy',
      render: (invitedBy: string) => invitedBy || 'Unknown',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: IInvitation) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            size="small"
            onClick={() => handleRespondToInvitation(record.id, record.organizationId, 'accept')}
          >
            Accept
          </Button>
          <Button
            danger
            size="small"
            onClick={() => handleRespondToInvitation(record.id, record.organizationId, 'reject')}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <StyledCard theme={{ theme }}>
        <SubTitle theme={{ theme }}>Profile Information</SubTitle>
        <InfoList>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Name</Label>
            <Value theme={{ theme }}>{user?.name || 'Not set'}</Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Surname</Label>
            <Value theme={{ theme }}>{user?.surname || 'Not set'}</Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Email</Label>
            <Value theme={{ theme }}>{user?.email || 'Not set'}</Value>
          </InfoItem>
        </InfoList>
        <Button
          type="primary"
          icon={<UserOutlined />}
          onClick={() => setIsEditModalVisible(true)}
          style={{ marginTop: '16px' }}
        >
          Edit Profile
        </Button>
      </StyledCard>

      {pendingInvitations.length > 0 && (
        <StyledCard theme={{ theme }}>
          <SubTitle theme={{ theme }}>
            <MailOutlined style={{ marginRight: '8px' }} />
            Pending Invitations
          </SubTitle>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            You have been invited to join the following organizations. Accept or reject these invitations.
          </p>
          <Table
            dataSource={pendingInvitations}
            columns={invitationColumns}
            rowKey="id"
            pagination={false}
          />
        </StyledCard>
      )}

      <Modal
        title="Edit Profile"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: user?.name,
            surname: user?.surname,
            email: user?.email,
          }}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: 'Please enter your name' },
              { min: 2, message: 'Name must be at least 2 characters' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="surname"
            label="Surname"
            rules={[
              { required: true, message: 'Please enter your surname' },
              { min: 2, message: 'Surname must be at least 2 characters' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfileSection; 