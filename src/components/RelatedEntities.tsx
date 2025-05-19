import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Card, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { colors } from '../styles/variables';
import { api } from '../api/api';

const { Title } = Typography;

interface ContainerProps {
  isEmpty?: boolean;
}

const Container = styled.div<ContainerProps>`
  text-align: left;
  height: fit-content;
  min-height: 0;
  display: ${props => props.isEmpty ? 'none' : 'flex'};
  flex-direction: column;
  flex: 1;
  max-height: 50%;

  &:empty {
    display: none;
  }
`;

const SectionTitle = styled(Title)`
  &.ant-typography {
    margin-bottom: 12px;
    margin-top: 0px;
    font-size: 16px;
  }
`;

const CustodianSection = styled.div`
  padding-right: 8px;
  margin-bottom: 16px;
  padding-right: 22px
`;

const BeneficialOwnersSection = styled.div`
  display: flex;
  flex-direction: column;
  padding-right: 8px;
  margin-bottom: 0;
`;

const BeneficialOwnersList = styled.div`
  overflow-y: auto;
  flex: 1;
  padding-right: 8px;
  max-height: 150px;
  
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


const EntityList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
  margin-top: 0px;
`;

interface StyledCardProps {
  isEmpty?: boolean;
}

const StyledCard = styled(Card)<StyledCardProps>`
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 0;
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#303030' : '#d9d9d9'};
  background: ${({ theme, isEmpty }) => isEmpty ? 'transparent' : theme.theme === 'dark' ? '#1f1f1f' : '#fff'};

  &:hover {
    box-shadow: ${({ isEmpty }) => isEmpty ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.1)'};
    transform: ${({ isEmpty }) => isEmpty ? 'none' : 'translateY(-2px)'};
    border-color: ${({ theme, isEmpty }) => isEmpty ? theme.theme === 'dark' ? '#303030' : '#d9d9d9' : theme.theme === 'dark' ? '#404040' : '#b9b9b9'};
  }
  
  .ant-card-body {
    padding: 12px;
    border-radius: 8px;
  }
`;

interface CardContentProps {
  isEmpty?: boolean;
}

const CardContent = styled.div<CardContentProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: ${({ isEmpty }) => isEmpty ? 0.5 : 1};
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

interface RelatedEntitiesProps {
  entity: string;
  onHasEntities?: (has: boolean) => void;
}

const RelatedEntities: React.FC<RelatedEntitiesProps> = ({ entity, onHasEntities }) => {
  const [relatedEntities, setRelatedEntities] = useState<{
    unique_bos: string[];
    unique_custodians: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedEntities = async () => {
      try {
        setLoading(true);
        const data = await api.sot.getRelatedEntities(entity);
        setRelatedEntities(data);
        // Notify parent about whether we have entities
        onHasEntities?.(
          !!(data?.unique_bos?.length > 0 || data?.unique_custodians?.length > 0)
        );
        setError(null);
      } catch (err) {
        setError('Failed to load related entities');
        onHasEntities?.(false);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (entity) {
      fetchRelatedEntities();
    } else {
      onHasEntities?.(false);
    }
  }, [entity, onHasEntities]);

  if (loading) return null;
  if (error) return null;
  if (!relatedEntities) return null;
  if (!relatedEntities.unique_bos || !relatedEntities.unique_custodians) return null;
  if (relatedEntities.unique_bos.length === 0 && relatedEntities.unique_custodians.length === 0) return null;

  const renderBeneficialOwners = () => {
    if (!relatedEntities.unique_bos || relatedEntities.unique_bos.length === 0) {
      return null;
    }

    const entityCards = relatedEntities.unique_bos.map((entityName, index) => (
      <StyledCard key={index}>
        <CardContent>
          <Avatar
            size="large"
            icon={<UserOutlined />}
          />
          <EntityInfo>
            <div className="entity-name">{entityName}</div>
            <div className="entity-type">Beneficial Owner</div>
          </EntityInfo>
        </CardContent>
      </StyledCard>
    ));

    return (
      <BeneficialOwnersSection>
        <SectionTitle level={4}>Beneficial Owner ({relatedEntities.unique_bos.length})</SectionTitle>
        <BeneficialOwnersList>
          <EntityList>
            {entityCards.length > 0 ? entityCards : (
              <StyledCard isEmpty={true}>
                <CardContent isEmpty={true}>
                  <EntityInfo>
                    <div className="entity-name" style={{ color: '#888' }}>None found</div>
                  </EntityInfo>
                </CardContent>
              </StyledCard>
            )}
          </EntityList>
        </BeneficialOwnersList>
      </BeneficialOwnersSection>
    );
  };

  const renderCustodians = () => {
    const custodians = relatedEntities.unique_custodians || [];
    const custodianCards = custodians.map((entityName, index) => (
      <StyledCard key={index}>
        <CardContent>
          <Avatar
            size="large"
            icon={<UserOutlined />}
          />
          <EntityInfo>
            <div className="entity-name">{entityName}</div>
            <div className="entity-type">Custodian</div>
          </EntityInfo>
        </CardContent>
      </StyledCard>
    ));

    return (
      <CustodianSection>
        <SectionTitle level={4}>Custodiant ({custodians.length})</SectionTitle>
        <EntityList>
          {custodianCards.length > 0 ? custodianCards : (
            <StyledCard isEmpty={true}>
              <CardContent isEmpty={true}>
                <EntityInfo>
                  <div className="entity-name" style={{ color: '#888' }}>None found</div>
                </EntityInfo>
              </CardContent>
            </StyledCard>
          )}
        </EntityList>
      </CustodianSection>
    );
  };

  const hasCustodians = relatedEntities.unique_custodians.length > 0;
  const hasBeneficialOwners = relatedEntities.unique_bos.length > 0;
  const isEmpty = !hasCustodians && !hasBeneficialOwners;

  return (
    <Container isEmpty={isEmpty}>
      {renderCustodians()}
      {renderBeneficialOwners()}
    </Container>
  );
};

export default RelatedEntities; 