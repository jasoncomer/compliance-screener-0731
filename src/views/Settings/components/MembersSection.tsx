import React, { useState } from 'react';
import { Table, Button, Tag, Tooltip, Modal, Form, Select, message } from 'antd';
import { UserAddOutlined, CopyOutlined, SettingOutlined } from '@ant-design/icons';
import { Card, SubTitle, InfoList, InfoItem, Label, Value } from './styled';
import { IMember, EMemberRole, IInvitation, IOrganizationMember } from '../../../typings/organization';
import { IUser } from '../../../typings/interfaces';
import Input from '../../../components/common/Input';
import { useAppSelector } from '../../../store/hooks';
import { selectActiveOrgMembers } from '../../../store/slices/organizationsSlice';

interface MembersSectionProps {
  theme: 'dark' | 'light';
  currentUser?: IUser;
  pendingInvitations: IInvitation[];
  onInviteMember?: (email: string, role: EMemberRole) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMemberRole?: (memberId: string, newRole: EMemberRole) => void;
  onGenerateInviteCode?: () => Promise<string>;
  onRevokeInvitation?: (invitationId: string) => void;
}

const MembersSection: React.FC<MembersSectionProps> = ({ 
  theme,
  currentUser,
  pendingInvitations = [],
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
  onGenerateInviteCode,
  onRevokeInvitation
}) => {
  const members = useAppSelector(selectActiveOrgMembers);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [inviteForm] = Form.useForm();
  const [inviteCode, setInviteCode] = useState<string>();
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  console.log(members);

  const handleInvite = async (values: { email: string; role: EMemberRole }) => {
    onInviteMember?.(values.email, values.role);
    setIsInviteModalVisible(false);
    inviteForm.resetFields();
  };

  const handleGenerateInviteCode = async () => {
    if (!onGenerateInviteCode) return;
    
    setIsGeneratingCode(true);
    try {
      const code = await onGenerateInviteCode();
      setInviteCode(code);
    } catch (error) {
      message.error('Failed to generate invite code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      message.success('Invite code copied to clipboard');
    }
  };

  const columns = [
    {
      title: 'Member',
      dataIndex: ['name', 'email'],
      render: (_: string, record: IOrganizationMember) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{record.name || record.email || 'Unknown'}</span>
          {record.status === 'pending' && (
            <Tag color="orange">Pending</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: ['email'],
      render: (_: string, record: IMember) => record.email || 'N/A',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role: EMemberRole, record: IMember) => (
        <Select
          value={role}
          style={{ width: 120 }}
          onChange={(newRole: EMemberRole) => {
            const memberId = record.userId;
            if (memberId) {
              onUpdateMemberRole?.(memberId, newRole);
            }
          }}
          disabled={!record.userId || record.userId === currentUser?._id}
        >
          <Select.Option value="manager">Manager</Select.Option>
          <Select.Option value="team_member">Team Member</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'joinedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: IMember) => (
        <Button 
          danger
          type="link"
          disabled={!record.userId || record.userId === currentUser?._id}
          onClick={() => {
            const memberId = record.userId;
            if (memberId) {
              onRemoveMember?.(memberId);
            }
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  const invitationColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role: EMemberRole) => (
        <Tag color={role === 'manager' ? 'blue' : 'green'}>
          {role === 'manager' ? 'Manager' : 'Team Member'}
        </Tag>
      ),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: IInvitation) => (
        <Button 
          danger
          type="link"
          onClick={() => onRevokeInvitation?.(record.id)}
        >
          Revoke
        </Button>
      ),
    },
  ];

  return (
    <Card theme={{ theme }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <SubTitle theme={{ theme }}>Members</SubTitle>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setIsInviteModalVisible(true)}
          >
            Invite Member
          </Button>
          <Tooltip title="Generate Invite Code">
            <Button
              icon={<SettingOutlined />}
              onClick={handleGenerateInviteCode}
              loading={isGeneratingCode}
            />
          </Tooltip>
        </div>
      </div>

      <InfoList>
        <InfoItem theme={{ theme }}>
          <Label theme={{ theme }}>Active Members</Label>
          <Value theme={{ theme }}>{members.filter(m => m.status === 'active').length} / 5</Value>
        </InfoItem>
        {inviteCode && (
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Invite Code</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Value theme={{ theme }}>{inviteCode}</Value>
              <Button 
                type="text" 
                icon={<CopyOutlined />} 
                onClick={copyInviteCode}
              />
            </div>
          </InfoItem>
        )}
      </InfoList>

      <Table
        dataSource={members}
        columns={columns}
        rowKey={(record) => record.userId || record.email || record.joinedAt}
        style={{ marginTop: '24px' }}
      />

      {pendingInvitations.length > 0 && (
        <>
          <SubTitle theme={{ theme }} style={{ marginTop: '32px' }}>Pending Invitations</SubTitle>
          <Table
            dataSource={pendingInvitations}
            columns={invitationColumns}
            rowKey="id"
          />
        </>
      )}

      <Modal
        title="Invite Team Member"
        open={isInviteModalVisible}
        onCancel={() => {
          setIsInviteModalVisible(false);
          inviteForm.resetFields();
        }}
        onOk={() => inviteForm.submit()}
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleInvite}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter an email address' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            initialValue="team_member"
          >
            <Select>
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="team_member">Team Member</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default MembersSection; 