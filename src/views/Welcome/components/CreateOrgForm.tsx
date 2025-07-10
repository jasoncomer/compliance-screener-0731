import React from 'react';
import { Form, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Input from '../../../components/common/Input';
import { CreateOrgFormProps, CreateOrgFormData } from '../types';
import { WelcomeHeader, ActionButtons, FormContainer } from '../WelcomeStyles';

const CreateOrgForm: React.FC<CreateOrgFormProps> = ({ onBack, onSubmit }) => {
  const [form] = Form.useForm<CreateOrgFormData>();

  return (
    <FormContainer>
      <Button
        icon={<ArrowLeftOutlined />}
        type="link"
        onClick={onBack}
      >
        Back
      </Button>
      <WelcomeHeader>
        <h2>Create Your Organization</h2>
        <p>Set up your team's workspace</p>
      </WelcomeHeader>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        style={{ width: '100%' }}
      >
        <Form.Item
          name="name"
          label="Organization Name"
          rules={[
            { required: true, message: 'Please enter organization name' },
            { min: 2, message: 'Name must be at least 2 characters' },
            { max: 50, message: 'Name must be at most 50 characters' },
            { pattern: /^[a-zA-Z0-9\s-_]+$/, message: 'Name can only contain letters, numbers, spaces, and -_' }
          ]}
        >
          <Input placeholder="Enter organization name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description (Optional)"
          rules={[
            { max: 200, message: 'Description must be at most 200 characters' }
          ]}
        >
          <Input
            multiline
            rows={3}
            placeholder="Brief description of your organization"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Organization Email (Optional)"
          rules={[
            { type: 'email', message: 'Please enter a valid email address' },
            { max: 128, message: 'Email must be at most 128 characters' }
          ]}
          help="If not provided, your account email will be used as the organization email"
        >
          <Input placeholder="Enter organization email" />
        </Form.Item>

        <ActionButtons>
          <Button onClick={onBack}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Create Organization
          </Button>
        </ActionButtons>
      </Form>
    </FormContainer>
  );
};

export default CreateOrgForm; 