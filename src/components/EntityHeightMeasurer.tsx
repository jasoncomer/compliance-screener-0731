import { forwardRef } from 'react';
import EntityDetails from '../views/RiskDashboard/components/entity-intelligence/EntityDetails';

interface EntityHeightMeasurerProps {
  // Custodial entity props
  custodialProps: {
    name: string;
    type: string;
    description: string;
    website: string;
    phone: string;
    address: string;
    founded: number;
    logo: string;
    countries: string[];
    entityId?: string;
    email?: string;
    twitter?: string;
    telegram?: string;
    ensAddress?: string;
    legalInfoUrl?: string;
    ceo?: string;
    keyPersonnel?: string;
    ticker?: string;
    parentId?: string;
    entityTags?: string[];
    socialMediaProfiles?: string[];
    isCentralized?: boolean;
    noKycRequired?: boolean;
    isDead?: boolean;
    isOfacSanctioned?: boolean;
    note?: string;
    lastUpdated?: string;
    lastModifiedBy?: string;
    revisitSite?: boolean;
  };
  // Beneficial owner props
  beneficialOwnerProps: {
    name: string;
    type: string;
    description: string;
    website: string;
    phone: string;
    address: string;
    founded: number;
    logo: string;
    countries: string[];
    entityId?: string;
    email?: string;
    twitter?: string;
    telegram?: string;
    ensAddress?: string;
    legalInfoUrl?: string;
    ceo?: string;
    keyPersonnel?: string;
    ticker?: string;
    parentId?: string;
    entityTags?: string[];
    socialMediaProfiles?: string[];
    isCentralized?: boolean;
    noKycRequired?: boolean;
    isDead?: boolean;
    isOfacSanctioned?: boolean;
    note?: string;
    lastUpdated?: string;
    lastModifiedBy?: string;
    revisitSite?: boolean;
  };
  showToggle: boolean;
  isBeneficialOwner: boolean;
  onToggle?: (isBeneficialOwner: boolean) => void;
  custodialEntityName?: string;
  beneficialOwnerName?: string;
}

const EntityHeightMeasurer = forwardRef<HTMLDivElement, EntityHeightMeasurerProps>(
  ({ custodialProps, beneficialOwnerProps, showToggle, onToggle, custodialEntityName, beneficialOwnerName }, ref) => {
    return (
      <div ref={ref} className="invisible absolute -top-[9999px] left-0 w-full">
        {/* Custodial Entity - Always rendered for height measurement */}
        <div className="custodial-entity">
          <EntityDetails
            {...custodialProps}
            showToggle={showToggle}
            isBeneficialOwner={false}
            onToggle={onToggle}
            custodialEntityName={custodialEntityName}
            beneficialOwnerName={beneficialOwnerName}
          />
        </div>
        
        {/* Beneficial Owner - Always rendered for height measurement */}
        <div className="beneficial-owner">
          <EntityDetails
            {...beneficialOwnerProps}
            showToggle={showToggle}
            isBeneficialOwner={true}
            onToggle={onToggle}
            custodialEntityName={custodialEntityName}
            beneficialOwnerName={beneficialOwnerName}
          />
        </div>
      </div>
    );
  }
);

EntityHeightMeasurer.displayName = 'EntityHeightMeasurer';

export default EntityHeightMeasurer;