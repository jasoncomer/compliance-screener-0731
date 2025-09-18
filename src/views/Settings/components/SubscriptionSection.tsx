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
  message,
  Form,
  Input,
  Select,
  Radio,
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
import { ISubscriptionTier, ESubscriptionStatus, TierId } from '../../../typings/subscription';
import { api } from '../../../api/api';
import { IContactSalesFormData } from '../../../api/contactSales';
import { format } from 'date-fns';
import { useAppContext } from '../../../context/AppContext';

const { Title, Text } = Typography;

interface SubscriptionSectionProps {
  theme: 'dark' | 'light';
}

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ theme }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppContext();
  const tiers = useAppSelector(selectSubscriptionTiers);
  const currentSubscription = useAppSelector(selectCurrentSubscription);
  const loading = useAppSelector(selectSubscriptionLoading);
  const organization = useAppSelector(selectCurrentOrganization);
  const [selectedTier, setSelectedTier] = useState<ISubscriptionTier | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [contactSalesModalVisible, setContactSalesModalVisible] = useState(false);
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const [contactForm] = Form.useForm();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    dispatch(fetchSubscriptionTiers());
    if (organization?._id) {
      dispatch(fetchOrganizationSubscription(organization._id));
    }
  }, [dispatch, organization?._id]);

  const handleTierSelect = (tier: ISubscriptionTier) => {
    if (tier.id === 'custom') {
      contactForm.setFieldsValue({
        email: user?.email || '',
        company: organization?.name || ''
      });
      setContactSalesModalVisible(true);
    } else {
      setSelectedTier(tier);
      setConfirmModalVisible(true);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedTier || !organization?._id) return;
    
    try {
      await dispatch(updateOrganizationSubscription({
        organizationId: organization._id,
        tierId: selectedTier.id as TierId,
        billingPeriod: billingPeriod
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

  const handleContactSalesSubmit = async (values: IContactSalesFormData) => {
    try {
      await api.contactSales.submit(values);
      message.success('Thank you for your interest! Our sales team will contact you soon.');
      setContactSalesModalVisible(false);
      contactForm.resetFields();
    } catch (error: any) {
      console.error('Contact sales submission error:', error);
      message.error(error.response?.data?.message || 'Failed to submit contact form. Please try again.');
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
      : (currentSubscription.tierId as ISubscriptionTier).id;
    
    return tiers.find(tier => tier.id === tierId) || null;
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
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Current Plan</span>
            </div>
          }
          style={{ marginBottom: '24px' }} 
          bordered={false}
          className={theme === 'dark' ? 'dark-card' : ''}
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
            <Descriptions.Item label="Plan">{currentTier?.name || 'Unknown'}</Descriptions.Item>
            <Descriptions.Item label="Status">{getStatusTag(currentSubscription.status)}</Descriptions.Item>
            <Descriptions.Item label="Billing Period">
              {currentSubscription.billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              {(() => {
                const currentPrice = currentTier?.prices.find(p => p.billingPeriod === currentSubscription.billingPeriod);
                return currentPrice ? `$${currentPrice.amount} ${currentPrice.currency}` : 'N/A';
              })()}
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
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Available Plans</span>
            <Radio.Group
              value={billingPeriod}
              onChange={e => setBillingPeriod(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="monthly">Monthly</Radio.Button>
              <Radio.Button value="yearly">Yearly</Radio.Button>
            </Radio.Group>
          </div>
        }
        bordered={false}
        className={theme === 'dark' ? 'dark-card' : ''}
      >
        {sortedTiers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">No subscription plans available at the moment.</Text>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {sortedTiers.map(tier => {
              const priceObj = tier.prices.find(p => p.billingPeriod === billingPeriod);
              return (
                <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} key={String(tier.id)}>
                  <Card 
                    title={tier.name} 
                    bordered 
                    style={{ 
                      height: '100%',
                      borderColor: currentTier?.id === tier.id ? '#1890ff' : undefined,
                      boxShadow: currentTier?.id === tier.id ? '0 0 10px rgba(24,144,255,0.2)' : undefined,
                      position: 'relative',
                      minHeight: '400px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    bodyStyle={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '16px'
                    }}
                  >
                    {currentTier?.id === tier.id && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 1
                      }}>
                        <CheckCircleOutlined style={{ 
                          color: '#52c41a', 
                          fontSize: '20px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          padding: '2px'
                        }} />
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '16px' }}>
                      {tier.id === 'custom' && priceObj?.amount === 0 ? (
                        <>
                          <Title level={4}>Custom Pricing</Title>
                          <Text>{tier.description}</Text>
                        </>
                      ) : (
                        <>
                          <Title level={4}>
                            {priceObj ? `$${priceObj.amount.toLocaleString()}/${billingPeriod === 'monthly' ? 'mo' : 'yr'}` : 'N/A'}
                          </Title>
                          <Text>{tier.description}</Text>
                        </>
                      )}
                    </div>
                    
                    <Descriptions column={1} size="small" style={{ flex: 1 }}>
                      <Descriptions.Item label="Max Members">{tier.features.maxMembers}</Descriptions.Item>
                      {/* <Descriptions.Item label="Max Organizations">{tier.features.maxOrganizations}</Descriptions.Item> */}
                      <Descriptions.Item label="Compliance Transactions">{tier.features.maxTransactionsPerMonth.toLocaleString()}</Descriptions.Item>
                      <Descriptions.Item label="Data Retention">{tier.features.dataRetentionMonths} months</Descriptions.Item>
                      <Descriptions.Item label="Support" className='capitalize'>{tier.features.support}</Descriptions.Item>
                      {/* <Descriptions.Item label="Custom Branding">{renderFeatureValue(tier.features.customBranding)}</Descriptions.Item> */}
                      <Descriptions.Item label="API Access">{renderFeatureValue(tier.features.apiAccess)}</Descriptions.Item>
                      {/* <Descriptions.Item label="CSAM Scanning">{renderFeatureValue(tier.features.allowCSAM)}</Descriptions.Item> */}
                    </Descriptions>

                    <Button 
                      type="primary" 
                      block 
                      style={{ 
                        marginTop: 'auto',
                        marginBottom: '0'
                      }}
                      disabled={currentTier?.id === tier.id}
                      onClick={() => handleTierSelect(tier)}
                    >
                      {currentTier?.id === tier.id 
                        ? 'Current Plan' 
                        : tier.id === 'custom' 
                          ? 'Contact Sales' 
                          : 'Select Plan'
                      }
                    </Button>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
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
        <p>
          {(() => {
            const priceObj = selectedTier?.prices.find(p => p.billingPeriod === billingPeriod);
            return priceObj ? `You will be charged $${priceObj.amount} per ${billingPeriod}.` : '';
          })()}
        </p>
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

      <Modal
        title="Contact Sales"
        open={contactSalesModalVisible}
        onCancel={() => {
          setContactSalesModalVisible(false);
          contactForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text>
            Interested in our Custom plan? Fill out the form below and our sales team will get in touch with you shortly.
          </Text>
        </div>
        
        <Form
          form={contactForm}
          layout="vertical"
          onFinish={handleContactSalesSubmit}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="john.doe@company.com" />
          </Form.Item>
          
          <Form.Item
            label="Company"
            name="company"
            rules={[{ required: true, message: 'Please enter your company name' }]}
          >
            <Input placeholder="Your Company Name" />
          </Form.Item>
          
          <Form.Item
            label="Company Size"
            name="companySize"
            rules={[{ required: true, message: 'Please select your company size' }]}
          >
            <Select placeholder="Select company size">
              <Select.Option value="1-10">1-10 employees</Select.Option>
              <Select.Option value="11-50">11-50 employees</Select.Option>
              <Select.Option value="51-200">51-200 employees</Select.Option>
              <Select.Option value="201-1000">201-1000 employees</Select.Option>
              <Select.Option value="1000+">1000+ employees</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="How can we help you?"
            name="message"
            rules={[{ required: true, message: 'Please describe your needs' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Tell us about your specific requirements, expected usage, or any questions you have about the Custom plan..."
              allowClear={false}
              showCount={false}
              count={undefined}
              onClear={undefined}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button 
              onClick={() => {
                setContactSalesModalVisible(false);
                contactForm.resetFields();
              }} 
              style={{ marginRight: '8px' }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Submit Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubscriptionSection; 