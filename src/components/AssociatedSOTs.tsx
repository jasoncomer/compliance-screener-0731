import React from 'react';
import styled from 'styled-components';
import { UserOutlined } from '@ant-design/icons';
import { SimpleLogo } from './common/Logo';
import { SOT } from '../typings/interfaces';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getEntityTypeLabel } from '../utils/display-labels';
import { EEntityType } from '../typings/SOT';
import { Card } from './ui/card';

import { colors } from '../styles/variables';

const AssociatedSOTsWrapper = styled.div`
  text-align: left;
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-right: 16px;
`;

const EntitySection = styled.div`
  margin-bottom: 14px;
  h4 {
    margin-bottom: 12px;
    margin-top: 0px;
    font-size: 16px;
    font-weight: 600;
  }
`;

const AssociatedList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
  margin-top: 0px;
  overflow-y: auto;
  flex: 1;
  padding-right: 8px;
  max-height: 260px;
  
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

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.theme === 'dark' ? '#404040' : '#b9b9b9'};
  }
  
  .card-content {
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
    color: ${({ theme }) => theme.theme === 'dark' ? colors.gray[400] : colors.gray[600]};
    font-size: 12px;
  }
`;

interface AssociatedSOTsProps {
  associatedSots: SOT[] | null;
  onSelectSot: (sot: SOT) => void;
  currentEntityId?: string;
}

const AssociatedSOTs: React.FC<AssociatedSOTsProps> = ({ associatedSots, onSelectSot, currentEntityId }) => {
  const { itemsMap } = useSelector((state: RootState) => state.sot);
  
  // Early return if any of these conditions are true
  if (!associatedSots || !Array.isArray(associatedSots) || associatedSots.length === 0 || !currentEntityId) {
    return null;
  }
  
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
  const hasAssociatedEntities = isParentEntity 
    ? childEntities.length > 0 
    : siblingEntities.length > 0;

  // If there's no content to display at all, return null
  if (!hasParentEntity && !hasAssociatedEntities) {
    return null;
  }

  const renderEntityList = (entities: SOT[], title: string) => {
    if (entities.length === 0) return null;
    
    return (
      <EntitySection>
        <h4>{title} ({entities.length})</h4>
        <AssociatedList>
          {entities.map((associatedSot) => (
            <StyledCard 
              key={associatedSot._id}
              onClick={() => onSelectSot(associatedSot)}
              className="card-content"
            >
              <CardContent>
                <SimpleLogo
                  entityId={associatedSot.entity_id}
                  entityType={associatedSot.entity_type}
                  size="large"
                  fallbackIcon={<UserOutlined />}
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
      </EntitySection>
    );
  };

  return (
    <AssociatedSOTsWrapper>
      {!isParentEntity && parentEntity && renderEntityList([parentEntity], "Parent Entity")}
      {isParentEntity 
        ? childEntities.length > 0 && renderEntityList(childEntities, "Associated Entities")
        : siblingEntities.length > 0 && renderEntityList(siblingEntities, "Associated Entities")
      }
    </AssociatedSOTsWrapper>
  );
};

export default AssociatedSOTs;
