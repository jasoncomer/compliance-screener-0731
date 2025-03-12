import React from 'react';
import { Card, Typography, Switch, Tag, Avatar } from 'antd';
import { UserOutlined, GlobalOutlined, TwitterOutlined, SendOutlined, GithubOutlined, LinkedinOutlined, FacebookOutlined, InstagramOutlined, YoutubeOutlined, RedditOutlined, WarningOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { SOTV2 } from '../../typings/interfaces';
import { colors } from '../../styles/variables';
import { EEntityType } from '../../typings/SOT';

const { Title, Text } = Typography;

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

  // Check if entity is an individual person
  const isIndividualPerson = sot.entity_type?.toLowerCase() === EEntityType.INDIVIDUAL_PERSON;
  
  // Check if entity is OFAC sanctioned
  const isOfacSanctioned = sot.entity_tags?.some(tag => 
    tag.toLowerCase().includes('ofac') && tag.toLowerCase().includes('sanction')
  );

  return (
    <Card style={{ marginTop: '24px' }}>
      <HeaderSection>
        <StyledAvatar
          src={sot.logo}
          icon={!sot.logo && <UserOutlined />}
        />
        <HeaderInfo>
          <Title level={4} style={{ margin: 0 }}>{sot.proper_name || sot.entity_id}</Title>
          <div style={{ display: 'block', marginBottom: '8px' }}>
            <Text type="secondary">{sot.entity_type}</Text>
          </div>
          {isOfacSanctioned && (
            <SanctionedPill>
              <WarningOutlined />
              THIS ENTITY IS SANCTIONED BY OFAC
            </SanctionedPill>
          )}
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {sot.dead && (
              <span>
                <Text>Status: </Text>
                <Text strong style={{ color: colors.danger }}>
                  Inactive
                </Text>
              </span>
            )}
            <span>
              <Text>Architecture: </Text>
              <Text strong style={{ color: sot.centralized ? colors.primary : colors.secondary }}>
                {sot.centralized ? 'Centralized' : 'Decentralized'}
              </Text>
            </span>
            {!isIndividualPerson && (
              <span>
                <Text>KYC: </Text>
                <Text strong style={{ color: sot.no_kyc_req ? colors.danger : colors.success }}>
                  {sot.no_kyc_req ? 'Not Required' : 'Required'}
                </Text>
              </span>
            )}
          </div>
        </HeaderInfo>
      </HeaderSection>

      <DetailSection>
        {sot.url && (
          <DetailItem>
            <DetailLabel>Website</DetailLabel>
            <DetailValue>
              <GlobalOutlined />
              <a href={sot.url.startsWith('http') ? sot.url : `https://${sot.url}`} 
                 target="_blank" 
                 rel="noopener noreferrer">
                {sot.url}
              </a>
            </DetailValue>
          </DetailItem>
        )}

        {(sot.ceo || sot.key_personnel) && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Leadership</DetailLabel>
            <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sot.ceo && <span><strong>CEO:</strong> {sot.ceo}</span>}
              {sot.key_personnel && (
                <span>
                  <strong>Key Personnel:</strong>{' '}
                  {sot.key_personnel.split(',').map(person =>
                    <Tag key={person.trim()}>{person.trim()}</Tag>
                  )}
                </span>
              )}
            </DetailValue>
          </DetailItem>
        )}

        {(sot.contact_email || sot.contact_phone || sot.contact_address) && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Contact Information</DetailLabel>
            <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sot.contact_email && <span><strong>Email:</strong> {sot.contact_email}</span>}
              {sot.contact_phone && <span><strong>Phone:</strong> {sot.contact_phone}</span>}
              {sot.contact_address && <span><strong>Address:</strong> {sot.contact_address}</span>}
            </DetailValue>
          </DetailItem>
        )}

        {sot.entity_tags && sot.entity_tags.length > 0 && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Tags</DetailLabel>
            <TagsContainer>
              {sot.entity_tags.map((tag, index) => (
                <Tag key={index} color="blue" style={{ padding: '4px 8px', borderRadius: '16px' }}>
                  {tag}
                </Tag>
              ))}
            </TagsContainer>
          </DetailItem>
        )}

        {sot.description_merged && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Description</DetailLabel>
            <DetailValue style={{ whiteSpace: 'pre-wrap' }}>
              {sot.description_merged}
            </DetailValue>
          </DetailItem>
        )}

        {sot.associated_countries && sot.associated_countries.length > 0 && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Associated Countries</DetailLabel>
            <TagsContainer>
              {sot.associated_countries.map((country, index) => (
                <Tag key={index}>{country}</Tag>
              ))}
            </TagsContainer>
          </DetailItem>
        )}

        {(sot.contact_twitter || sot.contact_telegram || (sot.social_media_profiles && sot.social_media_profiles.length > 0)) && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Social Media</DetailLabel>
            <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sot.contact_twitter && (
                <a href={`https://twitter.com/${sot.contact_twitter.replace('@', '')}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TwitterOutlined />
                  <span>{sot.contact_twitter}</span>
                </a>
              )}
              {sot.contact_telegram && (
                <a href={`https://t.me/${sot.contact_telegram.replace('@', '')}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SendOutlined />
                  <span>{sot.contact_telegram}</span>
                </a>
              )}
              {sot.social_media_profiles && sot.social_media_profiles.map((profile, index) => {
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

export default EntityDetails; 