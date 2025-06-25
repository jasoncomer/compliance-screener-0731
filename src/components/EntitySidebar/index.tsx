import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Shield, Users } from 'lucide-react';
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
        console.log('🔍 Fetching related entities for entity ID:', currentEntityId);
        const data = await api.sot.getRelatedEntities(currentEntityId);
        console.log('📦 API Response:', data);
        setRelatedEntities(data);
      } catch (error) {
        console.error('❌ Failed to fetch related entities:', error);
        setRelatedEntities(null);
      }
    };

    fetchRelatedEntities();
  }, [currentEntityId]);

  if (!itemsMap || !currentEntityId) {
    console.log('🚫 No itemsMap or currentEntityId, returning null');
    return null;
  }

  const currentEntity = Object.values(itemsMap).find(sot => sot.entity_id === currentEntityId);
  if (!currentEntity) {
    console.log('🚫 Current entity not found in itemsMap');
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

  console.log('📊 Entity counts:');
  console.log('  - Parent entity:', !!parentEntity);
  console.log('  - Child entities:', childEntities.length);
  console.log('  - Sibling entities:', siblingEntities.length);
  console.log('  - Custodian entities:', custodianEntities.length);
  console.log('  - Beneficial owner entities:', beneficialOwnerEntities.length);
  console.log('  - Related entities data:', relatedEntities);

  const hasContent = Boolean(
    parentEntity ||
    (isParentEntity && childEntities.length > 0) ||
    (!isParentEntity && siblingEntities.length > 0) ||
    custodianEntities.length > 0 ||
    beneficialOwnerEntities.length > 0
  );

  console.log('🎯 Has content:', hasContent);

  if (!hasContent) {
    console.log('🚫 No content to display, returning null');
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
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-base font-medium m-0">Custodian Addresses ({custodianEntities.length})</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {custodianEntities.map((entityName, index) => (
                <div
                  key={`custodian-${index}`}
                  className="cursor-pointer transition-all duration-300 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-400 dark:hover:border-gray-600 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Avatar size="large" icon={<UserOutlined />} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{entityName}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Custodian
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beneficial Owners Section */}
        {beneficialOwnerEntities.length > 0 && (
          <div className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h4 className="text-base font-medium m-0">Beneficial Owners ({beneficialOwnerEntities.length})</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {beneficialOwnerEntities.map((entityName, index) => (
                <div
                  key={`beneficial-owner-${index}`}
                  className="cursor-pointer transition-all duration-300 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-400 dark:hover:border-gray-600 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Avatar size="large" icon={<UserOutlined />} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{entityName}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Beneficial Owner
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollableContent>
    </SidebarCard>
  );
};

export default EntitySidebar; 