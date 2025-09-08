// Entity utility functions for beneficial owner overrides and entity resolution

export interface AttributionData {
  entity: string; // entity_id
  bo: string; // beneficial owner entity_id
  custodian: string;
  script_type?: string;
  cospend_id?: string;
}

export interface SOTEntity {
  entity_id: string;
  proper_name: string;
  entity_type: string;
  entity_tags?: string[];
  logo?: string;
  ofac?: boolean;
}

/**
 * Determines the appropriate suffix based on entity type
 * Returns "Deposit Address" for certain entity types, otherwise "Account" or "Wallet"
 */
const getEntityTypeSuffix = (entityType: string): string => {
  // Entity types that should show "Deposit Address"
  const depositAddressTypes = [
    'centralized exchange',
    'decentralized exchange',
    'money services business',
    'msb',
    'payment processor',
    'bank',
    'financial institution',
    'investment fund',
    'hedge fund',
    'asset management',
    'brokerage',
    'trading platform',
    'exchange',
    'otc desk',
    'atm operator',
    'remittance service',
    'money transfer',
    'payment gateway',
    'escrow service'
  ];
  
  if (depositAddressTypes.includes(entityType.toLowerCase())) {
    return 'Deposit Address';
  }
  
  // For other entity types, use "Account" or "Wallet" based on context
  if (entityType.toLowerCase().includes('wallet') || 
      entityType.toLowerCase().includes('personal') ||
      entityType.toLowerCase().includes('individual')) {
    return 'Wallet';
  }
  
  return 'Account';
}

/**
 * Determines the appropriate title based on entity type
 * Format: "Entity: BeneficialOwner Suffix"
 */
const getEntityTypeBasedTitle = (
  entityName: string,
  entityType: string,
  beneficialOwnerName: string
): string => {
  // Special case for custodian entities
  if (entityType === 'custodian') {
    return `${entityName}: ${beneficialOwnerName} Custodial Account`;
  }
  
  // Get the appropriate suffix based on the entity's type (not beneficial owner's type)
  const suffix = getEntityTypeSuffix(entityType);
  
  // Format: "Entity: BeneficialOwner Suffix"
  return `${entityName}: ${beneficialOwnerName} ${suffix}`;
}

/**
 * Applies beneficial owner override logic to address metadata
 * If beneficial_owner.entity_id != entity.entity_id, use beneficial owner's metadata
 * Otherwise, fall back to original entity values
 */
export const applyBeneficialOwnerOverride = (
  attributionData: AttributionData,
  entitySOTData: SOTEntity | undefined,
  beneficialOwnerSOTData: SOTEntity | undefined,
  sotData: SOTEntity[] = []
): {
  entityName: string;
  entityType: string;
  entityTags: string[];
  logo: string | undefined;
  ofac: boolean;
  isBeneficialOwnerOverride: boolean;
  displayTitle: string;
} => {
  const { entity: entityId, bo: beneficialOwnerId } = attributionData;
  
  // Debug: Search for wrapped bitcoin entries in SOT data (run once)
  if (entityId === 'wrapped_bitcoin' && !(window as any).wrappedBitcoinSearchDone) {
    (window as any).wrappedBitcoinSearchDone = true;
    
    // We need to access the SOT data from somewhere - let's add a global search
    console.warn('🔍 SEARCHING FOR WRAPPED BITCOIN IN SOT DATA...');
    console.warn('This search will show what wrapped bitcoin related entries exist in the SOT database');
  }
  
  // Check if beneficial owner exists and has different entity_id
  if (beneficialOwnerId && beneficialOwnerId !== entityId && beneficialOwnerSOTData) {
    const entityName = entitySOTData?.proper_name || entityId;
    const entityType = entitySOTData?.entity_type || "unknown"; // Don't default to wallet here
    const beneficialOwnerName = beneficialOwnerSOTData.proper_name;
    
    // Debug: Log the SOT lookup for the original entity
    console.warn('🔍 SOT lookup for original entity:', {
      entityId,
      entitySOTData,
      entityType,
      beneficialOwnerId,
      beneficialOwnerSOTData
    });
    
    // Debug: Search for wrapped bitcoin in SOT data
    if (entityId === 'wrapped_bitcoin') {
      const wrappedBitcoinEntries = sotData.filter(e => 
        e.entity_id?.toLowerCase().includes('wrapped') || 
        e.entity_id?.toLowerCase().includes('bitcoin') ||
        e.proper_name?.toLowerCase().includes('wrapped') ||
        e.proper_name?.toLowerCase().includes('bitcoin')
      );
      
      // Also search for exact matches and variations
      const exactMatch = sotData.find(e => e.entity_id === 'wrapped_bitcoin');
      const wbtcEntries = sotData.filter(e => 
        e.entity_id?.toLowerCase().includes('wbtc') ||
        e.proper_name?.toLowerCase().includes('wbtc')
      );
      const wrappedEntries = sotData.filter(e => 
        e.entity_id?.toLowerCase().startsWith('wrapped') ||
        e.proper_name?.toLowerCase().startsWith('wrapped')
      );
      
      console.warn('🔍 Comprehensive Wrapped Bitcoin search in SOT:', {
        totalSOTEntries: sotData.length,
        exactMatch: exactMatch ? {
          entity_id: exactMatch.entity_id,
          proper_name: exactMatch.proper_name,
          entity_type: exactMatch.entity_type
        } : 'NOT FOUND',
        wbtcEntries: wbtcEntries.map(e => ({
          entity_id: e.entity_id,
          proper_name: e.proper_name,
          entity_type: e.entity_type
        })),
        wrappedEntries: wrappedEntries.map(e => ({
          entity_id: e.entity_id,
          proper_name: e.proper_name,
          entity_type: e.entity_type
        })),
        allWrappedBitcoinEntries: wrappedBitcoinEntries.map(e => ({
          entity_id: e.entity_id,
          proper_name: e.proper_name,
          entity_type: e.entity_type
        }))
      });
    }
    
    console.log('Applying beneficial owner override:', {
      originalEntity: entityId,
      beneficialOwner: beneficialOwnerId,
      originalName: entityName,
      beneficialOwnerName: beneficialOwnerName,
      originalType: entityType
    });
    
    // Create display title: "Entity: BeneficialOwner Suffix"
    const displayTitle = getEntityTypeBasedTitle(
      entityName,
      entityType,
      beneficialOwnerName
    );
    
    return {
      entityName: beneficialOwnerSOTData.proper_name,
      entityType: beneficialOwnerSOTData.entity_type,
      entityTags: beneficialOwnerSOTData.entity_tags || [],
      logo: beneficialOwnerSOTData.logo,
      ofac: beneficialOwnerSOTData.ofac || false,
      isBeneficialOwnerOverride: true,
      displayTitle
    };
  }
  
  // No override needed, return original entity without any suffix.
  // Suffixes like "Deposit Address" or "Custodial Account" are display-only for BO overrides.
  const entityName = entitySOTData?.proper_name || entityId;
  const entityType = entitySOTData?.entity_type || "unknown"; // Don't default to wallet here
  const displayTitle = entityName;
  
  // Debug: Log when no beneficial owner override is applied
  if (entityId === 'wrapped_bitcoin') {
    console.warn('🔍 No beneficial owner override for wrapped_bitcoin:', {
      entityId,
      entitySOTData,
      entityType,
      beneficialOwnerId
    });
  }
  
  return {
    entityName,
    entityType,
    entityTags: entitySOTData?.entity_tags || [],
    logo: entitySOTData?.logo,
    ofac: entitySOTData?.ofac || false,
    isBeneficialOwnerOverride: false,
    displayTitle
  };
} 