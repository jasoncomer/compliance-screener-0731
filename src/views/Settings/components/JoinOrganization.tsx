import React, { useState } from 'react';
import { Card, Form, Button, Result, Spin } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../../../context/ThemeContext';
import Input from '../../../components/common/Input';
import ViewWrapper from '../../../components/ViewWrapper';
import { TeamOutlined } from '@ant-design/icons';

const StyledCard = styled(Card)`
  max-width: 500px;
  margin: 40px auto;
`;

const JoinOrganization: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  // Get invitation token or code from URL
  const inviteToken = searchParams.get('token');
  const inviteCode = searchParams.get('code');

  const handleJoinWithCode = async (values: { code: string }) => {
    setLoading(true);
    setError(undefined);
    
    try {
      // API call will be implemented later
      // await api.organization.joinWithCode(values.code);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to join organization');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!inviteToken) return;
    
    setLoading(true);
    setError(undefined);
    
    try {
      // API call will be implemented later
      // await api.organization.acceptInvitation(inviteToken);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ViewWrapper icon={<TeamOutlined />} title="Join Organization">
        <StyledCard>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '20px' }}>Processing your request...</p>
          </div>
        </StyledCard>
      </ViewWrapper>
    );
  }

  if (success) {
    return (
      <ViewWrapper icon={<TeamOutlined />} title="Join Organization">
        <StyledCard>
          <Result
            status="success"
            title="Welcome to the organization!"
            subTitle="You have successfully joined the organization."
            extra={[
              <Button type="primary" key="home" onClick={() => navigate('/home')}>
                Go to Dashboard
              </Button>
            ]}
          />
        </StyledCard>
      </ViewWrapper>
    );
  }

  return (
    <ViewWrapper icon={<TeamOutlined />} title="Join Organization">
      <StyledCard>
        {inviteToken ? (
          <div style={{ textAlign: 'center' }}>
            <h2>You've been invited to join an organization</h2>
            <p>Click the button below to accept the invitation and join the organization.</p>
            {error && <p style={{ color: 'red', marginTop: '16px' }}>{error}</p>}
            <Button type="primary" onClick={handleAcceptInvitation} size="large">
              Accept Invitation
            </Button>
          </div>
        ) : (
          <Form layout="vertical" onFinish={handleJoinWithCode}>
            <h2>Join with Invite Code</h2>
            <p>Enter the organization's invite code to join.</p>
            
            <Form.Item
              name="code"
              rules={[
                { required: true, message: 'Please enter the invite code' },
                { min: 6, message: 'Invalid invite code' }
              ]}
              initialValue={inviteCode}
            >
              <Input placeholder="Enter invite code" />
            </Form.Item>

            {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

            <Button type="primary" htmlType="submit" block>
              Join Organization
            </Button>
          </Form>
        )}
      </StyledCard>
    </ViewWrapper>
  );
};

export default JoinOrganization; 