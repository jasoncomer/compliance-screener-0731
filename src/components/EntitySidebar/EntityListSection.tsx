import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { SOT } from '../../typings/interfaces';
import { getEntityTypeLabel } from '../../utils/display-labels';
import { EEntityType } from '../../typings/SOT';
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

interface EntityListSectionProps {
  entities: SOT[];
  title: string;
  onSelectEntity: (entity: SOT) => void;
}

export const EntityListSection: React.FC<EntityListSectionProps> = ({
  entities,
  title,
  onSelectEntity
}) => {
  if (entities.length === 0) return null;

  return (
    <Section>
      <SectionTitle level={4}>{title} ({entities.length})</SectionTitle>
      <ScrollableSection>
        <EntityList>
          {entities.map((entity) => (
            <StyledCard key={entity._id} onClick={() => onSelectEntity(entity)}>
              <CardContent>
                <Avatar size="large" src={entity.logo} icon={!entity.logo && <UserOutlined />} />
                <EntityInfo>
                  <div className="entity-name">{entity.proper_name || entity.entity_id}</div>
                  <div className="entity-type">
                    {getEntityTypeLabel(entity.entity_type as EEntityType)}
                    {entity.associate_country_1 && ` • ${entity.associate_country_1}`}
                  </div>
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