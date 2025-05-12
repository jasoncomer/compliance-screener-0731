import React from 'react';
import styled from 'styled-components';
import { Typography, Card, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { SOT } from '../typings/interfaces';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getEntityTypeLabel } from '../utils/display-labels';
import { EEntityType } from '../typings/SOT';
import { colors } from '../styles/variables';
import { getRelatedEntities } from '../api/attribution';

const { Title } = Typography;

const SidebarCard = styled(Card)<{ $hasContent: boolean }>`
  width: ${({ $hasContent }) => $hasContent ? '340px' : '100%'};
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.theme === 'dark' ? '#141414' : '#fff'};
  max-height: 80vh;
  overflow: hidden;
  border-radius: 16px;
  .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
    overflow: hidden;
    background-color: inherit;
    min-height: 0;
  }
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.theme === 'dark' ? '#434343' : '#d9d9d9'};
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.theme === 'dark' ? '#595959' : '#bfbfbf'};
  }
`;

const Section = styled.div`
  margin-bottom: 18px;
`;

const SectionTitle = styled(Title)`
  &.ant-typography {
    margin-bottom: 12px;
    margin-top: 0px;
    font-size: 16px;
  }
`;

const EntityList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 0px;
`;

const StyledCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 0;
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#303030' : '#d9d9d9'};
  background: ${({ theme }) => theme.theme === 'dark' ? '#1f1f1f' : '#fff'};
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
    color: ${({ theme }) => theme.theme === 'dark' ? colors.gray[400] : colors.gray[600]};
    font-size: 12px;
  }
`;

const ScrollableSection = styled.div`
  max-height: 150px;
  overflow-y: auto;
  position: relative;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.theme === 'dark' ? '#434343' : '#d9d9d9'};
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.theme === 'dark' ? '#595959' : '#bfbfbf'};
  }
`;

const ScrollMoreMessage = styled.div`
  text-align: center;
  padding: 4px 0;
  color: ${({ theme }) => theme.theme === 'dark' ? '#888' : '#666'};
  font-size: 12px;
`;

interface EntitySidebarProps {
  associatedSots: SOT[] | null;
  currentEntityId?: string;
  onSelectSot: (sot: SOT) => void;
}

const EntitySidebar: React.FC<EntitySidebarProps> = ({ associatedSots, currentEntityId, onSelectSot }) => {
  const { itemsMap } = useSelector((state: RootState) => state.sot);
  const [relatedEntities, setRelatedEntities] = React.useState<{ unique_bos: string[]; unique_custodians: string[] } | null>(null);

  React.useEffect(() => {
    if (currentEntityId) {
      getRelatedEntities(currentEntityId).then(setRelatedEntities).catch(() => setRelatedEntities(null));
    }
  }, [currentEntityId]);

  // Parent/Associated logic (from AssociatedSOTs)
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
    (relatedEntities?.unique_bos && relatedEntities.unique_bos.length > 0)
  );

  if (!hasContent) return null;

  // Render helpers
  const renderEntityList = (entities: SOT[], title: string) => (
    <Section>
      <SectionTitle level={4}>{title} ({entities.length})</SectionTitle>
      <ScrollableSection>
        <EntityList>
          {entities.map((associatedSot) => (
            <StyledCard key={associatedSot._id} onClick={() => onSelectSot(associatedSot)}>
              <CardContent>
                <Avatar size="large" src={associatedSot.logo} icon={!associatedSot.logo && <UserOutlined />} />
                <EntityInfo>
                  <div className="entity-name">{associatedSot.proper_name || associatedSot.entity_id}</div>
                  <div className="entity-type">{getEntityTypeLabel(associatedSot.entity_type as EEntityType)}{associatedSot.associate_country_1 && ` • ${associatedSot.associate_country_1}`}</div>
                </EntityInfo>
              </CardContent>
            </StyledCard>
          ))}
        </EntityList>
      </ScrollableSection>
      {entities.length > 2 && <ScrollMoreMessage>Scroll for more</ScrollMoreMessage>}
    </Section>
  );

  const renderCustodians = () => {
    const custodians = relatedEntities?.unique_custodians || [];
    return (
      <Section>
        <SectionTitle level={4}>Custodian ({custodians.length})</SectionTitle>
        <ScrollableSection>
          <EntityList>
            {custodians.length > 0 ? custodians.map((entityName, idx) => (
              <StyledCard key={idx}>
                <CardContent>
                  <Avatar size="large" icon={<UserOutlined />} />
                  <EntityInfo>
                    <div className="entity-name">{entityName}</div>
                    <div className="entity-type">Custodian</div>
                  </EntityInfo>
                </CardContent>
              </StyledCard>
            )) : <div style={{ color: '#888', padding: 8 }}>None found</div>}
          </EntityList>
        </ScrollableSection>
        {custodians.length > 2 && <ScrollMoreMessage>Scroll for more</ScrollMoreMessage>}
      </Section>
    );
  };

  const renderBeneficialOwners = () => {
    const bos = relatedEntities?.unique_bos || [];
    return (
      <Section>
        <SectionTitle level={4}>Beneficial Owner ({bos.length})</SectionTitle>
        <ScrollableSection>
          <EntityList>
            {bos.length > 0 ? bos.map((entityName, idx) => (
              <StyledCard key={idx}>
                <CardContent>
                  <Avatar size="large" icon={<UserOutlined />} />
                  <EntityInfo>
                    <div className="entity-name">{entityName}</div>
                    <div className="entity-type">Beneficial Owner</div>
                  </EntityInfo>
                </CardContent>
              </StyledCard>
            )) : <div style={{ color: '#888', padding: 8 }}>None found</div>}
          </EntityList>
        </ScrollableSection>
        {bos.length > 2 && <ScrollMoreMessage>Scroll for more</ScrollMoreMessage>}
      </Section>
    );
  };

  return (
    <SidebarCard $hasContent={hasContent}>
      <ScrollableContent>
        {parentEntity && renderEntityList([parentEntity], 'Parent Entity')}
        {isParentEntity
          ? childEntities.length > 0 && renderEntityList(childEntities, 'Associated Entities')
          : siblingEntities.length > 0 && renderEntityList(siblingEntities, 'Associated Entities')}
        {relatedEntities && relatedEntities.unique_custodians && relatedEntities.unique_custodians.length > 0 && renderCustodians()}
        {relatedEntities && relatedEntities.unique_bos && relatedEntities.unique_bos.length > 0 && renderBeneficialOwners()}
      </ScrollableContent>
    </SidebarCard>
  );
};

export default EntitySidebar; 