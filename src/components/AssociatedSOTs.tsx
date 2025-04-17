import React from 'react';
import styled from 'styled-components';
import { Typography, Card, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { SOT } from '../typings/interfaces';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getEntityTypeLabel } from '../utils/display-labels';
import { EEntityType } from '../typings/SOT';
import { useAttribution } from '../context/AttributionContext';
import { IAttribution } from '../typings/ReferenceAttribution';

const { Title } = Typography;

const AssociatedSOTsWrapper = styled.div`
  text-align: left;
  
  h4 {
    margin: 0;
  }
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  
`;

const ParentEntitiesContainer = styled.div`
  margin-bottom: 16px;
`;

const AssociatedList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
  margin-top: 12px;
  overflow-y: auto;
  flex: 1;
  padding-right: 8px;
  max-height: calc(80vh - 80px);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.theme === 'dark' ? '#303030' : '#d9d9d9'};
    border-radius: 3px;
  }

  /* Remove any potential fade effects from mask-image */
  -webkit-mask-image: none;
  mask-image: none;
`;

const StyledCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 0;
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#303030' : '#d9d9d9'};
  // border-radius: 8px;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.theme === 'dark' ? '#404040' : '#b9b9b9'};
  }
  
  .ant-card-body {
    padding: 12px;
    border-radius: 8px;
  }
`;

const CardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EntityInfo = styled.div`
  flex: 1;
  
  .entity-name {
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .entity-type {
    color: #666;
    font-size: 12px;
  }
`;

interface AssociatedSOTsProps {
  associatedSots: SOT[] | null;
  onSelectSot: (sot: SOT) => void;
  currentEntityId?: string;
}

const AssociatedSOTs: React.FC<AssociatedSOTsProps> = ({ associatedSots, onSelectSot, currentEntityId }) => {
  // Early return if any of these conditions are true
  if (!associatedSots || !Array.isArray(associatedSots) || associatedSots.length === 0 || !currentEntityId) {
    return null;
  }

  const { itemsMap } = useSelector((state: RootState) => state.sot);
  const { attributions } = useAttribution();
  
  // Early return if itemsMap is empty or currentEntity doesn't exist
  if (!itemsMap || Object.keys(itemsMap).length === 0) {
    return null;
  }

  const currentEntity = Object.values(itemsMap).find(sot => sot.entity_id === currentEntityId);
  if (!currentEntity) {
    return null;
  }

  // Find the parent entity if we're looking at a child
  const parentEntityKey = Object.keys(itemsMap).find(key => {
    const potentialParent = itemsMap[key];
    return potentialParent.entity_id === currentEntity.parent_id;
  });
  const parentEntity = parentEntityKey ? itemsMap[parentEntityKey] : null;

  // Find beneficial owners
  const beneficialOwners = Object.entries(attributions)
    .filter(([_, attribution]: [string, IAttribution]) => 
      attribution.entity === currentEntityId && 
      attribution.bo && 
      attribution.bo !== attribution.entity
    )
    .map(([addr, attribution]: [string, IAttribution]) => ({
      addr,
      bo: attribution.bo
    }));

  // If we're looking at a parent entity, show its children
  const isParentEntity = !currentEntity.parent_id;
  const childEntities = isParentEntity 
    ? Object.values(itemsMap).filter(sot => sot.parent_id === currentEntityId)
    : [];

  // If we're looking at a child entity, show its siblings
  const siblingEntities = !isParentEntity
    ? Object.values(itemsMap).filter(sot => 
        sot.parent_id === currentEntity.parent_id && 
        sot.entity_id !== currentEntityId &&
        sot.entity_id !== parentEntity?.entity_id
      )
    : [];

  // Check if there's any content to display
  const hasParentEntity = parentEntity !== null && Object.keys(parentEntity).length > 0;
  const hasBeneficialOwners = beneficialOwners.length > 0;
  const hasAssociatedEntities = isParentEntity 
    ? childEntities.length > 0 
    : siblingEntities.length > 0;

  // If there's no content to display at all, return null
  if (!hasParentEntity && !hasBeneficialOwners && !hasAssociatedEntities) {
    return null;
  }

  const renderEntityList = (entities: SOT[], title: string) => {
    if (entities.length === 0) return null;
    
    return (
      <>
        <Title level={4}>{title} ({entities.length})</Title>
        <AssociatedList>
          {entities.map((associatedSot) => (
            <StyledCard 
              key={associatedSot._id}
              onClick={() => onSelectSot(associatedSot)}
            >
              <CardContent>
                <Avatar
                  size="large"
                  src={associatedSot.logo}
                  icon={!associatedSot.logo && <UserOutlined />}
                />
                <EntityInfo>
                  <div className="entity-name">
                    {associatedSot.proper_name || associatedSot.entity_id}
                  </div>
                  <div className="entity-type">
                    {getEntityTypeLabel(associatedSot.entity_type as EEntityType)}
                    {associatedSot.associate_country_1 && 
                      ` • ${associatedSot.associate_country_1}`
                    }
                  </div>
                </EntityInfo>
              </CardContent>
            </StyledCard>
          ))}
        </AssociatedList>
      </>
    );
  };

  return (
    <AssociatedSOTsWrapper>
      {/* Only show parent entity container if we're not already looking at the parent */}
      {!isParentEntity && parentEntity && (
        <ParentEntitiesContainer>
          {renderEntityList([parentEntity], "Parent Entity")}
        </ParentEntitiesContainer>
      )}
      {isParentEntity 
        ? childEntities.length > 0 && renderEntityList(childEntities, "Associated Entities")
        : siblingEntities.length > 0 && renderEntityList(siblingEntities, "Associated Entities")
      }
    </AssociatedSOTsWrapper>
  );
};

export default AssociatedSOTs;
