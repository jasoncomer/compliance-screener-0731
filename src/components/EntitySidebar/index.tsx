import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { api } from '../../api/api';
import { RelatedEntities } from './types';
import { SidebarCard, ScrollableContent } from './styles';
import { EntityListSection } from './EntityListSection';
import { RelatedEntitySection } from './RelatedEntitySection';
import { SOT } from '../../typings/interfaces';

// Explicitly declare the props matching the interface
interface Props {
  associatedSots: SOT[] | null;
  currentEntityId?: string;
  onSelectSot: (sot: SOT) => void;
}

const EntitySidebar: React.FC<Props> = ({ associatedSots, currentEntityId, onSelectSot }) => {
  const { itemsMap } = useSelector((state: RootState) => state.sot);
  const [relatedEntities, setRelatedEntities] = React.useState<RelatedEntities | null>(null);

  React.useEffect(() => {
    if (currentEntityId) {
      api.sot.getRelatedEntities(currentEntityId)
        .then(setRelatedEntities)
        .catch(() => setRelatedEntities(null));
    }
  }, [currentEntityId]);

  if (!itemsMap || !currentEntityId) return null;

  const currentEntity = Object.values(itemsMap).find(sot => sot.entity_id === currentEntityId);
  if (!currentEntity) return null;

  const parentEntityKey = Object.keys(itemsMap).find(key => itemsMap[key].entity_id === currentEntity.parent_id);
  const parentEntity = parentEntityKey ? itemsMap[parentEntityKey] : null;
  const isParentEntity = !currentEntity.parent_id;
  const childEntities = isParentEntity ? Object.values(itemsMap).filter(sot => sot.parent_id === currentEntityId) : [];
  const siblingEntities = !isParentEntity ? Object.values(itemsMap).filter(sot => sot.parent_id === currentEntity.parent_id && sot.entity_id !== currentEntityId && sot.entity_id !== parentEntity?.entity_id) : [];

  const hasContent = Boolean(
    parentEntity ||
    (isParentEntity && childEntities.length > 0) ||
    (!isParentEntity && siblingEntities.length > 0) ||
    (relatedEntities?.unique_custodians && relatedEntities.unique_custodians.length > 0) ||
    (relatedEntities?.unique_bos && relatedEntities.unique_bos.length > 0) ||
    (associatedSots && associatedSots.length > 0)
  );

  if (!hasContent) return null;

  return (
    <SidebarCard $hasContent={hasContent}>
      <ScrollableContent>
        {parentEntity && (
          <EntityListSection
            entities={[parentEntity]}
            title="Parent Entity"
            onSelectEntity={onSelectSot}
          />
        )}
        {isParentEntity ? (
          childEntities.length > 0 && (
            <EntityListSection
              entities={childEntities}
              title="Associated Entities"
              onSelectEntity={onSelectSot}
            />
          )
        ) : (
          siblingEntities.length > 0 && (
            <EntityListSection
              entities={siblingEntities}
              title="Associated Entities"
              onSelectEntity={onSelectSot}
            />
          )
        )}
        
        {associatedSots && associatedSots.length > 0 && (
          <EntityListSection
            entities={associatedSots}
            title="Related Entities"
            onSelectEntity={onSelectSot}
          />
        )}
        
        {relatedEntities?.unique_custodians && relatedEntities.unique_custodians.length > 0 && (
          <RelatedEntitySection
            entities={relatedEntities.unique_custodians}
            title="Custodian"
            type="Custodian"
          />
        )}
        {relatedEntities?.unique_bos && relatedEntities.unique_bos.length > 0 && (
          <RelatedEntitySection
            entities={relatedEntities.unique_bos}
            title="Beneficial Owner"
            type="Beneficial Owner"
          />
        )}
      </ScrollableContent>
    </SidebarCard>
  );
};

export default EntitySidebar; 