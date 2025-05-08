import React, { useState } from 'react';
import { Form, Button, message, Tabs, Table, Modal, Select, Tag, Tooltip, InputNumber, Switch } from 'antd';
import { UserAddOutlined, CopyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Card, SubTitle, InfoList, InfoItem, Label, Value } from './styled';
import { IOrganization, IMember, IInvitation, EMemberRole, IOrganizationMember } from '../../../typings/organization';
import { IUser } from '../../../typings/interfaces';
import Input from '../../../components/common/Input';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { selectActiveOrgMembers, updateMemberRole, selectCurrentOrganization, updateOrganization } from '../../../store/slices/organizationsSlice';


interface OrganizationSectionProps {
  theme: 'dark' | 'light';
  onUpdateOrganization?: (data: Partial<IOrganization>) => void;
  currentUser?: IUser;
  pendingInvitations: IInvitation[];
  onInviteMember?: (email: string, role: EMemberRole) => void;
  onRemoveMember?: (memberId: string) => void;
  onRevokeInvitation?: (invitationId: string) => Promise<void> | void;
}

const OrganizationSection: React.FC<OrganizationSectionProps> = ({
  theme,
  onUpdateOrganization,
  currentUser,
  pendingInvitations = [],
  onInviteMember,
  onRemoveMember,
  onRevokeInvitation
}) => {
  const members = useAppSelector(selectActiveOrgMembers);
  const dispatch = useAppDispatch();
  const organization = useAppSelector(selectCurrentOrganization);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isComplianceModalVisible, setIsComplianceModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [complianceForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('general');
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [inviteForm] = Form.useForm();
  const [inviteCode, _] = useState<string>();
  const [updatingRoleForMemberId, setUpdatingRoleForMemberId] = useState<string | null>(null);
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(null);
  const [isSubmittingCompliance, setIsSubmittingCompliance] = useState(false);

  const onCsamChange = (checked: boolean) => {
    if (onUpdateOrganization && organization) {
      const updatedSettings = {
        maxMembers: organization.settings.maxMembers,
        allowedDomains: organization.settings.allowedDomains,
        allowCSAM: checked,
        inviteCode: organization.settings.inviteCode,
        riskScoreThreshold: organization.settings.riskScoreThreshold,
        transactionThreshold: organization.settings.transactionThreshold
      };
      onUpdateOrganization({
        settings: updatedSettings
      });
    }
  };

  const handleSubmit = async (values: Partial<IOrganization>) => {
    try {
      await dispatch(updateOrganization({ 
        organizationId: organization?._id || '', 
        data: values 
      })).unwrap();
      setIsEditModalVisible(false);
      message.success('Organization settings updated successfully');
    } catch (error) {
      message.error('Failed to update organization settings');
    }
  };

  const handleComplianceSubmit = async (values: { riskScoreThreshold: number; transactionThreshold: number }) => {
    try {
      if (!organization) return;
      setIsSubmittingCompliance(true);
      await dispatch(updateOrganization({ 
        organizationId: organization._id, 
        data: {
          settings: {
            maxMembers: organization?.settings.maxMembers || 5,
            allowedDomains: organization?.settings.allowedDomains || [],
            inviteCode: organization?.settings.inviteCode || '',
            allowCSAM: organization?.settings.allowCSAM || false,
            riskScoreThreshold: values.riskScoreThreshold,
            transactionThreshold: values.transactionThreshold
          }
        }
      })).unwrap();
      message.success('Compliance settings updated successfully');
      setIsComplianceModalVisible(false);
      
    } catch (error) {
      message.error('Failed to update compliance settings');
    } finally {
      setIsSubmittingCompliance(false);
    }
  };

  const handleInvite = async (values: { email: string; role: EMemberRole }) => {
    onInviteMember?.(values.email, values.role);
    setIsInviteModalVisible(false);
    inviteForm.resetFields();
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      message.success('Invite code copied to clipboard');
    }
  };


  const renderGeneralTab = () => {
    return (
      <>
        <SubTitle theme={{ theme }} style={{ marginBottom: '16px' }}>Basic Information</SubTitle>
        <InfoList>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Name</Label>
            <Value theme={{ theme }}>{organization?.name || 'N/A'}</Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Description</Label>
            <Value theme={{ theme }}>{organization?.description || 'No description'}</Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Member Limit</Label>
            <Value theme={{ theme }}>{organization?.settings.maxMembers || 5}</Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>Allowed Domains</Label>
            <Value theme={{ theme }}>
              {organization?.settings.allowedDomains?.join(', ') || 'Any domain allowed'}
            </Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>CSAM Visualization</Label>
            <Value theme={{ theme }}>
              <Switch
                checked={organization?.settings.allowCSAM}
                onChange={onCsamChange}
              />
            </Value>
          </InfoItem>
        </InfoList>
        <div style={{ marginTop: '16px', marginBottom: '32px' }}>
          <Button onClick={() => setIsEditModalVisible(true)}>Edit Settings</Button>
        </div>

        <SubTitle theme={{ theme }} style={{ marginBottom: '16px' }}>Compliance Settings</SubTitle>
        <InfoList>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>
              Risk Score Threshold
              <Tooltip title="The minimum risk score that triggers alerts for suspicious transactions">
                <InfoCircleOutlined style={{ marginLeft: '8px', fontSize: '14px', opacity: 0.7 }} />
              </Tooltip>
            </Label>
            <Value theme={{ theme }}>{organization?.settings.riskScoreThreshold || 70}</Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>
              Transaction Amount Threshold
              <Tooltip title="Transactions under this amount will not be monitored">
                <InfoCircleOutlined style={{ marginLeft: '8px', fontSize: '14px', opacity: 0.7 }} />
              </Tooltip>
            </Label>
            <Value theme={{ theme }}>${organization?.settings.transactionThreshold || 30}</Value>
          </InfoItem>
        </InfoList>
        <div style={{ marginTop: '16px' }}>
          <Button onClick={() => setIsComplianceModalVisible(true)}>Manage Compliance</Button>
        </div>
      </>
    );
  };

  const renderPeopleTab = () => {
    const columns = [
      {
        title: 'Member',
        dataIndex: ['name', 'email'],
        width: 240,
        render: (_: string, record: IOrganizationMember) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="capitalize">{(record.name && record.surname) ? `${record.name} ${record.surname}` : 'Unknown'}</span>
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
          const currentMember = members.find(m => m.userId === record.userId);
          const currentRole = currentMember?.role || role;
          console.log('updating ', updatingRoleForMemberId, currentRole, record.userId);
          return (
            <Select
              key={`role-${record.userId}-${currentRole}`}
              value={currentRole}
              style={{ width: 120 }}
              onChange={(newRole: EMemberRole) => {
                const memberId = record.userId;
                if (memberId && organization) {
                  setUpdatingRoleForMemberId(memberId);
                  dispatch(updateMemberRole({ 
                    organizationId: organization._id, 
                    memberId, 
                    role: newRole 
                  }))
                    .unwrap()
                    .catch((error) => {
                      message.error(`Failed to update role: ${error.message}`);
                    })
                    .finally(() => {
                      setUpdatingRoleForMemberId(null);
                    });
                }
              }}
              disabled={!record.userId || record.userId === currentUser?._id || updatingRoleForMemberId != null && updatingRoleForMemberId === record.userId}
              loading={updatingRoleForMemberId != null && updatingRoleForMemberId === record.userId}
            >
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="team_member">Team Member</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
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
        width: 240,
      },
      {
        title: 'Role',
        dataIndex: 'role',
        render: (role: EMemberRole) => (
          <Tag color={role === EMemberRole.MANAGER ? 'blue' : 'green'}>
            {role === EMemberRole.MANAGER ? 'Manager' : 'Team Member'}
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
            loading={revokingInvitationId === record.id}
            disabled={revokingInvitationId === record.id}
            onClick={() => {
              if (onRevokeInvitation) {
                setRevokingInvitationId(record.id);
                
                try {
                  const result = onRevokeInvitation(record.id);
                  
                  Promise.resolve(result)
                    .then(() => {
                      message.success(`Invitation revoked successfully`);
                    })
                    .catch((error) => {
                      message.error(`Failed to revoke invitation: ${error.message}`);
                    })
                    .finally(() => {
                      setRevokingInvitationId(null);
                    });
                } catch (error) {
                  message.error(`Failed to revoke invitation: ${error instanceof Error ? error.message : String(error)}`);
                  setRevokingInvitationId(null);
                }
              }
            }}
          >
            Revoke
          </Button>
        ),
      },
    ];

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <InfoList>
              <InfoItem theme={{ theme }}>
                <Label theme={{ theme }}>Active Members</Label>
                <Value theme={{ theme }}>{members.filter(m => m.status === 'active').length} / {organization?.settings.maxMembers || 5}</Value>
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
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setIsInviteModalVisible(true)}
            >
              Invite Member
            </Button>
          </div>
        </div>

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
      </div>
    );
  };

  const items = [
    {
      key: 'general',
      label: 'General',
      children: renderGeneralTab(),
    },
    {
      key: 'people',
      label: 'People',
      children: renderPeopleTab(),
    },
  ];

  return (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>Organization Settings</SubTitle>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        style={{ marginTop: '16px' }}
      />

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
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Organization Settings"
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
            name: organization?.name,
            description: organization?.description,
            allowedDomains: organization?.settings.allowedDomains?.join('\n')
          }}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Organization Name"
            rules={[{ required: true, message: 'Please enter organization name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input multiline rows={3} />
          </Form.Item>

          <Form.Item
            name="allowedDomains"
            label="Allowed Email Domains"
            help="Enter one domain per line. Leave empty to allow all domains."
          >
            <Input multiline rows={3} placeholder="example.com&#10;company.org" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Compliance Settings"
        open={isComplianceModalVisible}
        onCancel={() => {
          setIsComplianceModalVisible(false);
          complianceForm.resetFields();
        }}
        onOk={() => complianceForm.submit()}
        confirmLoading={isSubmittingCompliance}
      >
        <Form
          form={complianceForm}
          layout="vertical"
          initialValues={{
            riskScoreThreshold: 70,
            transactionThreshold: 30
          }}
          onFinish={handleComplianceSubmit}
        >
          <Form.Item
            name="riskScoreThreshold"
            label="Risk Score Threshold"
            rules={[{ required: true, message: 'Please enter risk score threshold' }]}
            help="The minimum risk score that triggers alerts for suspicious transactions"
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="transactionThreshold"
            label="Transaction Amount Threshold"
            rules={[{ required: true, message: 'Please enter transaction amount threshold' }]}
            help="Transactions under this amount will not be monitored"
          >
            <InputNumber
              min={0}
              prefix="$"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default OrganizationSection; 