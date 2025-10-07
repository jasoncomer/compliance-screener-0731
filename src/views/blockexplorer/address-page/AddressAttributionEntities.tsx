import React from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { SimpleLogo } from '../../../components/common/Logo';
import EntityQuickView from '../../../components/EntityQuickView';
import { useAttribution } from '../../../context/AttributionContext';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentOrganization } from '../../../store/slices/organizationsSlice';
import { RootState } from '../../../store/store';
import { EEntityType } from '../../../typings/SOT';
import { capitalizeFirstLetter, getEntityTypeLabel } from '../../../utils/display-labels';

// Removed AddressStyles import - using inline styles

interface AddressAttributionEntitiesProps {
  address: string | undefined;
}

const AddressAttributionEntities: React.FC<AddressAttributionEntitiesProps> = ({ address }) => {
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
    // Navigate to VASP Explorer with the entity in the same tab
    window.location.href = `/home/blockham?entity=${sot.entity_id}`;
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
      <div className="flex gap flex-1 min-w-0 items-center">
        <SimpleLogo
          entityId={entityId}
          entityType={entityType}
          size="default"
          shape="circle"
        />
        <div className="flex gap-12 items-start">
          <div className="field-group">
            <div className='label'>{capitalizeFirstLetter(label)}</div>
            <div className="entity-name flex items-center gap-2">
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
        </div>
      </div>
    );
  };

  if (!address || !hasAttributionData) {
    return null;
  }

  return (
    <div className="flex gap-4">
      {attributions[address]?.entity && (
        <Card className={cn("flex-1 h-fit max-h-[120px] rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 shadow-sm")}>
          {renderEntityWithHover(attributions[address].entity, 'Entity')}
        </Card>
      )}

      {attributions[address]?.bo && (attributions[address]?.bo !== attributions[address]?.entity) && (
        <Card className={cn("flex-1 h-fit max-h-[120px] rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 shadow-sm")}>
          {renderEntityWithHover(attributions[address].bo, 'Beneficial Owner')}
        </Card>
      )}

      {attributions[address]?.custodian && (
        <Card className={cn("flex-1 h-fit max-h-[120px] rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 shadow-sm")}>
          {renderEntityWithHover(attributions[address].custodian, 'Custodian', 'Custodian')}
        </Card>
      )}
    </div>
  );
};

export default AddressAttributionEntities; 