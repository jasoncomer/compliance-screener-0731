import React, { useState } from 'react';
import { Form, Button, message } from 'antd';
import { Card, SubTitle, InfoList, InfoItem, Label, Value } from './styled';
import { IOrganization } from '../../../typings/organization';
import Input from '../../../components/common/Input';

interface OrganizationSectionProps {
  theme: 'dark' | 'light';
  organization?: IOrganization;
  onUpdateOrganization?: (data: Partial<IOrganization>) => void;
}

const OrganizationSection: React.FC<OrganizationSectionProps> = ({
  theme,
  organization,
  onUpdateOrganization
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: Partial<IOrganization>) => {
    try {
      await onUpdateOrganization?.(values);
      setIsEditing(false);
      message.success('Organization settings updated successfully');
    } catch (error) {
      message.error('Failed to update organization settings');
    }
  };

  return (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>Organization Settings</SubTitle>
      {!isEditing ? (
        <>
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
          <Button onClick={() => setIsEditing(true)}>Edit Settings</Button>
        </>
      ) : (
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

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save Changes</Button>
          </div>
        </Form>
      )}
    </Card>
  );
};

export default OrganizationSection; 