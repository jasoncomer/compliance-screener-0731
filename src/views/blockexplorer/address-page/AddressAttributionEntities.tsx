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

  if (!address || !hasAttributionData) {
    return null;
  }

  return (
    <EntitiesContainer>
      {attributions[address]?.entity && (
        <Card
          style={{ width: '100%', backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6' }}
          className="rounded-lg"
          bodyStyle={{ padding: '0.75rem' }}
          bordered={false}
        >
          <EntityRow className="!bg-transparent dark:!bg-transparent !p-0 !mb-0">
            <Avatar
              size={40}
              src={getEntityLogo(attributions[address].entity)}
              icon={!getEntityLogo(attributions[address].entity) && <User className="w-5 h-5" />}
            />
            <EntityInfo>
              <div className="field-group">
                <div className='label'>{capitalizeFirstLetter('Entity')}</div>
                <div className="entity-name">
                  {getEntityDisplayName(attributions[address].entity)}
                </div>
              </div>
              <div className="field-group">
                <div className='label'>{capitalizeFirstLetter('entity type')}</div>
                <div className="entity-type">
                  {getEntityType(attributions[address].entity)}
                </div>
              </div>                   
            </EntityInfo>
          </EntityRow>
        </Card>
      )}

      {attributions[address]?.bo && (attributions[address]?.bo !== attributions[address]?.entity) && (
        <EntityRow>
          <Avatar
            size={40}
            src={getEntityLogo(attributions[address].bo)}
            icon={!getEntityLogo(attributions[address].bo) && <User className="w-5 h-5" />}
          />
          <EntityInfo>
            <div className="field-group">
              <div className='label'>{capitalizeFirstLetter('Beneficial Owner')}</div>
              <div className="entity-name">
                {getEntityDisplayName(attributions[address].bo)}
              </div>
            </div>
            <div className="field-group">
              <div className='label'>{capitalizeFirstLetter('entity type')}</div>
              <div className="entity-type">
                {getEntityType(attributions[address].bo)}
              </div>
            </div>
          </EntityInfo>
        </EntityRow>
      )}

      {attributions[address]?.custodian && (
        <EntityRow>
          <Avatar
            size={40}
            src={getEntityLogo(attributions[address].custodian)}
            icon={!getEntityLogo(attributions[address].custodian) && <User className="w-5 h-5" />}
          />
          <EntityInfo>
            <div className="field-group">
              <div className='label'>{capitalizeFirstLetter('Custodian')}</div>
              <div className="entity-name">
                {getEntityDisplayName(attributions[address].custodian)}
              </div>
            </div>
            <div className="field-group">
              <div className='label'>{capitalizeFirstLetter('entity type')}</div>
              <div className="entity-type">
                {getEntityType(attributions[address].custodian) || 'Custodian'}
              </div>
            </div>
          </EntityInfo>
        </EntityRow>
      )}
    </EntitiesContainer>
  );
};

export default AddressAttributionEntities; 