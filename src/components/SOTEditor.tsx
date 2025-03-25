import React, { useState } from 'react';
import { Card, Form, Button, Space, Typography, message, Avatar, Modal, Row, Col, Tag, Switch } from 'antd';
import { UserOutlined, GlobalOutlined, TwitterOutlined, SendOutlined, GithubOutlined, LinkedinOutlined, FacebookOutlined, InstagramOutlined, YoutubeOutlined, RedditOutlined, MediumOutlined, WarningOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { SOT } from '../typings/interfaces';
import { api } from '../api/api';
import AssociatedSOTs from './AssociatedSOTs';
import { getEntityTypeLabel } from '../utils/display-labels';
import { EEntityType } from '../typings/SOT';
import Input from './common/Input';
import { colors } from '../styles/variables';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';


const { Title, Text } = Typography;

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 24px;
  padding-bottom: 2em;
  margin-top: 3em;
`;

const EditorWrapper = styled(Card)`
  flex: 1;
`;

const AssociatedSOTsWrapper = styled(Card)`
  width: 340px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.theme === 'dark' ? '#141414' : '#fff'};
  max-height: 80vh;

  .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
    overflow: hidden;
    background-color: inherit;
  }
`;

const ButtonGroup = styled(Space)`
  margin-top: 24px;
`;

const DetailSection = styled.div`
  display: flex;
  gap: 24px;
  padding-bottom: 2em;
  text-align: left;
`;

const DetailColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  &:first-child {
    flex: 1;
  }
  
  &:last-child {
    flex: 1;
  }
`;

const DetailItem = styled.div`
  margin-bottom: 16px;
`;

const DetailLabel = styled(Text)`
  display: block;
  color: #666666;
  margin-bottom: 4px;
  font-size: 14px;
  text-align: left;
`;

const DetailValue = styled(Text)`
  font-size: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  text-align: left;
  
  .anticon {
    color: #1890ff;
  }
  
  a {
    color: #1890ff;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  &.address-line {
    text-align: left;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 1em;
  text-align: left;
`;

const HeaderInfo = styled.div`
  flex: 1;
  text-transform: capitalize;
  text-align: left;
`;

const StyledAvatar = styled(Avatar)`
  width: 64px;
  height: 64px;
`;

// Removed unused styled component

const SanctionedPill = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${colors.danger};
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  margin-top: 8px;
  margin-bottom: 12px;
  width: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  .anticon {
    margin-right: 6px;
    font-size: 14px;
  }
`;

const ScrollableWebsiteLinks = styled.div`
  max-height: 100px;
  overflow-y: auto;
`;

const ScrollableSocialLinks = styled.div`
  max-height: 100px;
  overflow-y: auto;
`;

interface SOTEditorProps {
  sot: SOT | null;
  onSelectAssociatedSot: (sot: SOT) => void;
}

const ToggleSwitch = ({ name, label }: { name: string; label: string }) => (
  <Form.Item
    name={name}
    label={label}
    valuePropName="checked"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <span>{/* Empty span to maintain spacing */}</span>
      <Switch />
    </div>
  </Form.Item>
);

const SOTEditor: React.FC<SOTEditorProps> = ({ sot, onSelectAssociatedSot }) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { itemsMap } = useSelector((state: RootState) => state.sot);
  
  console.log(sot);
  const isValidSOT = (sot: SOT | null): sot is SOT => {
    return sot !== null;
  };

  // Check if there are any associated entities
  const hasAssociatedEntities = (() => {
    if (!sot || !sot.parent_id || sot.parent_id === '') return false;
    
    const associatedSots = Object.values(itemsMap)
      .filter(item => item.parent_id === sot.parent_id)
      .filter(Boolean);
      
    return associatedSots.length > 0;
  })();

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!isValidSOT(sot)) return;
      Modal.confirm({
        title: 'Save Changes',
        content: 'Are you sure you want to save these changes?',
        onOk: async () => {
          try {
            setLoading(true);
            await api.sot.updateSOT(sot._id, values);
            setIsEditing(false);
            message.success('SOT updated successfully');
          } catch (error) {
            console.error('Failed to update SOT:', error);
            message.error('Failed to update SOT');
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getSocialMediaIcon = (url: string) => {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('github')) return <GithubOutlined />;
    if (urlLower.includes('twitter')) return <TwitterOutlined />;
    if (urlLower.includes('linkedin')) return <LinkedinOutlined />;
    if (urlLower.includes('facebook')) return <FacebookOutlined />;
    if (urlLower.includes('instagram')) return <InstagramOutlined />;
    if (urlLower.includes('youtube')) return <YoutubeOutlined />;
    if (urlLower.includes('reddit')) return <RedditOutlined />;
    if (urlLower.includes('medium')) return <MediumOutlined />;
    if (urlLower.includes('telegram')) return <SendOutlined />;

    return <GlobalOutlined />;
  };

  const renderContent = () => {
    if (!isValidSOT(sot)) return null;

    // Check if entity is an individual person
    // const isIndividualPerson = sot.entity_type?.toLowerCase() === EEntityType.INDIVIDUAL_PERSON;

    // Check if entity is OFAC sanctioned
    const isOfacSanctioned = Object.entries(sot)
      .filter(([key, value]) => key.startsWith('entity_tag') && value)
      .some(([_, value]) =>
        String(value).toLowerCase().includes('ofac') &&
        String(value).toLowerCase().includes('sanction')
      );

    if (isEditing) {
      return (
        <Form
          form={form}
          layout="vertical"
          initialValues={sot}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="proper_name" label="Company Name">
                <Input />
              </Form.Item>
              <Form.Item name="entity_id" label="Entity ID">
                <Input />
              </Form.Item>
              <Form.Item name="entity_type" label="Entity Type">
                <Input />
              </Form.Item>
              <Form.Item name="ceo" label="CEO">
                <Input />
              </Form.Item>
              <Form.Item name="key_personnel" label="Key Personnel">
                <Input placeholder="Comma-separated list of key personnel" />
              </Form.Item>
              <Form.Item name="ticker" label="Ticker">
                <Input placeholder="Comma-separated list of tickers" />
              </Form.Item>
              <Form.Item name="parent_id" label="Parent ID">
                <Input />
              </Form.Item>
              <Form.Item name="year_founded" label="Year Founded">
                <Input />
              </Form.Item>
              <Form.Item name="ens_address" label="ENS Address">
                <Input />
              </Form.Item>
              <Form.Item name="social_media_profile" label="Social Media">
                {[1, 2, 3, 4].map((num) => (
                  <Form.Item
                    key={`social_media_profile${num === 1 ? '' : '_' + num}`}
                    name={`social_media_profile${num === 1 ? '' : '_' + num}`}
                  >
                    <Input placeholder={`Social Media Profile ${num}`} />
                  </Form.Item>
                ))}
              </Form.Item>

              <ToggleSwitch name="no_kyc_req" label="No KYC Required" />
              <ToggleSwitch name="dead" label="Dead" />
              <ToggleSwitch name="centralized" label="Centralized" />
              <ToggleSwitch name="revisit_site" label="Revisit Site" />

              <Form.Item name="legal_info_url" label="Legal Info URL">
                <Input />
              </Form.Item>
              <Form.Item name="user" label="User">
                <Input />
              </Form.Item>
              <Form.Item name="date_updated" label="Date Updated">
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="url" label="Website">
                <Input />
              </Form.Item>
              <Form.Item name="contact_phone" label="Phone">
                <Input />
              </Form.Item>
              <Form.Item name="contact_address" label="Address">
                <Input />
              </Form.Item>
              <Form.Item name="contact_twitter" label="Twitter">
                <Input />
              </Form.Item>
              <Form.Item name="contact_telegram" label="Telegram">
                <Input />
              </Form.Item>
              <Form.Item name="contact_email" label="Email">
                <Input type="email" />
              </Form.Item>

              {/* Associated Countries */}
              <Form.Item label="Associated Countries">
                <Row gutter={16}>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <Col span={12} key={`country_${num}`}>
                      <Form.Item name={`associate_country_${num}`}>
                        <Input placeholder={`Country ${num}`} />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </Form.Item>

              <Form.Item name="logo" label="Logo URL">
                <Input />
              </Form.Item>

              <Form.Item label="Entity Tags">
                <Row gutter={16}>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <Col span={12} key={`tag_${num}`}>
                      <Form.Item name={`entity_tag${num}`}>
                        <Input placeholder={`Tag ${num}`} />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </Form.Item>

              <Form.Item name="description_merged" label="Description">
                <Input multiline rows={6} />
              </Form.Item>

              <Form.Item name="note" label="Notes">
                <Input multiline rows={4} />
              </Form.Item>
            </Col>
          </Row>

          <ButtonGroup>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              Save Changes
            </Button>
          </ButtonGroup>
        </Form>
      );
    }

    return (
      <>
        <HeaderSection>
          <StyledAvatar
            src={sot.logo}
            icon={!sot.logo && <UserOutlined />}
          />
          <HeaderInfo>
            <Title level={4} style={{ margin: 0 }}>{sot.proper_name || sot.entity_id}</Title>
            <div style={{ display: 'block', marginBottom: '4px' }}>
              <Text type="secondary">{getEntityTypeLabel(sot.entity_type as EEntityType)}</Text>
            </div>


            {isOfacSanctioned && sot.no_kyc_req && (
              <SanctionedPill>
                <WarningOutlined />
                THIS ENTITY IS SANCTIONED BY OFAC
              </SanctionedPill>
            )}
            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sot.dead && (
                <span>
                  <Text strong style={{ color: colors.danger }}>
                    Entity likely inactive or does not support Crypto
                  </Text>
                </span>
              )}
              {sot.centralized === false && (
                <span>
                  <Text strong style={{ color: colors.secondary, marginBottom: '0' }}>
                    Decentralized Entity
                  </Text>
                </span>
              )}
              {(sot.centralized === null || sot.centralized === undefined) && (
                <span>
                  <Text strong style={{ color: colors.warning, marginBottom: '0' }}>
                    this is null
                  </Text>
                </span>
              )}
              {/* Debug information */}
              <span style={{ fontSize: '0.8em', color: '#666' }}>
                <strong>Debug - Centralized:</strong> Value: {String(sot.centralized)}, Type: {typeof sot.centralized}
              </span>
              {sot.no_kyc_req && (
                <span>
                  <Text strong style={{ color: colors.primary, marginTop: '0' }}>
                    NO KYC REQUIRED
                  </Text>
                </span>
              )}
            </div>
          </HeaderInfo>
        </HeaderSection>

        <DetailSection>
          {/* Left Column */}
          <DetailColumn>
            {/* Entity ID */}
            <DetailItem>
              <DetailLabel>Entity ID</DetailLabel>

              <DetailValue>
                <span>{sot.entity_id}</span>
              </DetailValue>
            </DetailItem>

            {/* Leadership */}
            {(sot.ceo || sot.key_personnel) && (
              <DetailItem>
                <DetailLabel>Leadership</DetailLabel>
                <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sot.ceo && <span><strong>CEO:</strong> {sot.ceo}</span>}
                  {sot.key_personnel && (
                    <span>
                      <strong>Key Personnel:</strong>{' '}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {sot.key_personnel.split(',').map(person =>
                          <Tag key={person.trim()}>{person.trim()}</Tag>
                        )}
                      </div>
                    </span>
                  )}
                </DetailValue>
              </DetailItem>
            )}

            {/* Contact Information */}
            {(sot.contact_email || sot.contact_phone || sot.contact_address || sot.ens_address) && (
              <DetailItem>
                <DetailLabel>Contact Information</DetailLabel>
                <DetailValue style={{ display: 'flex', flexDirection: 'column', width: '80%', gap: '8px' }}>
                  {sot.contact_email && <span><strong>Email:</strong> {sot.contact_email}</span>}
                  {sot.contact_phone && <span><strong>Phone:</strong> {sot.contact_phone}</span>}
                  {sot.contact_address && <span><strong>Address:</strong> {sot.contact_address}</span>}
                  {sot.ens_address && <span><strong>ENS Address:</strong> {sot.ens_address}</span>}
                </DetailValue>
              </DetailItem>
            )}

            {/* Additional Information */}
            {(sot.year_founded || sot.ticker || sot.parent_id ||
              Object.entries(sot).some(([key, value]) => key.startsWith('associate_country_') && value) ||
              sot.legal_info_url) && (
                <DetailItem>
                  <DetailLabel>Additional Information</DetailLabel>
                  <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sot.year_founded && <span><strong>Founded:</strong> {sot.year_founded}</span>}
                    {sot.ticker && (
                      <span>
                        <strong>Ticker:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {sot.ticker.split(',').map(t =>
                            <Tag key={t.trim()}>{t.trim()}</Tag>
                          )}
                        </div>
                      </span>
                    )}
                    {sot.parent_id && <span><strong>Parent ID:</strong> {sot.parent_id}</span>}

                    {/* Associated Countries */}
                    {Object.entries(sot)
                      .filter(([key, value]) => key.startsWith('associate_country_') && value)
                      .length > 0 && (
                        <span>
                          <strong>Associated Countries:</strong>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {Object.entries(sot)
                              .filter(([key, value]) => key.startsWith('associate_country_') && value)
                              .map(([key, value]) => (
                                <Tag key={key}>{value}</Tag>
                              ))}
                          </div>
                        </span>
                      )}

                    {sot.legal_info_url && (
                      <span style={{ marginTop: '48px', display: 'block' }}>
                        <strong>Legal Info: </strong>
                        <a href={sot.legal_info_url} target="_blank" rel="noopener noreferrer">
                          <GlobalOutlined /> View Legal Information
                        </a>
                      </span>
                    )}
                  </DetailValue>
                </DetailItem>
              )}

            {/* Metadata - moved to bottom of left column */}
            {(sot.user || sot.date_updated || sot.revisit_site) && (
              <DetailItem style={{ fontSize: '0.9em', color: '#666', marginTop: '12px' }}>
                {sot.user && <div>Last modified by: {sot.user}</div>}
                {sot.date_updated && <div>Updated: {new Date(sot.date_updated).toLocaleString()}</div>}
                {sot.revisit_site && <div>Flagged for review</div>}
              </DetailItem>
            )}
          </DetailColumn>

          {/* Right Column */}
          <DetailColumn>
            {/* Website */}
            <DetailItem>
              <DetailLabel>Website</DetailLabel>
              <DetailValue>
                {sot.url ? (
                  (() => {
                    // Collect all website URLs
                    const websiteUrls = [];

                    // Add main URL if exists
                    if (sot.url) {
                      websiteUrls.push(sot.url);
                    }

                    // Check for additional URLs in other fields
                    Object.entries(sot)
                      .filter(([key, value]) =>
                        (key.startsWith('url_') || key.startsWith('website_') || key.startsWith('alternate_url_')) &&
                        value &&
                        typeof value === 'string')
                      .forEach(([_, value]) => {
                        websiteUrls.push(value);
                      });

                    // Determine if we need a scrollable container
                    const needsScroll = websiteUrls.length > 5;

                    // Create URL components array
                    const urlComponents = websiteUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url.startsWith('http') ? url : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <GlobalOutlined />
                        <span>{url}</span>
                      </a>
                    ));

                    // Render links in scrollable container if needed
                    if (needsScroll) {
                      return (
                        <div>
                          <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
                            {websiteUrls.length} websites available (scroll to view all)
                          </Text>
                          <ScrollableWebsiteLinks>
                            {urlComponents}
                          </ScrollableWebsiteLinks>
                        </div>
                      );
                    }

                    // Otherwise render normally
                    return urlComponents.length === 1 ? (
                      <>
                        <GlobalOutlined />
                        <a href={websiteUrls[0].startsWith('http') ? websiteUrls[0] : `https://${websiteUrls[0]}`} target="_blank" rel="noopener noreferrer">
                          {websiteUrls[0]}
                        </a>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {urlComponents}
                      </div>
                    );
                  })()
                ) : (
                  <Text type="secondary">No website available</Text>
                )}
              </DetailValue>
            </DetailItem>

            {/* Social Media Profiles */}
            {(sot.contact_twitter || sot.contact_telegram ||
              Object.entries(sot).some(([key, value]) => key.startsWith('social_media_profile') && value)) && (
                <DetailItem>
                  <DetailLabel>Social Media Profiles</DetailLabel>
                  <DetailValue style={{ display: 'block' }}>
                    {(() => {
                      // Count total social media links
                      const socialMediaCount = [
                        sot.contact_twitter,
                        sot.contact_telegram,
                        ...Object.entries(sot)
                          .filter(([key, value]) => key.startsWith('social_media_profile') && value)
                          .map(([_, value]) => value)
                      ].filter(Boolean).length;

                      // Determine if we need a scrollable container
                      const needsScroll = socialMediaCount > 5;

                      // Create array of all social media links components
                      const socialMediaLinks = [];

                      // Add Twitter link
                      if (sot.contact_twitter) {
                        socialMediaLinks.push(
                          <a
                            key="twitter"
                            href={`https://twitter.com/${sot.contact_twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <TwitterOutlined />
                            <span>{sot.contact_twitter}</span>
                          </a>
                        );
                      }

                      // Add Telegram link
                      if (sot.contact_telegram) {
                        socialMediaLinks.push(
                          <a
                            key="telegram"
                            href={`https://t.me/${sot.contact_telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <SendOutlined />
                            <span>{sot.contact_telegram}</span>
                          </a>
                        );
                      }

                      // Add other social media profile links
                      Object.entries(sot)
                        .filter(([key, value]) => key.startsWith('social_media_profile') && value)
                        .forEach(([key, value]) => {
                          const icon = getSocialMediaIcon(value);
                          const url = value.startsWith('http') ? value : `https://${value}`;

                          socialMediaLinks.push(
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                              {icon}
                              <span>{value}</span>
                            </a>
                          );
                        });

                      // Render links in scrollable container if needed
                      if (needsScroll) {
                        return (
                          <div>
                            <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
                              {socialMediaCount} profiles available (scroll to view all)
                            </Text>
                            <ScrollableSocialLinks>
                              {socialMediaLinks}
                            </ScrollableSocialLinks>
                          </div>
                        );
                      }

                      // Otherwise render normally
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {socialMediaLinks}
                        </div>
                      );
                    })()}
                  </DetailValue>
                </DetailItem>
              )}
          </DetailColumn>
        </DetailSection>
      </>
    );
  };

  return (
    <Container>
      <EditorWrapper>
        {renderContent()}
      </EditorWrapper>

      {hasAssociatedEntities && (
        <AssociatedSOTsWrapper>
          <AssociatedSOTs
            sot={sot}
            onSelectSot={onSelectAssociatedSot}
          />
        </AssociatedSOTsWrapper>
      )}
    </Container>
  );
};

export default SOTEditor; 