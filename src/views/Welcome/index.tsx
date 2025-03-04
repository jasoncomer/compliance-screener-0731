import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Modal, message } from 'antd';
import { TeamOutlined, UserAddOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import ViewWrapper from '../../components/ViewWrapper';
import OptionCard from './components/OptionCard';
import CreateOrgForm from './components/CreateOrgForm';
import JoinOrgForm from './components/JoinOrgForm';
import { WelcomeOption, CreateOrgFormData, JoinOrgFormData } from './types';
import {
  StyledCard,
  WelcomeContainer,
  WelcomeHeader,
  LoadingWrapper,
  ContentWrapper
} from './styled';

const Welcome: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [option, setOption] = useState<WelcomeOption>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [contentState, setContentState] = useState<'entering' | 'exiting' | 'stable'>('entering');

  // Get magic link token if present
  const inviteToken = searchParams.get('token');
  const orgName = searchParams.get('org');

  useEffect(() => {
    const handleMagicLink = async () => {
      if (!inviteToken) {
        setLoading(false);
        return;
      }

      try {
        // API call will be implemented later
        // const result = await api.organization.acceptInvite(inviteToken);
        message.success(`Welcome to ${orgName || 'the organization'}!`);
        navigate('/home/compliance-screener');
      } catch (err: any) {
        setError(err.message || 'Invalid or expired invitation link');
        setLoading(false);
      }
    };

    handleMagicLink();
  }, [inviteToken, orgName, navigate]);

  // Set content to stable after initial load
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setContentState('stable');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleCreateOrganization = async (values: CreateOrgFormData) => {
    try {
      // TODO: API implementation
      // await api.organization.create(values);
      message.success('Organization created successfully!');
      navigate('/home/compliance-screener');
    } catch (err: any) {
      message.error(err.message || 'Failed to create organization');
    }
  };

  const handleJoinWithCode = async (values: JoinOrgFormData) => {
    try {
      // TODO: API implementation
      // await api.organization.joinWithCode(values.code);
      message.success('Successfully joined the organization!');
      navigate('/home/compliance-screener');
    } catch (err: any) {
      message.error(err.message || 'Invalid invite code');
    }
  };

  const handleSkip = () => {
    Modal.confirm({
      title: 'Skip Organization Setup?',
      content: (
        <div>
          <p>You can still access most features, but you'll miss out on:</p>
          <ul>
            <li>Collaborating with team members</li>
            <li>Sharing cases and alerts</li>
            <li>Team-wide settings and preferences</li>
          </ul>
          <p>You can always create or join an organization later in Settings.</p>
        </div>
      ),
      onOk: () => navigate('/home/compliance-screener'),
      okText: 'Skip for now',
      cancelText: 'Go back'
    });
  };

  const handleOptionChange = async (newOption: WelcomeOption | undefined) => {
    if (newOption === option) return;

    setContentState('exiting');
    await new Promise(resolve => setTimeout(resolve, 300));
    setOption(newOption);
    setContentState('entering');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <LoadingWrapper>
          <Spin size="large" />
          <p>Setting up your workspace...</p>
        </LoadingWrapper>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center' }}>
          <h2>Invalid Invitation</h2>
          <p>{error}</p>
          <button onClick={() => setError(undefined)}>Start Fresh</button>
        </div>
      );
    }

    if (!option) {
      return (
        <>
          <WelcomeHeader>
            <h2>Welcome to Blockscout</h2>
            <p>Your gateway to blockchain compliance and analytics</p>
          </WelcomeHeader>

          <OptionCard
            selected={option === 'create'}
            onClick={() => handleOptionChange('create')}
            theme={theme}
            icon={<TeamOutlined />}
            title="Create a new organization"
            description="Start fresh with your own organization and invite team members."
          />

          <OptionCard
            selected={option === 'join'}
            onClick={() => handleOptionChange('join')}
            theme={theme}
            icon={<UserAddOutlined />}
            title="Join with invite code"
            description="Join your team's organization using an invite code."
          />

          <OptionCard
            selected={option === 'skip'}
            onClick={() => handleSkip()}
            theme={theme}
            icon={<ArrowRightOutlined />}
            title="Skip for now"
            description="Continue without an organization. You can create or join one later in Settings."
          />
        </>
      );
    }

    if (option === 'create') {
      return (
        <CreateOrgForm
          theme={theme}
          onBack={() => handleOptionChange(undefined)}
          onSubmit={handleCreateOrganization}
        />
      );
    }

    if (option === 'join') {
      return (
        <JoinOrgForm
          theme={theme}
          onBack={() => handleOptionChange(undefined)}
          onSubmit={handleJoinWithCode}
        />
      );
    }

    return null;
  };

  return (
    <WelcomeContainer theme={{ theme }}>
      <img
        src="https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg"
        alt="Blockscout Logo"
        style={{ position: 'absolute', top: '2em', left: '2em', objectFit: 'cover', width: '100px' }}
      />
      <StyledCard className={option === 'create' || option === 'join' ? 'form-view' : ''}>
        <ContentWrapper state={contentState}>
          {renderContent()}
        </ContentWrapper>
      </StyledCard>
    </WelcomeContainer>
  );
};

export default Welcome; 