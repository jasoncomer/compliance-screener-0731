import React from 'react';
import { Avatar, Card } from 'antd';
import { User } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAttribution } from '../../../context/AttributionContext';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentOrganization } from '../../../store/slices/organizationsSlice';
import { RootState } from '../../../store/store';
import { getEntityTypeLabel, capitalizeFirstLetter } from '../../../utils/display-labels';
import { EEntityType } from '../../../typings/SOT';
import EntityQuickView from '../../../components/EntityQuickView';
import {
  EntityRow,
  EntitiesContainer,
  EntityInfo,
} from './AddressStyles';

interface AddressAttributionEntitiesProps {
  address: string | undefined;
}

const AddressAttributionEntities: React.FC<AddressAttributionEntitiesProps> = ({ address }) => {
  const { theme } = useTheme();
  const { attributions } = useAttribution();
  const organization = useAppSelector(selectCurrentOrganization);
  const { itemsMap } = useAppSelector((state: RootState) => state.sot);

  // Check if attribution data exists for this address
  const hasAttributionData = address && (
    attributions[address]?.entity ||
    attributions[address]?.bo ||
    attributions[address]?.custodian
  );

  // Function to get the display name for an entity
  const getEntityDisplayName = (entityId: string) => {
    if (!entityId) return '';
    
    // Get the entity from the SOT data
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    
    // If allowCSAM is false and the entity is CSAM-related, show "CSAM Related Entity"
    if (organization?.settings.allowCSAM === false && 
        (entity?.entity_type === "csam" || entityId.toLowerCase().includes('csam'))) {
      return 'CSAM Related Entity';
    }
    
    // Return proper_name if available, otherwise entity_id
    return entity?.proper_name || entityId;
  };

  // Function to get the entity logo
  const getEntityLogo = (entityId: string) => {
    if (!entityId) return null;
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.logo;
  };

  // Function to get the entity type
  const getEntityType = (entityId: string) => {
    if (!entityId) return '';
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.entity_type ? getEntityTypeLabel(entity.entity_type as EEntityType) : '';
  };

  // Function to get SOT data for an entity
  const getEntitySot = (entityId: string) => {
    if (!entityId) return null;
    return Object.values(itemsMap).find(sot => sot.entity_id === entityId) || null;
  };

  // Handle view full profile
  const handleViewFullProfile = (sot: any) => {
    // Navigate to VASP Explorer with the entity
    window.open(`/home/blockham?entity=${sot.entity_id}`, '_blank');
  };

  // Handle quick view click
  const handleQuickView = (e: React.MouseEvent, _entityId: string) => {
    e.stopPropagation();
    // The EntityQuickView component handles the quick view display
  };

    // Render entity with hover functionality
  const renderEntityWithHover = (entityId: string, label: string, defaultType?: string) => {
    const sot = getEntitySot(entityId);
    const displayName = getEntityDisplayName(entityId);
    const entityType = getEntityType(entityId) || defaultType || '';
    
    return (
      <EntityRow>
        <Avatar
          size={40}
          src={getEntityLogo(entityId)}
          icon={!getEntityLogo(entityId) && <User className="w-5 h-5" />}
        />
        <EntityInfo>
          <div className="field-group">
            <div className='label'>{capitalizeFirstLetter(label)}</div>
            <div className="entity-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{displayName}</span>
              {sot && (
                <EntityQuickView
                  entity={{
                    _id: sot._id,
                    proper_name: sot.proper_name,
                    entity_id: sot.entity_id
                  }}
                  sot={sot}
                  onViewFull={handleViewFullProfile}
                  onQuickView={handleQuickView}
                  popoverPlacement="right"
                  popoverWidth={450}
                />
              )}
            </div>
          </div>
          <div className="field-group">
            <div className='label'>{capitalizeFirstLetter('entity type')}</div>
            <div className="entity-type">
              {entityType}
            </div>
          </div>
        </EntityInfo>
      </EntityRow>
    );
  };

  if (!address || !hasAttributionData) {
    return null;
  }

  return (
    <EntitiesContainer>
      {attributions[address]?.entity && (
        <Card
          style={{ 
            flex: 1, 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
            marginRight: '0.5rem',
            height: 'fit-content',
            maxHeight: '120px'
          }}
          className="rounded-lg"
          bodyStyle={{ padding: '0.75rem' }}
          bordered={false}
        >
          <div className="!bg-transparent dark:!bg-transparent !p-0 !mb-0">
            {renderEntityWithHover(attributions[address].entity, 'Entity')}
          </div>
        </Card>
      )}

      {attributions[address]?.bo && (attributions[address]?.bo !== attributions[address]?.entity) && (
        <Card
          style={{ 
            flex: 1, 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
            marginLeft: '0.5rem',
            height: 'fit-content',
            maxHeight: '120px'
          }}
          className="rounded-lg"
          bodyStyle={{ padding: '0.75rem' }}
          bordered={false}
        >
          <div className="!bg-transparent dark:!bg-transparent !p-0 !mb-0">
            {renderEntityWithHover(attributions[address].bo, 'Beneficial Owner')}
          </div>
        </Card>
      )}

      {attributions[address]?.custodian && (
        <Card
          style={{ 
            flex: 1, 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
            marginLeft: '0.5rem',
            height: 'fit-content',
            maxHeight: '120px'
          }}
          className="rounded-lg"
          bodyStyle={{ padding: '0.75rem' }}
          bordered={false}
        >
          <div className="!bg-transparent dark:!bg-transparent !p-0 !mb-0">
            {renderEntityWithHover(attributions[address].custodian, 'Custodian', 'Custodian')}
          </div>
        </Card>
      )}
    </EntitiesContainer>
  );
};

export default AddressAttributionEntities; 