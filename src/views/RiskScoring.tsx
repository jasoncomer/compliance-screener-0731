import React, { useState } from 'react';
import { Card, Input, Button, Row, Col, Typography, Statistic, Space, Table, Spin, Progress, Tabs, Alert, Tag, Switch, Avatar, Divider } from 'antd';
import { SafetyOutlined, WarningOutlined, CheckCircleOutlined, UserOutlined, GlobalOutlined, TwitterOutlined, SendOutlined, GithubOutlined, LinkedinOutlined, FacebookOutlined, InstagramOutlined, YoutubeOutlined, RedditOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface RiskScores {
  transactionRisk: number;
  entityRisk: number;
  jurisdictionRisk: number;
  overallRisk: number;
  details: {
    transaction: RiskDetail[];
    entity: RiskDetail[];
    jurisdiction: RiskDetail[];
  };
  historicalData: HistoricalData[];
  entityInfo?: EntityInfo;
}

interface RiskDetail {
  factor: string;
  score: number;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface HistoricalData {
  date: string;
  overallRisk: number;
}

interface EntityInfo {
  proper_name?: string;
  entity_id?: string;
  entity_type?: string;
  logo?: string;
  url?: string;
  ceo?: string;
  key_personnel?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  contact_twitter?: string;
  contact_telegram?: string;
  year_founded?: string;
  description_merged?: string;
  social_media_profiles?: string[];
  entity_tags?: string[];
  associated_countries?: string[];
  kyc_req?: boolean;
  centralized?: boolean;
  dead?: boolean;
}

const DetailSection = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 24px;
`;

const DetailItem = styled.div`
  margin-bottom: 16px;
`;

const DetailLabel = styled(Text)`
  display: block;
  color: #666666;
  margin-bottom: 4px;
  font-size: 14px;
`;

const DetailValue = styled(Text)`
  font-size: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  
  .anticon {
    color: #1890ff;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const HeaderInfo = styled.div`
  flex: 1;
`;

const StyledAvatar = styled(Avatar)`
  width: 64px;
  height: 64px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const EntityDetails: React.FC<{ entityInfo: EntityInfo }> = ({ entityInfo }) => {
  const getSocialMediaIcon = (url: string) => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('github')) return <GithubOutlined />;
    if (urlLower.includes('twitter')) return <TwitterOutlined />;
    if (urlLower.includes('linkedin')) return <LinkedinOutlined />;
    if (urlLower.includes('facebook')) return <FacebookOutlined />;
    if (urlLower.includes('instagram')) return <InstagramOutlined />;
    if (urlLower.includes('youtube')) return <YoutubeOutlined />;
    if (urlLower.includes('reddit')) return <RedditOutlined />;
    return <GlobalOutlined />;
  };

  return (
    <Card style={{ marginTop: '24px' }}>
      <HeaderSection>
        <StyledAvatar
          src={entityInfo.logo}
          icon={!entityInfo.logo && <UserOutlined />}
        />
        <HeaderInfo>
          <Title level={4} style={{ margin: 0 }}>{entityInfo.proper_name || entityInfo.entity_id}</Title>
          <Text type="secondary">{entityInfo.entity_type}</Text>
        </HeaderInfo>
      </HeaderSection>

      <DetailSection>
        <DetailItem>
          <DetailLabel>Status</DetailLabel>
          <DetailValue style={{ display: 'flex', gap: '16px' }}>
            <span>
              <Text>Active: </Text>
              <Switch checked={!entityInfo.dead} disabled />
            </span>
            <span>
              <Text>Centralized: </Text>
              <Switch checked={entityInfo.centralized} disabled />
            </span>
            <span>
              <Text>KYC Required: </Text>
              <Switch checked={entityInfo.kyc_req} disabled />
            </span>
          </DetailValue>
        </DetailItem>

        {entityInfo.url && (
          <DetailItem>
            <DetailLabel>Website</DetailLabel>
            <DetailValue>
              <GlobalOutlined />
              <a href={entityInfo.url.startsWith('http') ? entityInfo.url : `https://${entityInfo.url}`} 
                 target="_blank" 
                 rel="noopener noreferrer">
                {entityInfo.url}
              </a>
            </DetailValue>
          </DetailItem>
        )}

        {(entityInfo.ceo || entityInfo.key_personnel) && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Leadership</DetailLabel>
            <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entityInfo.ceo && <span><strong>CEO:</strong> {entityInfo.ceo}</span>}
              {entityInfo.key_personnel && (
                <span>
                  <strong>Key Personnel:</strong>{' '}
                  {entityInfo.key_personnel.split(',').map(person =>
                    <Tag key={person.trim()}>{person.trim()}</Tag>
                  )}
                </span>
              )}
            </DetailValue>
          </DetailItem>
        )}

        {(entityInfo.contact_email || entityInfo.contact_phone || entityInfo.contact_address) && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Contact Information</DetailLabel>
            <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entityInfo.contact_email && <span><strong>Email:</strong> {entityInfo.contact_email}</span>}
              {entityInfo.contact_phone && <span><strong>Phone:</strong> {entityInfo.contact_phone}</span>}
              {entityInfo.contact_address && <span><strong>Address:</strong> {entityInfo.contact_address}</span>}
            </DetailValue>
          </DetailItem>
        )}

        {entityInfo.entity_tags && entityInfo.entity_tags.length > 0 && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Tags</DetailLabel>
            <TagsContainer>
              {entityInfo.entity_tags.map((tag, index) => (
                <Tag key={index} color="blue" style={{ padding: '4px 8px', borderRadius: '16px' }}>
                  {tag}
                </Tag>
              ))}
            </TagsContainer>
          </DetailItem>
        )}

        {entityInfo.description_merged && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Description</DetailLabel>
            <DetailValue style={{ whiteSpace: 'pre-wrap' }}>
              {entityInfo.description_merged}
            </DetailValue>
          </DetailItem>
        )}

        {entityInfo.associated_countries && entityInfo.associated_countries.length > 0 && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Associated Countries</DetailLabel>
            <TagsContainer>
              {entityInfo.associated_countries.map((country, index) => (
                <Tag key={index}>{country}</Tag>
              ))}
            </TagsContainer>
          </DetailItem>
        )}

        {(entityInfo.contact_twitter || entityInfo.contact_telegram || 
          (entityInfo.social_media_profiles && entityInfo.social_media_profiles.length > 0)) && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Social Media</DetailLabel>
            <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entityInfo.contact_twitter && (
                <a href={`https://twitter.com/${entityInfo.contact_twitter.replace('@', '')}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TwitterOutlined />
                  <span>{entityInfo.contact_twitter}</span>
                </a>
              )}
              {entityInfo.contact_telegram && (
                <a href={`https://t.me/${entityInfo.contact_telegram.replace('@', '')}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SendOutlined />
                  <span>{entityInfo.contact_telegram}</span>
                </a>
              )}
              {entityInfo.social_media_profiles && entityInfo.social_media_profiles.map((profile, index) => {
                const icon = getSocialMediaIcon(profile);
                const url = profile.startsWith('http') ? profile : `https://${profile}`;
                return (
                  <a key={index}
                     href={url}
                     target="_blank"
                     rel="noopener noreferrer"
                     style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {icon}
                    <span>{profile}</span>
                  </a>
                );
              })}
            </DetailValue>
          </DetailItem>
        )}
      </DetailSection>
    </Card>
  );
};

const RiskScoring: React.FC = () => {
  const [address, setAddress] = useState('');
  const [riskScores, setRiskScores] = useState<RiskScores | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddressSubmit = async () => {
    if (!address) {
      setError('Please enter a blockchain address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Integrate with backend API
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const mockScores: RiskScores = {
        transactionRisk: 75,
        entityRisk: 45,
        jurisdictionRisk: 60,
        overallRisk: 60,
        details: {
          transaction: [
            { factor: 'High-value transfers', score: 85, description: 'Multiple transfers exceeding $100,000', severity: 'high' },
            { factor: 'Transaction frequency', score: 65, description: 'Above average transaction frequency', severity: 'medium' },
            { factor: 'Age of wallet', score: 30, description: 'Wallet active for more than 1 year', severity: 'low' },
          ],
          entity: [
            { factor: 'Known entity', score: 40, description: 'Entity identified as legitimate business', severity: 'low' },
            { factor: 'Entity type', score: 50, description: 'Registered as cryptocurrency exchange', severity: 'medium' },
          ],
          jurisdiction: [
            { factor: 'Geographic location', score: 70, description: 'Operations in high-risk jurisdiction', severity: 'high' },
            { factor: 'Regulatory compliance', score: 45, description: 'Partial compliance with regulations', severity: 'medium' },
          ],
        },
        historicalData: [
          { date: '2024-01', overallRisk: 55 },
          { date: '2024-02', overallRisk: 58 },
          { date: '2024-03', overallRisk: 60 },
        ],
        entityInfo: {
          proper_name: 'Crypto Exchange X',
          entity_id: 'CEX001',
          entity_type: 'Cryptocurrency Exchange',
          logo: 'https://example.com/logo.png',
          url: 'www.cryptoexchangex.com',
          ceo: 'John Doe',
          key_personnel: 'Jane Smith, Bob Johnson, Alice Williams',
          contact_email: 'contact@cryptoexchangex.com',
          contact_phone: '+1 (555) 123-4567',
          contact_address: '123 Blockchain Street, Crypto City, CC 12345',
          contact_twitter: '@CryptoExchangeX',
          contact_telegram: '@CryptoXSupport',
          year_founded: '2018',
          description_merged: 'Crypto Exchange X is a leading cryptocurrency exchange platform offering secure trading services with advanced features for both retail and institutional clients.',
          social_media_profiles: [
            'github.com/cryptoexchangex',
            'linkedin.com/company/cryptoexchangex'
          ],
          entity_tags: ['Exchange', 'Trading Platform', 'DeFi'],
          associated_countries: ['United States', 'Singapore', 'United Kingdom'],
          kyc_req: true,
          centralized: true,
          dead: false
        }
      };
      setRiskScores(mockScores);
    } catch (err) {
      setError('Failed to fetch risk scores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return '#cf1322';
    if (score > 40) return '#faad14';
    return '#3f8600';
  };

  const getRiskIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <WarningOutlined style={{ color: '#cf1322' }} />;
      case 'medium':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'low':
        return <CheckCircleOutlined style={{ color: '#3f8600' }} />;
    }
  };

  const columns = [
    {
      title: 'Risk Factor',
      dataIndex: 'factor',
      key: 'factor',
      render: (text: string, record: RiskDetail) => (
        <Space>
          {getRiskIcon(record.severity)}
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Progress 
          percent={score} 
          size="small" 
          status={score > 70 ? 'exception' : 'normal'} 
          strokeColor={getRiskColor(score)}
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <Space>
          <SafetyOutlined />
          Risk Scoring Dashboard
        </Space>
      </Title>
      <Paragraph>
        Analyze the risk profile of any blockchain address based on transaction patterns,
        entity information, and jurisdiction data.
      </Paragraph>

      <Card style={{ marginBottom: '24px' }}>
        <Space direction="horizontal" size="middle">
          <Input
            placeholder="Enter blockchain address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: '400px' }}
            onPressEnter={handleAddressSubmit}
          />
          <Button type="primary" onClick={handleAddressSubmit} loading={loading}>
            Analyze Risk
          </Button>
        </Space>
      </Card>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: '20px' }}>Analyzing blockchain address...</Paragraph>
        </div>
      )}

      {riskScores && !loading && (
        <>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Overall Risk Score"
                  value={riskScores.overallRisk}
                  suffix="/100"
                  valueStyle={{
                    color: getRiskColor(riskScores.overallRisk)
                  }}
                />
                <Progress 
                  percent={riskScores.overallRisk} 
                  status={riskScores.overallRisk > 70 ? 'exception' : 'normal'}
                  strokeColor={getRiskColor(riskScores.overallRisk)}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Transaction Risk"
                  value={riskScores.transactionRisk}
                  suffix="/100"
                  valueStyle={{
                    color: getRiskColor(riskScores.transactionRisk)
                  }}
                />
                <Progress 
                  percent={riskScores.transactionRisk}
                  status={riskScores.transactionRisk > 70 ? 'exception' : 'normal'}
                  strokeColor={getRiskColor(riskScores.transactionRisk)}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Entity Risk"
                  value={riskScores.entityRisk}
                  suffix="/100"
                  valueStyle={{
                    color: getRiskColor(riskScores.entityRisk)
                  }}
                />
                <Progress 
                  percent={riskScores.entityRisk}
                  status={riskScores.entityRisk > 70 ? 'exception' : 'normal'}
                  strokeColor={getRiskColor(riskScores.entityRisk)}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Jurisdiction Risk"
                  value={riskScores.jurisdictionRisk}
                  suffix="/100"
                  valueStyle={{
                    color: getRiskColor(riskScores.jurisdictionRisk)
                  }}
                />
                <Progress 
                  percent={riskScores.jurisdictionRisk}
                  status={riskScores.jurisdictionRisk > 70 ? 'exception' : 'normal'}
                  strokeColor={getRiskColor(riskScores.jurisdictionRisk)}
                />
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: '24px' }}>
            <Tabs defaultActiveKey="transaction">
              <TabPane tab="Transaction Risk Factors" key="transaction">
                <Table 
                  dataSource={riskScores.details.transaction}
                  columns={columns}
                  pagination={false}
                />
              </TabPane>
              <TabPane tab="Entity Risk Factors" key="entity">
                <Table 
                  dataSource={riskScores.details.entity}
                  columns={columns}
                  pagination={false}
                />
                {riskScores.entityInfo && (
                  <EntityDetails entityInfo={riskScores.entityInfo} />
                )}
              </TabPane>
              <TabPane tab="Jurisdiction Risk Factors" key="jurisdiction">
                <Table 
                  dataSource={riskScores.details.jurisdiction}
                  columns={columns}
                  pagination={false}
                />
              </TabPane>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
};

export default RiskScoring; 