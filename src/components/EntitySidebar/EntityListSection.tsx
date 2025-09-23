import React from 'react';

import { SOT } from '../../typings/interfaces';
import { EEntityType } from '../../typings/SOT';
import { getEntityTypeLabel } from '../../utils/display-labels';
import { SimpleLogo } from '../common/Logo';

import {
  CardContent,
  EntityInfo,
  EntityList,
  ScrollableSection,
  ScrollMoreMessage,
  Section,
  SectionTitle,
  StyledCard} from './styles';

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
                <SimpleLogo
                  entityId={entity.entity_id}
                  entityType={entity.entity_type}
                  size="large"
                  style={{ flexShrink: 0 }}
                />
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