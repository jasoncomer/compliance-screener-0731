import React from 'react';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button,Form } from 'antd';

import Input from '../../../components/common/Input';
import { JoinOrgFormData,JoinOrgFormProps } from '../types';
import { ActionButtons, FormContainer,WelcomeHeader } from '../WelcomeStyles';

const JoinOrgForm: React.FC<JoinOrgFormProps> = ({ onBack, onSubmit }) => {
  const [form] = Form.useForm<JoinOrgFormData>();

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
        <h2>Join Organization</h2>
        <p>Connect with your team's workspace</p>
      </WelcomeHeader>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        style={{ width: '100%' }}
      >
        <Form.Item
          name="code"
          label="Invite Code"
          rules={[
            { required: true, message: 'Please enter the invite code' },
            { min: 6, message: 'Invalid invite code format' },
            { max: 12, message: 'Invalid invite code format' },
            { pattern: /^[A-Z0-9-]+$/, message: 'Invalid invite code format' }
          ]}
          help="Enter the invite code shared by your team"
        >
          <Input 
            placeholder="Enter invite code" 
            style={{ textTransform: 'uppercase' }} 
          />
        </Form.Item>

        <ActionButtons>
          <Button onClick={onBack}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Join Organization
          </Button>
        </ActionButtons>
      </Form>
    </FormContainer>
  );
};

export default JoinOrgForm; 