import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { User } from 'lucide-react';
import { RootState } from '../../store/store';
import { SidebarCard, ScrollableContent } from './styles';
import { EntityListSection } from './EntityListSection';
import { SOT } from '../../typings/interfaces';
import { api } from '../../api/api';

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

const EntitySidebar: React.FC<Props> = ({ currentEntityId, onSelectSot }) => {
  const { itemsMap } = useSelector((state: RootState) => state.sot);
  const [relatedEntities, setRelatedEntities] = useState<RelatedEntities | null>(null);

  useEffect(() => {
    const fetchRelatedEntities = async () => {
      if (!currentEntityId) return;
      
      try {
        const data = await api.sot.getRelatedEntities(currentEntityId);
        setRelatedEntities(data);
      } catch (error) {
        setRelatedEntities(null);
      }
    };

    fetchRelatedEntities();
  }, [currentEntityId]);

  if (!itemsMap || !currentEntityId) {
    return null;
  }

  const currentEntity = Object.values(itemsMap).find(sot => sot.entity_id === currentEntityId);
  if (!currentEntity) {
    return null;
  }

  const parentEntityKey = Object.keys(itemsMap).find(key => itemsMap[key].entity_id === currentEntity.parent_id);
  const parentEntity = parentEntityKey ? itemsMap[parentEntityKey] : null;
  const isParentEntity = !currentEntity.parent_id;
  const childEntities = isParentEntity ? Object.values(itemsMap).filter(sot => sot.parent_id === currentEntityId) : [];
  const siblingEntities = !isParentEntity ? Object.values(itemsMap).filter(sot => sot.parent_id === currentEntity.parent_id && sot.entity_id !== currentEntityId && sot.entity_id !== parentEntity?.entity_id) : [];

  // Get custodian entities from related entities (these are entity names, not IDs)
  const custodianEntities = relatedEntities?.unique_custodians || [];

  // Get beneficial owner entities from related entities (these are entity names, not IDs)
  const beneficialOwnerEntities = relatedEntities?.unique_bos || [];

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

  // Check if sidebar has any content to display
  const hasParent = !!parentEntity;
  const hasChildren = isParentEntity && childEntities.length > 0;
  const hasSiblings = !isParentEntity && siblingEntities.length > 0;
  const hasCustodians = custodianEntities.length > 0;
  const hasBeneficialOwners = beneficialOwnerEntities.length > 0;
  
  const hasContent = hasParent || hasChildren || hasSiblings || hasCustodians || hasBeneficialOwners;

  if (!hasContent) {
    return null;
  }

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
                          ? 'cursor-pointer bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-400 dark:hover:border-gray-600' 
                          : 'cursor-default bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75'
                        }
                      `}
                      title={isClickable ? `Click to view ${entityName} profile` : `${entityName} not found in database`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                          {entity?.logo ? (
                            <img 
                              src={entity.logo} 
                              alt={entityName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{entityName}</div>
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
                          ? 'cursor-pointer bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-400 dark:hover:border-gray-600' 
                          : 'cursor-default bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75'
                        }
                      `}
                      title={isClickable ? `Click to view ${entityName} profile` : `${entityName} not found in database`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                          {entity?.logo ? (
                            <img 
                              src={entity.logo} 
                              alt={entityName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{entityName}</div>
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
      </ScrollableContent>
    </SidebarCard>
  );
};

export default EntitySidebar; 