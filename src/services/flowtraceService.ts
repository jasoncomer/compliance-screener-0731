import { api, axiosInstance } from '../api/api';

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
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalTxs: number;
    limit: number;
  };
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
  // Legacy methods for backward compatibility
  // NOTE: New code should use api.blockchain, api.riskScoring with React Query hooks (useFlowtraceQueries.ts)
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
    return axiosInstance
      .post(`/risk-scoring/calculate`, { identifier, type }, { timeout: 10000 }) // 10 second timeout
      .then(r => {
        
        // Handle the response structure - check if it has success field
        if (r.data.success && r.data.data) {
          return r.data.data;
        } else if (r.data.overallRisk !== undefined) {
          // Direct response structure
          return r.data;
        } else {
          return r.data;
        }
      })
      .catch(error => {
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
              .catch(() => {
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
      this.fetchAttribution([address]).catch(() => {
        return { data: [] };
      }),
      this.fetchRiskScore(address, 'address').catch(() => {
        return { score: undefined };
      }),
    ]);
    
    
    // Prioritize Bitcoin attribution for Bitcoin addresses, but validate with SOT data
    let entityInfo = null;
    let primaryEntityId = null;
    let primaryEntityType = 'wallet';
    let primaryLabel = null;
    let primaryBo = null;
    let primaryCustodian = null;
    
    if (bitcoinAttr && bitcoinAttr.data) {
      primaryEntityId = bitcoinAttr.data.entity;
      primaryLabel = bitcoinAttr.data.entity;
      primaryBo = bitcoinAttr.data.bo;
      primaryCustodian = bitcoinAttr.data.custodian;
    } else {
      // Fall back to general attribution
      const entry = Array.isArray((attr as any)?.data) ? (attr as any).data.find((a: any) => a.address === address) : undefined;
      if (entry) {
        primaryEntityId = entry?.entityId || entry?.entity_id;
        primaryLabel = entry?.label || entry?.name;
        primaryBo = entry?.bo;
        primaryCustodian = entry?.custodian;
      }
    }
    
    // Always fetch SOT data to get authoritative entity information
    if (primaryEntityId) {
      try {
        const sotEntry = await this.fetchSOTByEntityId(primaryEntityId);
        
        if (sotEntry) {
          // Use SOT data as the authoritative source
          primaryEntityType = sotEntry.entity_type || 'wallet';
          // Use proper_name from SOT if available, otherwise keep the original label
          if (sotEntry.proper_name) {
            primaryLabel = sotEntry.proper_name;
          }
        }
      } catch (error) {
        // SOT lookup failed, continue with existing data
        console.debug('Failed to fetch SOT data for entity:', primaryEntityId);
      }
    }
    
    entityInfo = {
      entityId: primaryEntityId,
      entityType: primaryEntityType,
      label: primaryLabel,
      bo: primaryBo,
      custodian: primaryCustodian,
    };
    
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
        // SOT lookup failed, continue without logo
        console.debug('Failed to fetch SOT data for logo:', entityInfo.entityId);
      }
    }
    
    // Note: Fallback logo lookup is skipped to avoid loading entire SOT dataset
    // This can be optimized later with a specific endpoint for entity type logos
    
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
    
    
    return result;
  },
  fetchSOT() {
    return axiosInstance.get(`/sot`).then(r => r.data);
  },
  async fetchSOTByEntityId(entityId: string) {
    try {
      // First try to get SOT data from Redux store (faster, no API call needed)
      const sotData = await this.getSOTDataFromStore();
      if (sotData && sotData[entityId]) {
        return sotData[entityId];
      }
      
      // Fallback to API call if not in store
      const response = await axiosInstance.get(`/sot/entity/${entityId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getSOTDataFromStore() {
    try {
      // For now, return null to avoid authentication issues
      // The SOT data should be available in the component via Redux
      return null;
    } catch (error) {
      return null;
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
    const orgId = organizationId ?? localStorage.getItem('organizationId');
    if (!orgId) {
      throw new Error('Organization ID is required to fetch notes');
    }
    return api.notes.getAddressNotes(orgId, address);
  },

  async createAddressNote(address: string, content: string, organizationId?: string) {
    const orgId = organizationId ?? localStorage.getItem('organizationId');
    if (!orgId) {
      throw new Error('Organization ID is required to create notes');
    }
    return api.notes.create(orgId, {
      address,
      content,
      type: 'address'
    });
  },

  async fetchClusterNotes(cospendId: string, organizationId?: string) {
    const orgId = organizationId ?? localStorage.getItem('organizationId');
    if (!orgId) {
      throw new Error('Organization ID is required to fetch cluster notes');
    }
    return api.notes.getClusterNotes(orgId, cospendId);
  },

  async createClusterNote(cospendId: string, content: string, organizationId?: string) {
    const orgId = organizationId ?? localStorage.getItem('organizationId');
    if (!orgId) {
      throw new Error('Organization ID is required to create cluster notes');
    }
    return api.notes.create(orgId, {
      cospendId,
      content,
      type: 'cluster'
    });
  },

  async updateNote(noteId: string, content: string, organizationId?: string) {
    const orgId = organizationId ?? localStorage.getItem('organizationId');
    if (!orgId) {
      throw new Error('Organization ID is required to update notes');
    }
    return api.notes.update(orgId, noteId, { content });
  },

  async deleteNote(noteId: string, organizationId?: string) {
    const orgId = organizationId ?? localStorage.getItem('organizationId');
    if (!orgId) {
      throw new Error('Organization ID is required to delete notes');
    }
    return api.notes.delete(orgId, noteId);
  },
};


