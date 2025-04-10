import React, { useState } from 'react';
import { Form, Button, message, Tabs, Table, Modal, Select, Tag, Tooltip, InputNumber } from 'antd';
import { UserAddOutlined, CopyOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Card, SubTitle, InfoList, InfoItem, Label, Value } from './styled';
import { IOrganization, IMember, IInvitation, MemberRole } from '../../../typings/organization';
import { IUser } from '../../../typings/interfaces';
import Input from '../../../components/common/Input';

interface OrganizationSectionProps {
  theme: 'dark' | 'light';
  organization?: IOrganization;
  onUpdateOrganization?: (data: Partial<IOrganization>) => void;
  currentUser?: IUser;
  members: IMember[];
  pendingInvitations: IInvitation[];
  onInviteMember?: (email: string, role: MemberRole) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMemberRole?: (memberId: string, newRole: MemberRole) => void;
  onGenerateInviteCode?: () => Promise<string>;
  onRevokeInvitation?: (invitationId: string) => void;
}

const OrganizationSection: React.FC<OrganizationSectionProps> = ({
  theme,
  organization,
  onUpdateOrganization,
  currentUser,
  members = [],
  pendingInvitations = [],
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
  onGenerateInviteCode,
  onRevokeInvitation
}) => {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isComplianceModalVisible, setIsComplianceModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [complianceForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('general');
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [inviteForm] = Form.useForm();
  const [inviteCode, setInviteCode] = useState<string>();
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const handleSubmit = async (values: Partial<IOrganization>) => {
    try {
      await onUpdateOrganization?.(values);
      setIsEditModalVisible(false);
      message.success('Organization settings updated successfully');
    } catch (error) {
      message.error('Failed to update organization settings');
    }
  };

  const handleComplianceSubmit = async (_: { riskScoreThreshold: number; transactionThreshold: number }) => {
    try {
      // Implement actual API call when backend is ready
      message.success('Compliance settings updated successfully');
      setIsComplianceModalVisible(false);
    } catch (error) {
      message.error('Failed to update compliance settings');
    }
  };

  const handleInvite = async (values: { email: string; role: MemberRole }) => {
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
            <Value theme={{ theme }}>70</Value>
          </InfoItem>
          <InfoItem theme={{ theme }}>
            <Label theme={{ theme }}>
              Transaction Amount Threshold
              <Tooltip title="Transactions under this amount will not be monitored">
                <InfoCircleOutlined style={{ marginLeft: '8px', fontSize: '14px', opacity: 0.7 }} />
              </Tooltip>
            </Label>
            <Value theme={{ theme }}>$30</Value>
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
        dataIndex: ['user', 'name'],
        width: 240,
        render: (_: string, record: IMember) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{record.user?.name || record.email || 'Unknown'}</span>
            {record.status === 'pending' && (
              <Tag color="orange">Pending</Tag>
            )}
          </div>
        ),
      },
      {
        title: 'Email',
        dataIndex: ['user', 'email'],
        render: (_: string, record: IMember) => record.user?.email || record.email || 'N/A',
      },
      {
        title: 'Role',
        dataIndex: 'role',
        render: (role: MemberRole, record: IMember) => (
          <Select
            value={role}
            style={{ width: 120 }}
            onChange={(newRole: MemberRole) => {
              const memberId = record.user?._id;
              if (memberId) {
                onUpdateMemberRole?.(memberId, newRole);
              }
            }}
            disabled={!record.user?._id || record.user._id === currentUser?._id}
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
            disabled={!record.user?._id || record.user._id === currentUser?._id}
            onClick={() => {
              const memberId = record.user?._id;
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
        render: (role: MemberRole) => (
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
            <Tooltip title="Generate Invite Code">
              <Button
                icon={<SettingOutlined />}
                onClick={handleGenerateInviteCode}
                loading={isGeneratingCode}
              />
            </Tooltip>
          </div>
        </div>

        <Table
          dataSource={members}
          columns={columns}
          rowKey={(record) => record.user?._id || record.email || record.joinedAt}
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