import React from 'react';

import { Card, Typography, Tag, Avatar } from 'antd';
import { UserOutlined, GlobalOutlined, TwitterOutlined, SendOutlined, GithubOutlined, LinkedinOutlined, FacebookOutlined, InstagramOutlined, YoutubeOutlined, RedditOutlined, WarningOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { SOTV2 } from '../../typings/interfaces';
import { colors } from '../../styles/variables';

const { Title, Text } = Typography;

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


const ScrollableSocialLinks = styled.div`
  max-height: 100px;
  overflow-y: auto;
`;

interface EntityDetailsProps {
  sot: SOTV2;
}

const EntityDetails: React.FC<EntityDetailsProps> = ({ sot }) => {
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

  // Check if entity is OFAC sanctioned
  const isOfacSanctioned = sot.entity_tags?.some(tag => 
    tag.toLowerCase().includes('ofac') && tag.toLowerCase().includes('sanction')
  );

  return (
    <Card style={{ border: 'none', marginTop: '24px' }}>
      <HeaderSection >
        <StyledAvatar
          src={sot.logo}
          icon={!sot.logo && <UserOutlined />}
        />
        <HeaderInfo>
          <Title level={4} style={{ margin: 0 }}>{sot.proper_name || sot.entity_id}</Title>
          <div style={{ display: 'block', marginBottom: '4px' }}>
            <Text type="secondary">{sot.entity_type}</Text>
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

          {/* Description */}
          {sot.description_merged && (
            <DetailItem>
              <DetailLabel>Description</DetailLabel>
              <DetailValue style={{ whiteSpace: 'pre-wrap', width: '70%' }}>
                {sot.description_merged}
              </DetailValue>
            </DetailItem>
          )}

          {/* Contact Information */}
          {(sot.contact_email || sot.contact_phone || sot.contact_address || sot.ens_address) && (
            <DetailItem>
              <DetailLabel>Contact Information</DetailLabel>
              <DetailValue style={{ display: 'flex', flexDirection: 'column', width: '70%', gap: '8px' }}>
                {sot.contact_email && <span><strong>Email:</strong> {sot.contact_email}</span>}
                {sot.contact_phone && <span><strong>Phone:</strong> {sot.contact_phone}</span>}
                {sot.contact_address && <span><strong>Address:</strong> {sot.contact_address}</span>}
                {sot.ens_address && <span><strong>ENS Address:</strong> {sot.ens_address}</span>}
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

          {/* Metadata */}
          {(sot.user || sot.date_updated || sot.revisit_site) && (
            <DetailItem style={{ fontSize: '0.9em', color: '#666', marginTop: '0px' }}>
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
                <a href={sot.url.startsWith('http') ? sot.url : `https://${sot.url}`} 
                   target="_blank" 
                   rel="noopener noreferrer">
                  <GlobalOutlined />
                  {sot.url}
                </a>
              ) : (
                <Text type="secondary">No website available</Text>
              )}
            </DetailValue>
          </DetailItem>

          {/* Social Media Profiles */}
          {(sot.contact_twitter || sot.contact_telegram || sot.social_media_profiles?.length > 0) && (
            <DetailItem>
              <DetailLabel>Social Media Profiles</DetailLabel>
              <DetailValue style={{ display: 'block' }}>
                {(() => {
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
                  sot.social_media_profiles?.forEach((profile, index) => {
                    const icon = getSocialMediaIcon(profile);
                    const url = profile.startsWith('http') ? profile : `https://${profile}`;

                    socialMediaLinks.push(
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {icon}
                        <span>{profile}</span>
                      </a>
                    );
                  });

                  // Determine if we need a scrollable container
                  const needsScroll = socialMediaLinks.length > 5;

                  if (needsScroll) {
                    return (
                      <div>
                        <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
                          {socialMediaLinks.length} profiles available (scroll to view all)
                        </Text>
                        <ScrollableSocialLinks>
                          {socialMediaLinks}
                        </ScrollableSocialLinks>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {socialMediaLinks}
                    </div>
                  );
                })()}
              </DetailValue>
            </DetailItem>
          )}

          {/* Additional Information */}
          {(sot.year_founded || sot.ticker || sot.parent_id || sot.associated_countries?.length > 0) && (
            <DetailItem>
              <DetailLabel style={{ marginTop: '24px' }}>Additional Information</DetailLabel>
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
                {sot.associated_countries && sot.associated_countries.length > 0 && (
                  <span>
                    <strong>Associated Countries:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {sot.associated_countries.map((country, index) => (
                        <Tag key={index}>{country}</Tag>
                      ))}
                    </div>
                  </span>
                )}
              </DetailValue>
            </DetailItem>
          )}
        </DetailColumn>
      </DetailSection>
    </Card>
  );
};

export default EntityDetails; 