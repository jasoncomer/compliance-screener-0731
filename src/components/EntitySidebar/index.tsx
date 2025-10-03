import React, { useEffect, useState } from 'react';

import { User } from 'lucide-react';
import { useSelector } from 'react-redux';

import { api } from '../../api/api';
import { RootState } from '../../store/store';
import { SOT } from '../../typings/interfaces';
import { SimpleLogo } from '../common/Logo';

import { EntityListSection } from './EntityListSection';
import { cn, getSpacing } from '@/design-system/utils';
import { Card } from '../ui/card';

// Explicitly declare the props matching the interface
interface Props {
  associatedSots: SOT[] | null;
  currentEntityId?: string;
  onSelectSot: (sot: SOT) => void;
}

interface RelatedEntities {
  unique_bos: string[];
  unique_custodians: string[];
}

interface EntityOwnership {
  entity: string;
  relationship_types: string[];
  count: number;
}

const EntitySidebar: React.FC<Props> = ({ currentEntityId, onSelectSot }) => {
  const { itemsMap } = useSelector((state: RootState) => state.sot);
  const [relatedEntities, setRelatedEntities] = useState<RelatedEntities | null>(null);
  const [reverseRelationships, setReverseRelationships] = useState<EntityOwnership[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentEntityId) return;

    setIsLoading(true);

    // Simple parallel fetch for both forward and reverse relationships
    Promise.allSettled([
      api.sot.getRelatedEntities(currentEntityId),
      api.sot.getEntitiesWhereBeneficialOwner(currentEntityId)
    ]).then(([relatedData, reverseData]) => {
      // Handle related entities
      if (relatedData.status === 'fulfilled') {
        setRelatedEntities(relatedData.value);
      } else {
        console.error('Failed to fetch related entities:', relatedData.reason);
        setRelatedEntities(null);
      }

      // Handle reverse relationships
      if (reverseData.status === 'fulfilled') {
        setReverseRelationships(reverseData.value);
      } else {
        console.error('Failed to fetch reverse relationships:', reverseData.reason);
        setReverseRelationships([]);
      }
    }).finally(() => {
      setIsLoading(false);
    });
  }, [currentEntityId]);

  if (!itemsMap || !currentEntityId) {
    return null;
  }

  const currentEntity = Object.values(itemsMap).find(sot => sot.entity_id === currentEntityId);
  if (!currentEntity) {
    return null;
  }

  // Show loading animation while data is being fetched
  if (isLoading) {
    return (
      <Card className={cn(
        "flex flex-col h-full overflow-hidden w-80",
        getSpacing('card', 'compact'),
        "max-h-[calc(100vh-200px)] min-h-[400px]"
      )}>
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Loading entity relationships...
          </p>
        </div>
      </Card>
    );
  }

  const parentEntityKey = Object.keys(itemsMap).find(key => itemsMap[key].entity_id === currentEntity.parent_id);
  const parentEntity = parentEntityKey ? itemsMap[parentEntityKey] : null;
  const isParentEntity = !currentEntity.parent_id;
  const childEntities = isParentEntity ? Object.values(itemsMap).filter(sot => sot.parent_id === currentEntityId) : [];
  const siblingEntities = !isParentEntity ? Object.values(itemsMap).filter(sot => sot.parent_id === currentEntity.parent_id && sot.entity_id !== currentEntityId && sot.entity_id !== parentEntity?.entity_id) : [];

  // Get custodian entities from related entities (these are entity names, not IDs)
  // Filter out the current entity so it doesn't show itself as a custodian
  const custodianEntities = (relatedEntities?.unique_custodians || []).filter(entityName => {
    const currentEntityName = currentEntity.proper_name?.toLowerCase();
    const currentEntityId = currentEntity.entity_id?.toLowerCase();
    const entityNameLower = entityName.toLowerCase();
    
    // Don't show the current entity as its own custodian
    return entityNameLower !== currentEntityName && entityNameLower !== currentEntityId;
  });

  // Get beneficial owner entities from related entities (these are entity names, not IDs)
  // Filter out the current entity so it doesn't show itself as a beneficial owner
  const beneficialOwnerEntities = (relatedEntities?.unique_bos || []).filter(entityName => {
    const currentEntityName = currentEntity.proper_name?.toLowerCase();
    const currentEntityId = currentEntity.entity_id?.toLowerCase();
    const entityNameLower = entityName.toLowerCase();
    
    // Don't show the current entity as its own beneficial owner
    return entityNameLower !== currentEntityName && entityNameLower !== currentEntityId;
  });

  // Helper function to find entity by name in SOT data
  const findEntityByName = (entityName: string): SOT | null => {
    return Object.values(itemsMap).find(sot => 
      sot.proper_name?.toLowerCase() === entityName.toLowerCase() ||
      sot.entity_id?.toLowerCase() === entityName.toLowerCase()
    ) || null;
  };

  // Handle card click for beneficial owners and custodians
  const handleCardClick = (entityName: string) => {
    const entity = findEntityByName(entityName);
    if (entity) {
      onSelectSot(entity);
    }
  };

  // Process reverse relationships (entities where current entity is a beneficial owner/custodian)
  const ownedEntities = (reverseRelationships || []).map(ownership => {
    const entity = findEntityByName(ownership.entity);
    return {
      ...ownership,
      entityData: entity,
      isClickable: !!entity
    };
  }).filter(ownership => {
    // Filter out self-references
    return !(
      ownership.entity === currentEntity.proper_name ||
      ownership.entity === currentEntity.entity_id ||
      (ownership.entityData && ownership.entityData.entity_id === currentEntityId)
    );
  });

  // Check if sidebar has any content to display
  const hasParent = !!parentEntity;
  const hasChildren = isParentEntity && childEntities.length > 0;
  const hasSiblings = !isParentEntity && siblingEntities.length > 0;
  const hasCustodians = custodianEntities.length > 0;
  const hasBeneficialOwners = beneficialOwnerEntities.length > 0;
  const hasOwnedEntities = ownedEntities.length > 0;
  
  const hasContent = hasParent || hasChildren || hasSiblings || hasCustodians || hasBeneficialOwners || hasOwnedEntities;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden w-80", // Set fixed width to 320px (w-80)
      getSpacing('card', 'compact'), // p-4 for compact card padding
      "max-h-[calc(100vh-200px)] min-h-[400px]"
    )}>
      <div className={cn(
        "flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
        "pr-1", // Reduced from pr-2 to pr-1 for better spacing
        "max-h-[calc(100vh-250px)] min-h-[350px]",
        "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
        "scrollbar-track-transparent"
      )}>
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
        
        {/* Custodian Addresses Section */}
        {custodianEntities.length > 0 && (
          <div className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-base font-medium m-0">Custodian Addresses ({custodianEntities.length})</h4>
            </div>
            <div className="overflow-y-auto overflow-x-hidden max-h-64 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <div className="flex flex-col gap-2 pr-2">
                {custodianEntities.map((entityName, index) => {
                  const entity = findEntityByName(entityName);
                  const isClickable = !!entity;
                  
                  return (
                    <div
                      key={`custodian-${index}`}
                      onClick={() => handleCardClick(entityName)}
                      className={`
                        transition-all duration-300 rounded-lg border p-3
                        ${isClickable 
                          ? 'cursor-pointer bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:shadow-[0_0_0_1px_#e87e4f,0_0_8px_rgba(232,126,79,0.3)] hover:border-orange-500 dark:hover:border-orange-500' 
                          : 'cursor-default bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75'
                        }
                      `}
                      title={isClickable ? `Click to view ${entityName} profile` : `${entityName} not found in database`}
                    >
                      <div className="flex items-center gap-3">
                        <SimpleLogo
                          entityId={entity?.entity_id}
                          entityType={entity?.entity_type}
                          size="default"
                          fallbackIcon={<User className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{entity?.proper_name || entityName}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Custodian
                            {!isClickable && ' (Not in database)'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Beneficial Owners Section */}
        {beneficialOwnerEntities.length > 0 && (
          <div className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-base font-medium m-0">Beneficial Owners ({beneficialOwnerEntities.length})</h4>
            </div>
            <div className="overflow-y-auto overflow-x-hidden max-h-64 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <div className="flex flex-col gap-2 pr-2">
                {beneficialOwnerEntities.map((entityName, index) => {
                  const entity = findEntityByName(entityName);
                  const isClickable = !!entity;
                  
                  return (
                    <div
                      key={`beneficial-owner-${index}`}
                      onClick={() => handleCardClick(entityName)}
                      className={`
                        transition-all duration-300 rounded-lg border p-3
                        ${isClickable 
                          ? 'cursor-pointer bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:shadow-[0_0_0_1px_#e87e4f,0_0_8px_rgba(232,126,79,0.3)] hover:border-orange-500 dark:hover:border-orange-500' 
                          : 'cursor-default bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75'
                        }
                      `}
                      title={isClickable ? `Click to view ${entityName} profile` : `${entityName} not found in database`}
                    >
                      <div className="flex items-center gap-3">
                        <SimpleLogo
                          entityId={entity?.entity_id}
                          entityType={entity?.entity_type}
                          size="default"
                          fallbackIcon={<User className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{entity?.proper_name || entityName}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Beneficial Owner
                            {!isClickable && ' (Not in database)'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Custodial Entities Section - Shows entities where current entity is a beneficial owner/custodian */}
        {ownedEntities.length > 0 && (
          <div className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-base font-medium m-0">Custodial Entities ({ownedEntities.length})</h4>
            </div>
            <div className="overflow-y-auto overflow-x-hidden max-h-64 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <div className="flex flex-col gap-2 pr-2">
                {ownedEntities.map((ownership, index) => {
                  const { entity, entityData, isClickable, relationship_types, count } = ownership;
                  
                  // Determine the relationship label
                  const getRelationshipLabel = (types: string[]) => {
                    if (types.includes('both')) return 'Beneficial Owner & Custodian';
                    if (types.includes('beneficial_owner')) return 'Beneficial Owner';
                    if (types.includes('custodian')) return 'Custodian';
                    return 'Related Entity';
                  };
                  
                  return (
                    <div
                      key={`owned-entity-${index}`}
                      onClick={() => isClickable ? handleCardClick(entity) : undefined}
                      className={`
                        transition-all duration-300 rounded-lg border p-3
                        ${isClickable 
                          ? 'cursor-pointer bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:shadow-[0_0_0_1px_#e87e4f,0_0_8px_rgba(232,126,79,0.3)] hover:border-orange-500 dark:hover:border-orange-500' 
                          : 'cursor-default bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75'
                        }
                      `}
                      title={isClickable ? `Click to view ${entity} profile` : `${entity} not found in database`}
                    >
                      <div className="flex items-center gap-3">
                        <SimpleLogo
                          entityId={entityData?.entity_id}
                          entityType={entityData?.entity_type}
                          size="default"
                          fallbackIcon={<User className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{entityData?.proper_name || entity}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {getRelationshipLabel(relationship_types)}
                            {count > 1 && ` (${count} addresses)`}
                            {!isClickable && ' (Not in database)'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EntitySidebar; 