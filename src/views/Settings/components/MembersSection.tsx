import React, { useState } from 'react';
import { Form, Button, message, Table, Modal, Select, Tag, Input, Tooltip } from 'antd';
import { UserAddOutlined, CopyOutlined, SettingOutlined } from '@ant-design/icons';
import { IMember, EMemberRole, IInvitation, IOrganizationMember } from '../../../typings/organization';
import { IUser } from '../../../typings/interfaces';
import { IOrganization } from '../../../typings/organization';
import { useAppSelector } from '../../../store/hooks';
import { selectActiveOrgMembers, selectActiveOrgPendingInvitations, selectCurrentOrganization } from '../../../store/slices/organizationsSlice';
import { Card, SubTitle, InfoList, InfoItem, Label, Value } from './styled';

// Helper function to get current user's role and permissions
const getUserRoleAndPermissions = (
  organization: IOrganization | null,
  currentUser: IUser | undefined,
  members: IOrganizationMember[]
): { role: EMemberRole | null; isOwner: boolean; isAdmin: boolean; isManager: boolean; canChangeRoles: boolean } => {
  if (!organization || !currentUser) {
    return { role: null, isOwner: false, isAdmin: false, isManager: false, canChangeRoles: false };
  }

  const isOwner = organization.ownerId === currentUser._id;
  const currentMember = members.find(m => m.userId === currentUser._id);
  const role = currentMember?.role || null;
  const isAdmin = role === EMemberRole.ADMIN;
  const isManager = role === EMemberRole.MANAGER;
  const canChangeRoles = isOwner || isAdmin || isManager;

  return { role, isOwner, isAdmin, isManager, canChangeRoles };
};

// Helper function to check if user can change a specific member's role
const canChangeMemberRole = (
  targetMember: IMember,
  isOwner: boolean,
  isAdmin: boolean,
  isManager: boolean
): boolean => {
  // Owner can change any role except their own
  if (isOwner) return true;
  
  // Admin can change any role except owner's
  if (isAdmin) return true;
  
  // Manager can only change team_member roles, not admin roles
  if (isManager) {
    return targetMember.role !== EMemberRole.ADMIN;
  }
  
  return false;
};

// Helper function to get available role options for a member
const getAvailableRoleOptions = (
  isOwner: boolean,
  isAdmin: boolean,
  isManager: boolean
): EMemberRole[] => {
  const allRoles = [EMemberRole.MANAGER, EMemberRole.TEAM_MEMBER, EMemberRole.ADMIN];
  
  // Owner can assign any role
  if (isOwner) return allRoles;
  
  // Admin can assign any role
  if (isAdmin) return allRoles;
  
  // Manager can only assign manager and team_member roles
  if (isManager) {
    return [EMemberRole.MANAGER, EMemberRole.TEAM_MEMBER];
  }
  
  return [];
};

// Helper function to check if user can remove a specific member
const canRemoveMember = (
  targetMember: IMember,
  isOwner: boolean,
  isAdmin: boolean,
  isManager: boolean,
  currentUserId?: string
): boolean => {
  // Cannot remove yourself
  if (currentUserId && targetMember.userId === currentUserId) {
    return false;
  }
  
  // Owner can remove any member except themselves
  if (isOwner) return true;
  
  // Admin can remove any member except owner
  if (isAdmin) return true;
  
  // Manager can only remove team members, not admins or other managers
  if (isManager) {
    return targetMember.role === EMemberRole.TEAM_MEMBER;
  }
  
  return false;
};

interface MembersSectionProps {
  theme: 'dark' | 'light';
  currentUser?: IUser;
  onInviteMember?: (email: string, role: EMemberRole) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMemberRole?: (memberId: string, newRole: EMemberRole) => void;
  onGenerateInviteCode?: () => Promise<string>;
  onRevokeInvitation?: (invitationId: string) => void;
}

const MembersSection: React.FC<MembersSectionProps> = ({ 
  theme,
  currentUser,
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
  onGenerateInviteCode,
  onRevokeInvitation
}) => {
  const members = useAppSelector(selectActiveOrgMembers);
  const pendingInvitations = useAppSelector(selectActiveOrgPendingInvitations);
  const organization = useAppSelector(selectCurrentOrganization);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [inviteForm] = Form.useForm();
  const [inviteCode, setInviteCode] = useState<string>();
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Get current user's role and permissions
  const { isOwner, isAdmin, isManager } = getUserRoleAndPermissions(organization, currentUser, members);

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
      render: (role: EMemberRole, record: IMember) => {
        // Check if current user can change this member's role
        const canChange = canChangeMemberRole(record, isOwner, isAdmin, isManager);
        const availableRoles = getAvailableRoleOptions(isOwner, isAdmin, isManager);
        
        return (
          <Select
            value={role}
            style={{ width: 120 }}
            onChange={(newRole: EMemberRole) => {
              const memberId = record.userId;
              if (memberId) {
                onUpdateMemberRole?.(memberId, newRole);
              }
            }}
            disabled={!record.userId || record.userId === currentUser?._id || !canChange}
          >
            {availableRoles.includes(EMemberRole.MANAGER) && (
              <Select.Option value="manager">Manager</Select.Option>
            )}
            {availableRoles.includes(EMemberRole.TEAM_MEMBER) && (
              <Select.Option value="team_member">Team Member</Select.Option>
            )}
            {availableRoles.includes(EMemberRole.ADMIN) && (
              <Select.Option value="admin">Admin</Select.Option>
            )}
          </Select>
        );
      },
    },
    {
      title: 'Joined',
      dataIndex: 'joinedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
              render: (_: any, record: IMember) => {
          const canRemove = canRemoveMember(record, isOwner, isAdmin, isManager, currentUser?._id);
          
          return (
            <Button 
              danger
              type="link"
              disabled={!record.userId || record.userId === currentUser?._id || !canRemove}
              onClick={() => {
                const memberId = record.userId;
                if (memberId) {
                  onRemoveMember?.(memberId);
                }
              }}
            >
              Remove
            </Button>
          );
        },
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
      render: (role: EMemberRole) => {
        const getRoleColor = (role: EMemberRole) => {
          switch (role) {
            case EMemberRole.ADMIN:
              return 'red';
            case EMemberRole.MANAGER:
              return 'blue';
            case EMemberRole.TEAM_MEMBER:
              return 'green';
            default:
              return 'default';
          }
        };

        const getRoleLabel = (role: EMemberRole) => {
          switch (role) {
            case EMemberRole.ADMIN:
              return 'Admin';
            case EMemberRole.MANAGER:
              return 'Manager';
            case EMemberRole.TEAM_MEMBER:
              return 'Team Member';
            default:
              return role;
          }
        };

        return (
          <Tag color={getRoleColor(role)}>
            {getRoleLabel(role)}
          </Tag>
        );
      },
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
              {(isOwner || isAdmin) && (
                <Select.Option value="admin">Admin</Select.Option>
              )}
              {(isOwner || isAdmin || isManager) && (
                <Select.Option value="manager">Manager</Select.Option>
              )}
              <Select.Option value="team_member">Team Member</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default MembersSection; 