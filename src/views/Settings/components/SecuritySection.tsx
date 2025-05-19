import React, { useState } from 'react';
import { Card, SubTitle, InfoList, InfoItem, Label, Value, Button } from './styled';
import { Form, Input, Modal, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { changePassword } from '../../../api/auth';

interface SecuritySectionProps {
  theme: 'dark' | 'light';
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ theme }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      form.setFields([{
        name: 'confirmPassword',
        errors: ['Passwords do not match']
      }]);
      return;
    }

    setLoading(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      message.success('Password updated successfully');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to update password. Please check your current password and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>Security Settings</SubTitle>
      <InfoList>
        <InfoItem theme={{ theme }}>
          <Label theme={{ theme }}>Password</Label>
          <Value theme={{ theme }}>
            <Button onClick={() => setIsModalVisible(true)}>
              Change Password
            </Button>
          </Value>
        </InfoItem>
      </InfoList>

      <Modal
        title="Change Password"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 8, message: 'Password must be at least 8 characters long' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SecuritySection; 