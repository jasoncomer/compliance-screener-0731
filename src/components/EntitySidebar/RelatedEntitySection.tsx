import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import {
  Section,
  SectionTitle,
  ScrollableSection,
  EntityList,
  StyledCard,
  CardContent,
  EntityInfo,
  ScrollMoreMessage
} from './styles';

interface RelatedEntitySectionProps {
  entities: string[];
  title: string;
  type: string;
}

export const RelatedEntitySection: React.FC<RelatedEntitySectionProps> = ({
  entities,
  title,
  type
}) => {
  if (entities.length === 0) return null;

  return (
    <Section>
      <SectionTitle level={4}>{title} ({entities.length})</SectionTitle>
      <ScrollableSection>
        <EntityList>
          {entities.map((entityName, idx) => (
            <StyledCard key={idx}>
              <CardContent>
                <Avatar size="large" icon={<UserOutlined />} />
                <EntityInfo>
                  <div className="entity-name">{entityName}</div>
                  <div className="entity-type">{type}</div>
                </EntityInfo>
              </CardContent>
            </StyledCard>
          ))}
        </EntityList>
      </ScrollableSection>
      {entities.length > 2 && <ScrollMoreMessage>Scroll for more</ScrollMoreMessage>}
    </Section>
  );
}; 