import { axiosInstance, api } from '../api/api';
import { flowtraceOptimizedService } from './flowtraceOptimizedService';

export interface AddressDataResponse {
  address: string;
  balance?: number | string;
  txs?: number;
  usdValue?: number;
  network?: string;
  riskScore?: number;
  [key: string]: any;
}

export interface TransactionsResponse {
  txs: any[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface BitcoinAttribution {
  data: {
    addr: string;
    entity: string;
    bo: string;
    custodian: string;
  };
}

export const flowtraceService = {
  // NEW: Optimized FlowTrace methods
  async expandNodeOptimized(address: string, options?: { includeRiskScores?: boolean; includeTransactions?: boolean }) {
    return await flowtraceOptimizedService.expandNode(address, options);
  },

  async expandNodesBatchOptimized(addresses: string[], options?: { includeRiskScores?: boolean }) {
    return await flowtraceOptimizedService.expandNodesBatch(addresses, options);
  },

  // Legacy methods (kept for backward compatibility)
  fetchAddress(address: string) {
    return axiosInstance.get<AddressDataResponse>(`/blockchain/address/${address}`).then(r => r.data);
  },
  fetchAddressSummary(address: string) {
    return axiosInstance.get(`/blockchain/address/${address}/summary`).then(r => {
      // The aggregation returns an array, we need the first element
      const data = Array.isArray(r.data) ? r.data[0] : r.data;
      return data;
    });
  },
  fetchTransactions(address: string, page = 1, limit = 100) {
    return axiosInstance
      .get<TransactionsResponse>(`/blockchain/address/${address}/transactions`, { params: { page, limit } })
      .then(r => r.data);
  },
  fetchAllTransactions(address: string, chunkSize = 100) {
    return axiosInstance
      .get<TransactionsResponse>(`/blockchain/address/${address}/transactions`, { params: { page: 1, limit: chunkSize } })
      .then(r => r.data);
  },
  fetchRiskScore(identifier: string, type: 'address' | 'transaction' = 'address') {
    console.log('🔍 fetchRiskScore called for:', identifier, 'type:', type);
    return axiosInstance
      .post(`/risk-scoring/calculate`, { identifier, type }, { timeout: 10000 }) // 10 second timeout
      .then(r => {
        console.log('🔍 fetchRiskScore response for', identifier, ':', r.data);
        
        // Handle the response structure - check if it has success field
        if (r.data.success && r.data.data) {
          return r.data.data;
        } else if (r.data.overallRisk !== undefined) {
          // Direct response structure
          return r.data;
        } else {
          console.warn('Unexpected risk score response structure:', r.data);
          return r.data;
        }
      })
      .catch(error => {
        console.error('🔍 fetchRiskScore error for', identifier, ':', error);
        throw error;
      });
  },
  fetchBlockStats(address: string) {
    return axiosInstance
      .get(`/blockchain/transactions/${address}/getBlockStats`)
      .then(r => r.data);
  },
  fetchAttribution(addresses: string[]) {
    return axiosInstance
      .post(`/attribution/addresses`, { addresses })
      .then(r => r.data);
  },
  // New method to fetch Bitcoin attribution data
  fetchBitcoinAttribution(address: string) {
    return axiosInstance
      .get<BitcoinAttribution>(`/blockchain/bitcoin/attribution/${address}`)
      .then(r => r.data)
      .catch((error) => {
        console.error('Bitcoin attribution API error:', error);
        // If it's a 404, the address might not have attribution data, which is normal
        if (error.response?.status === 404) {
          return null;
        }
        // For other errors, retry once after a short delay
        return new Promise<BitcoinAttribution | null>(resolve => {
          setTimeout(() => {
            axiosInstance
              .get<BitcoinAttribution>(`/blockchain/bitcoin/attribution/${address}`)
              .then(r => resolve(r.data))
              .catch((retryError) => {
                console.error('Bitcoin attribution retry failed:', retryError);
                resolve(null);
              });
          }, 1000);
        });
      });
  },
  async fetchEntityProfile(address: string) {
    // First try to get Bitcoin attribution data
    const bitcoinAttr = await this.fetchBitcoinAttribution(address);
    
    // Combine attribution + risk score for an address
    const [attr, risk] = await Promise.all([
      this.fetchAttribution([address]).catch((error) => {
        console.error('fetchAttribution error:', error);
        return { data: [] };
      }),
      this.fetchRiskScore(address, 'address').catch((error) => {
        console.error('fetchRiskScore error:', error);
        return { score: undefined };
      }),
    ]);
    
    // Debug risk score data
    console.log('🔍 Risk score data for', address, ':', {
      risk,
      riskType: typeof risk,
      riskData: risk?.data,
      overallRisk: risk?.data?.overallRisk,
      riskKeys: risk ? Object.keys(risk) : [],
      riskDataKeys: risk?.data ? Object.keys(risk.data) : [],
      expectedStructure: 'API returns: { success: true, data: { overallRisk: 0.75, ... } }'
    });
    
    // Use Bitcoin attribution if available, otherwise fall back to general attribution
    let entityInfo = null;
    if (bitcoinAttr && bitcoinAttr.data) {
      console.log('Using Bitcoin attribution data for entity:', bitcoinAttr.data.entity);
      
      // Get SOT data to determine proper entity type
      let entityType = 'wallet'; // default fallback
      try {
        const sotEntry = await this.fetchSOTByEntityId(bitcoinAttr.data.entity);
        console.log('SOT Response received for entity:', bitcoinAttr.data.entity, sotEntry);
        
        if (sotEntry?.entity_type) {
          entityType = sotEntry.entity_type;
          console.log('✅ Found SOT entity_type:', entityType, 'for entity:', bitcoinAttr.data.entity);
        } else {
          console.log('❌ No SOT entry found for entity:', bitcoinAttr.data.entity);
        }
      } catch (error) {
        console.error('Error fetching SOT data for entity:', bitcoinAttr.data.entity, error);
      }
      
      entityInfo = {
        entityId: bitcoinAttr.data.entity,
        entityType: entityType,
        label: bitcoinAttr.data.entity,
        bo: bitcoinAttr.data.bo,
        custodian: bitcoinAttr.data.custodian,
      };
    } else {
      const entry = Array.isArray((attr as any)?.data) ? (attr as any).data.find((a: any) => a.address === address) : undefined;
      if (entry) {
        // Get SOT data to determine proper entity type for general attribution
        let entityType = entry?.entityType || entry?.entity_type || 'wallet';
        console.log('General attribution - initial entityType:', entityType, 'from entry:', { 
          entityType: entry?.entityType, 
          entity_type: entry?.entity_type,
          entityId: entry?.entityId,
          entity_id: entry?.entity_id,
          fullEntry: entry
        });
        try {
          if (entry?.entityId || entry?.entity_id) {
            const entityId = entry?.entityId || entry?.entity_id;
            console.log('General attribution - Looking for entity:', entityId);
            
            const sotEntry = await this.fetchSOTByEntityId(entityId);
            console.log('General attribution - SOT Response received for entity:', entityId, sotEntry);
            
            if (sotEntry?.entity_type) {
              entityType = sotEntry.entity_type;
              console.log('✅ General attribution - Found SOT entity_type:', entityType, 'for entity:', entityId);
            } else {
              console.log('❌ General attribution - No SOT entry found for entity:', entityId);
            }
          } else {
            console.log('General attribution - No entityId found in entry');
          }
        } catch (error) {
          console.error('Error fetching SOT data for general attribution:', error);
        }
        
        entityInfo = {
          entityId: entry?.entityId || entry?.entity_id,
          entityType: entityType,
          label: entry?.label || entry?.name,
        };
      }
    }
    
    // Simple logo URL construction - let image loading handle existence check
    let logoUrl: string | null = null;
    if (entityInfo?.entityId) {
      // Try JPG first (since we know bittrex.jpg exists)
      logoUrl = `https://storage.googleapis.com/entity-logos/${entityInfo.entityId}.jpg`;
    }
    
    // Fetch SOT data to get proper_name and fallback logo
    let properName: string | null = null;
    if (entityInfo?.entityId) {
      try {
        // Use the address-specific SOT endpoint instead of loading entire dataset
        const sotEntry = await this.fetchSOTByEntityId(entityInfo.entityId);
        if (sotEntry) {
          properName = sotEntry.proper_name;
          
          // Also get logo from SOT if not already found
          if (!logoUrl && sotEntry.logo) {
            logoUrl = sotEntry.logo;
          }
        }
      } catch (error) {
        console.error('SOT data lookup failed for entity:', entityInfo.entityId, error);
      }
    }
    
    // If no logo from SOT and entityType exists, try fallback from main SOT data
    if (!logoUrl && entityInfo?.entityType) {
      try {
        // For now, skip the fallback logo lookup to avoid loading entire SOT dataset
        // This can be optimized later with a specific endpoint for entity type logos
        console.log('Skipping fallback logo lookup to avoid memory issues');
      } catch (error) {
        console.error('Fallback logo lookup failed:', error);
      }
    }
    
    const result = {
      entityId: entityInfo?.entityId,
      entityType: entityInfo?.entityType,
      label: entityInfo?.label,
      properName: properName,
      bo: entityInfo?.bo,
      custodian: entityInfo?.custodian,
      riskScore: (() => {
        // The risk scoring API returns: { success: true, data: { overallRisk: 0.75, ... } }
        if ((risk as any)?.data?.overallRisk !== undefined) {
          return Math.round((risk as any).data.overallRisk * 100);
        } else if ((risk as any)?.overallRisk !== undefined) {
          return Math.round((risk as any).overallRisk * 100);
        } else if ((risk as any)?.score !== undefined) {
          return Math.round((risk as any).score * 100);
        } else if (typeof (risk as any)?.data === 'number') {
          return Math.round((risk as any).data * 100);
        } else if (typeof (risk as any) === 'number') {
          return Math.round((risk as any) * 100);
        }
        return undefined;
      })(),
      logoUrl,
    };
    
    // Debug logging for risk score
    console.log('🔍 fetchEntityProfile result for', address, ':', {
      riskScore: result.riskScore,
      riskData: risk,
      entityId: result.entityId,
      properName: result.properName
    });
    
    return result;
  },
  fetchSOT() {
    return axiosInstance.get(`/sot`).then(r => r.data);
  },
  async fetchSOTByEntityId(entityId: string) {
    try {
      const response = await axiosInstance.get(`/sot/entity/${entityId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('SOT entry not found for entity:', entityId);
        return null;
      }
      throw error;
    }
  },
  async fetchTotals(address: string) {
    const [txs] = await Promise.all([
      this.fetchTransactions(address, 1, 1).catch(() => ({ txs: [], pagination: { totalTxs: 0 } } as any)),
    ]);
    const totalTxs = (txs as any)?.pagination?.totalTxs ?? (txs as any)?.total ?? 0;
    return { totalTxs };
  },

  // Note-related methods
  async fetchAddressNotes(address: string, organizationId?: string) {
    const orgId = organizationId ?? localStorage.getItem('organizationId') ?? '';
    return api.notes.getAddressNotes(orgId, address);
  },

  async createAddressNote(address: string, content: string, organizationId?: string) {
    const orgId = organizationId ?? localStorage.getItem('organizationId') ?? '';
    return api.notes.create(orgId, {
      address,
      content,
      type: 'address'
    });
  },

  async updateNote(noteId: string, content: string, organizationId?: string) {
    const orgId = organizationId ?? localStorage.getItem('organizationId') ?? '';
    return api.notes.update(orgId, noteId, { content });
  },

  async deleteNote(noteId: string, organizationId?: string) {
    const orgId = organizationId ?? localStorage.getItem('organizationId') ?? '';
    return api.notes.delete(orgId, noteId);
  },
};


