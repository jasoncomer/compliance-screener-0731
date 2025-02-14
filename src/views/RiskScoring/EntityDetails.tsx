import React from 'react';
import { Card, Typography, Switch, Tag, Avatar, Space } from 'antd';
import { UserOutlined, GlobalOutlined, TwitterOutlined, SendOutlined, GithubOutlined, LinkedinOutlined, FacebookOutlined, InstagramOutlined, YoutubeOutlined, RedditOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { EntityInfo } from './types';

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

interface EntityDetailsProps {
  entityInfo: EntityInfo;
}

const EntityDetails: React.FC<EntityDetailsProps> = ({ entityInfo }) => {
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

export default EntityDetails; 