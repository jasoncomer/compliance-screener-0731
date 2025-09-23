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
 * Applies beneficial owner override logic to address metadata
 * If beneficial_owner.entity_id != entity.entity_id, use beneficial owner's metadata
 * Otherwise, fall back to original entity values
 */
export const applyBeneficialOwnerOverride = (
  attributionData: AttributionData,
  entitySOTData: SOTEntity | undefined,
  beneficialOwnerSOTData: SOTEntity | undefined,
  riskScores?: Record<string, any>,
  address?: string
): {
  entityName: string;
  entityType: string;
  entityTags: string[];
  logo: string | undefined;
  ofac: boolean;
  isBeneficialOwnerOverride: boolean;
  displayTitle: string;
  riskScore?: number;
  boRiskScore?: number;
} => {
  const { entity: entityId, bo: beneficialOwnerId } = attributionData;
  
  // Calculate risk score for the address (which represents the entity's risk score)
  const entityRiskScore = riskScores && address ? 
    (riskScores[address]?.overallRisk ? Math.round(riskScores[address].overallRisk * 100) : undefined) : 
    undefined;
  
  // For BO override: If BO has OFAC sanctions, override to 100%, otherwise use entity risk score
  let finalRiskScore = entityRiskScore;
  if (beneficialOwnerSOTData?.ofac || beneficialOwnerSOTData?.entity_tags?.includes('ofac sanctioned')) {
    finalRiskScore = 100;
  }

  // Check if beneficial owner exists and has different entity_id
  if (beneficialOwnerId && beneficialOwnerId !== entityId && beneficialOwnerSOTData) {
    const entityName = entitySOTData?.proper_name || entityId;
    const beneficialOwnerName = beneficialOwnerSOTData.proper_name;
    
    // Simple display title: "Entity: BeneficialOwner"
    const displayTitle = `${entityName}: ${beneficialOwnerName}`;
    
    return {
      entityName: beneficialOwnerSOTData.proper_name,
      entityType: beneficialOwnerSOTData.entity_type,
      entityTags: beneficialOwnerSOTData.entity_tags || [],
      logo: beneficialOwnerSOTData.logo,
      ofac: beneficialOwnerSOTData.ofac || false,
      isBeneficialOwnerOverride: true,
      displayTitle,
      riskScore: finalRiskScore,
      boRiskScore: finalRiskScore
    };
  }
  
  // No override needed, return original entity
  const entityName = entitySOTData?.proper_name || entityId;
  const displayTitle = entityName;
  
  return {
    entityName,
    entityType: entitySOTData?.entity_type || "unknown",
    entityTags: entitySOTData?.entity_tags || [],
    logo: entitySOTData?.logo,
    ofac: entitySOTData?.ofac || false,
    isBeneficialOwnerOverride: false,
    displayTitle,
    riskScore: entityRiskScore
  };
};