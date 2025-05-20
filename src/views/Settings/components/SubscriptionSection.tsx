import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Row, 
  Col, 
  Tag, 
  Spin, 
  Modal, 
  Descriptions,
  message
} from 'antd';
import { CrownOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  fetchSubscriptionTiers, 
  fetchOrganizationSubscription,
  updateOrganizationSubscription,
  cancelOrganizationSubscription,
  selectSubscriptionTiers,
  selectCurrentSubscription,
  selectSubscriptionLoading
} from '../../../store/slices/subscriptionSlice';
import { selectCurrentOrganization } from '../../../store/slices/organizationsSlice';
import { ISubscriptionTier, ESubscriptionStatus } from '../../../typings/subscription';
import { format } from 'date-fns';

const { Title, Text } = Typography;

interface SubscriptionSectionProps {
  theme: 'dark' | 'light';
}

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ theme }) => {
  const dispatch = useAppDispatch();
  const tiers = useAppSelector(selectSubscriptionTiers);
  const currentSubscription = useAppSelector(selectCurrentSubscription);
  const loading = useAppSelector(selectSubscriptionLoading);
  const organization = useAppSelector(selectCurrentOrganization);
  const [selectedTier, setSelectedTier] = useState<ISubscriptionTier | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelImmediately, setCancelImmediately] = useState(false);

  useEffect(() => {
    dispatch(fetchSubscriptionTiers());
    if (organization?._id) {
      dispatch(fetchOrganizationSubscription(organization._id));
    }
  }, [dispatch, organization?._id]);

  const handleTierSelect = (tier: ISubscriptionTier) => {
    setSelectedTier(tier);
    setConfirmModalVisible(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedTier || !organization?._id) return;
    
    try {
      await dispatch(updateOrganizationSubscription({
        organizationId: organization._id,
        tierId: selectedTier._id as string
      })).unwrap();
      message.success('Subscription updated successfully');
      setConfirmModalVisible(false);
    } catch (error) {
      message.error('Failed to update subscription');
    }
  };

  const handleCancelSubscription = async () => {
    if (!organization?._id) return;
    
    try {
      await dispatch(cancelOrganizationSubscription({
        organizationId: organization._id,
        cancelImmediately
      })).unwrap();
      message.success(
        cancelImmediately 
          ? 'Subscription canceled immediately' 
          : 'Subscription will be canceled at the end of the billing period'
      );
      setCancelModalVisible(false);
    } catch (error) {
      message.error('Failed to cancel subscription');
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const getStatusTag = (status: ESubscriptionStatus) => {
    switch (status) {
      case ESubscriptionStatus.ACTIVE:
        return <Tag color="green">Active</Tag>;
      case ESubscriptionStatus.TRIAL:
        return <Tag color="blue">Trial</Tag>;
      case ESubscriptionStatus.PAST_DUE:
        return <Tag color="orange">Past Due</Tag>;
      case ESubscriptionStatus.UNPAID:
        return <Tag color="red">Unpaid</Tag>;
      case ESubscriptionStatus.CANCELED:
        return <Tag color="gray">Canceled</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const getCurrentTier = () => {
    if (!currentSubscription?.tierId) return null;
    const tierId = typeof currentSubscription.tierId === 'string' 
      ? currentSubscription.tierId 
      : (currentSubscription.tierId as ISubscriptionTier)._id;
    
    return tiers.find(tier => tier._id === tierId) || null;
  };

  const currentTier = getCurrentTier();

  const renderFeatureValue = (value: boolean | number | string) => {
    if (typeof value === 'boolean') {
      return value ? <CheckCircleOutlined style={{ color: 'green' }} /> : <CloseCircleOutlined style={{ color: 'red' }} />;
    }
    return value;
  };

  // Sort tiers by sortOrder
  const sortedTiers = [...tiers].sort((a, b) => a.sortOrder - b.sortOrder);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4}>
          <CrownOutlined style={{ marginRight: '8px' }} />
          Subscription Management
        </Title>
        <Text>Manage your organization's subscription plan and billing</Text>
      </div>

      {currentSubscription && (
        <Card 
          title="Current Subscription" 
          style={{ marginBottom: '24px' }} 
          bordered={false}
          className={theme === 'dark' ? 'dark-card' : ''}
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
            <Descriptions.Item label="Plan">{currentTier?.name || 'Unknown'}</Descriptions.Item>
            <Descriptions.Item label="Status">{getStatusTag(currentSubscription.status)}</Descriptions.Item>
            <Descriptions.Item label="Billing Period">
              {currentTier?.price.billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              {currentTier ? `$${currentTier.price.amount} ${currentTier.price.currency}` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Current Period">
              {formatDate(currentSubscription.currentPeriodStart)} - {formatDate(currentSubscription.currentPeriodEnd)}
            </Descriptions.Item>
            {currentSubscription.trialEnd && (
              <Descriptions.Item label="Trial Ends">{formatDate(currentSubscription.trialEnd)}</Descriptions.Item>
            )}
          </Descriptions>

          {currentSubscription.status !== ESubscriptionStatus.CANCELED && (
            <Button 
              danger 
              onClick={() => setCancelModalVisible(true)}
              style={{ marginTop: '16px' }}
            >
              Cancel Subscription
            </Button>
          )}
        </Card>
      )}

      <Card 
        title="Available Plans" 
        bordered={false}
        className={theme === 'dark' ? 'dark-card' : ''}
      >
        <Row gutter={[16, 16]}>
          {sortedTiers.map(tier => (
            <Col xs={24} sm={24} md={12} lg={8} xl={8} xxl={6} key={String(tier._id)}>
              <Card 
                title={tier.name} 
                bordered 
                style={{ 
                  height: '100%',
                  borderColor: currentTier?._id === tier._id ? '#1890ff' : undefined,
                  boxShadow: currentTier?._id === tier._id ? '0 0 10px rgba(24,144,255,0.2)' : undefined
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <Title level={4}>${tier.price.amount}/{tier.price.billingPeriod === 'monthly' ? 'mo' : 'yr'}</Title>
                  <Text>{tier.description}</Text>
                </div>
                
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Max Members">{tier.features.maxMembers}</Descriptions.Item>
                  <Descriptions.Item label="Max Organizations">{tier.features.maxOrganizations}</Descriptions.Item>
                  <Descriptions.Item label="Transactions per Month">{tier.features.maxTransactionsPerMonth}</Descriptions.Item>
                  <Descriptions.Item label="Data Retention">{tier.features.dataRetentionMonths} months</Descriptions.Item>
                  <Descriptions.Item label="Support">{tier.features.support}</Descriptions.Item>
                  <Descriptions.Item label="Custom Branding">{renderFeatureValue(tier.features.customBranding)}</Descriptions.Item>
                  <Descriptions.Item label="API Access">{renderFeatureValue(tier.features.apiAccess)}</Descriptions.Item>
                  <Descriptions.Item label="CSAM Scanning">{renderFeatureValue(tier.features.allowCSAM)}</Descriptions.Item>
                </Descriptions>

                <Button 
                  type="primary" 
                  block 
                  style={{ marginTop: '16px' }}
                  disabled={currentTier?._id === tier._id}
                  onClick={() => handleTierSelect(tier)}
                >
                  {currentTier?._id === tier._id ? 'Current Plan' : 'Select Plan'}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title="Confirm Subscription Change"
        open={confirmModalVisible}
        onOk={handleConfirmUpgrade}
        onCancel={() => setConfirmModalVisible(false)}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>Are you sure you want to change your subscription to {selectedTier?.name}?</p>
        <p>You will be charged ${selectedTier?.price.amount} per {selectedTier?.price.billingPeriod}.</p>
      </Modal>

      <Modal
        title="Cancel Subscription"
        open={cancelModalVisible}
        onOk={handleCancelSubscription}
        onCancel={() => setCancelModalVisible(false)}
        okText="Confirm Cancellation"
        cancelText="Keep Subscription"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to cancel your subscription?</p>
        <p>Choose how you would like to cancel:</p>
        <Button.Group style={{ marginTop: '16px' }}>
          <Button 
            type={cancelImmediately ? 'primary' : 'default'} 
            danger={cancelImmediately}
            onClick={() => setCancelImmediately(true)}
          >
            Cancel Immediately
          </Button>
          <Button 
            type={!cancelImmediately ? 'primary' : 'default'}
            danger={!cancelImmediately}
            onClick={() => setCancelImmediately(false)}
          >
            Cancel at End of Billing Period
          </Button>
        </Button.Group>
      </Modal>
    </div>
  );
};

export default SubscriptionSection; 