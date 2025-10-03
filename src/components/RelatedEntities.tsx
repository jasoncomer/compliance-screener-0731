import React, { useEffect,useState } from 'react';

import { User } from 'lucide-react';

import { useSelector } from 'react-redux';
import { api } from '../api/api';
import { RootState } from '../store/store';

import { cn } from '@/design-system/utils';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';

interface ContainerProps {
  isEmpty?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Container: React.FC<ContainerProps> = ({ isEmpty, children, className }) => (
  <div className={cn(
    "text-left h-fit min-h-0 flex flex-col flex-1 max-h-[50%]",
    isEmpty && "hidden",
    className
  )}>
    {children}
  </div>
);

interface SectionTitleProps {
  level?: 1 | 2 | 3 | 4 | 5;
  children: React.ReactNode;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ level = 4, children, className }) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizeClasses = {
    1: "text-2xl font-bold",
    2: "text-xl font-semibold", 
    3: "text-lg font-semibold",
    4: "text-base font-medium",
    5: "text-sm font-medium"
  };
  
  return (
    <HeadingTag className={cn("mb-3 mt-0 text-gray-900 dark:text-white", sizeClasses[level], className)}>
      {children}
    </HeadingTag>
  );
};

interface CustodianSectionProps {
  children: React.ReactNode;
  className?: string;
}

const CustodianSection: React.FC<CustodianSectionProps> = ({ children, className }) => (
  <div className={cn("pr-2 mb-4", className)}>
    {children}
  </div>
);

interface BeneficialOwnersSectionProps {
  children: React.ReactNode;
  className?: string;
}

const BeneficialOwnersSection: React.FC<BeneficialOwnersSectionProps> = ({ children, className }) => (
  <div className={cn("flex flex-col pr-2 mb-0", className)}>
    {children}
  </div>
);

interface BeneficialOwnersListProps {
  children: React.ReactNode;
  className?: string;
}

const BeneficialOwnersList: React.FC<BeneficialOwnersListProps> = ({ children, className }) => (
  <div className={cn(
    "overflow-y-auto flex-1 pr-2 max-h-[150px]",
    "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
    "scrollbar-track-transparent",
    className
  )}>
    {children}
  </div>
);

interface EntityListProps {
  children: React.ReactNode;
  className?: string;
}

const EntityList: React.FC<EntityListProps> = ({ children, className }) => (
  <div className={cn("grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2 mt-0", className)}>
    {children}
  </div>
);

interface StyledCardProps {
  isEmpty?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const StyledCard: React.FC<StyledCardProps> = ({ isEmpty, children, className, onClick }) => (
  <Card 
    onClick={onClick}
    className={cn(
      "cursor-pointer transition-all duration-300 mb-0 p-3",
      isEmpty 
        ? "bg-transparent border-gray-300 dark:border-gray-700" 
        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-400 dark:hover:border-gray-600",
      className
    )}
  >
    {children}
  </Card>
);

interface CardContentProps {
  isEmpty?: boolean;
  children: React.ReactNode;
  className?: string;
}

const CardContent: React.FC<CardContentProps> = ({ isEmpty, children, className }) => (
  <div className={cn("flex items-center gap-2", isEmpty && "opacity-50", className)}>
    {children}
  </div>
);

interface EntityInfoProps {
  children: React.ReactNode;
  className?: string;
}

const EntityInfo: React.FC<EntityInfoProps> = ({ children, className }) => (
  <div className={cn("flex-1", className)}>
    {children}
  </div>
);

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
  const { itemsMap } = useSelector((state: RootState) => state.sot);

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
  
  // Get current entity information for filtering
  const currentEntity = Object.values(itemsMap).find(sot => sot.entity_id === entity);
  
  // Filter out the current entity from beneficial owners and custodians
  const filteredBeneficialOwners = (relatedEntities.unique_bos || []).filter(entityName => {
    if (!currentEntity) return true;
    const currentEntityName = currentEntity.proper_name?.toLowerCase();
    const currentEntityId = currentEntity.entity_id?.toLowerCase();
    const entityNameLower = entityName.toLowerCase();
    
    // Don't show the current entity as its own beneficial owner
    return entityNameLower !== currentEntityName && entityNameLower !== currentEntityId;
  });
  
  const filteredCustodians = (relatedEntities.unique_custodians || []).filter(entityName => {
    if (!currentEntity) return true;
    const currentEntityName = currentEntity.proper_name?.toLowerCase();
    const currentEntityId = currentEntity.entity_id?.toLowerCase();
    const entityNameLower = entityName.toLowerCase();
    
    // Don't show the current entity as its own custodian
    return entityNameLower !== currentEntityName && entityNameLower !== currentEntityId;
  });
  
  if (filteredBeneficialOwners.length === 0 && filteredCustodians.length === 0) return null;

  const renderBeneficialOwners = () => {
    if (!filteredBeneficialOwners || filteredBeneficialOwners.length === 0) {
      return null;
    }

    const entityCards = filteredBeneficialOwners.map((entityName, index) => (
      <StyledCard key={index}>
        <CardContent>
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <EntityInfo>
            <div className="font-medium mb-0.5">{entityName}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Beneficial Owner</div>
          </EntityInfo>
        </CardContent>
      </StyledCard>
    ));

    return (
      <BeneficialOwnersSection>
        <SectionTitle level={4}>Beneficial Owner ({filteredBeneficialOwners.length})</SectionTitle>
        <BeneficialOwnersList>
          <EntityList>
            {entityCards.length > 0 ? entityCards : (
              <StyledCard isEmpty={true}>
                <CardContent isEmpty={true}>
                  <EntityInfo>
                    <div className="font-medium text-gray-500">None found</div>
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
    const custodians = filteredCustodians || [];
    const custodianCards = custodians.map((entityName, index) => (
      <StyledCard key={index}>
        <CardContent>
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <EntityInfo>
            <div className="font-medium mb-0.5">{entityName}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Custodian</div>
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
                  <div className="font-medium text-gray-500">None found</div>
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