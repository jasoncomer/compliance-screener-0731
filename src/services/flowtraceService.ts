import { axiosInstance, api } from '../api/api';

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
      .post(`/risk-scoring/calculate`, { identifier, type })
      .then(r => r.data);
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
    console.log('fetchBitcoinAttribution called for address:', address);
    return axiosInstance
      .get<BitcoinAttribution>(`/blockchain/bitcoin/attribution/${address}`)
      .then(r => {
        console.log('Bitcoin attribution API response:', r.data);
        return r.data;
      })
      .catch((error) => {
        console.error('Bitcoin attribution API error:', error);
        // If it's a 404, the address might not have attribution data, which is normal
        if (error.response?.status === 404) {
          console.log('Bitcoin attribution not found for address:', address);
          return null;
        }
        // For other errors, retry once after a short delay
        console.log('Retrying Bitcoin attribution request...');
        return new Promise<BitcoinAttribution | null>(resolve => {
          setTimeout(() => {
            axiosInstance
              .get<BitcoinAttribution>(`/blockchain/bitcoin/attribution/${address}`)
              .then(r => {
                console.log('Bitcoin attribution retry successful:', r.data);
                resolve(r.data);
              })
              .catch((retryError) => {
                console.error('Bitcoin attribution retry failed:', retryError);
                resolve(null);
              });
          }, 1000);
        });
      });
  },
  async fetchEntityProfile(address: string) {
    console.log('fetchEntityProfile called for address:', address);
    
    // First try to get Bitcoin attribution data
    const bitcoinAttr = await this.fetchBitcoinAttribution(address);
    console.log('Bitcoin attribution result:', bitcoinAttr);
    console.log('Bitcoin attribution type:', typeof bitcoinAttr);
    console.log('Bitcoin attribution keys:', bitcoinAttr ? Object.keys(bitcoinAttr) : 'null/undefined');
    
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
    
    console.log('General attribution result:', attr);
    console.log('Risk score result:', risk);
    console.log('Risk score type:', typeof risk);
    console.log('Risk score keys:', risk ? Object.keys(risk) : 'null/undefined');
    console.log('Risk score value:', (risk as any)?.score);
    console.log('Risk score data:', (risk as any)?.data);
    
    // Use Bitcoin attribution if available, otherwise fall back to general attribution
    let entityInfo = null;
    if (bitcoinAttr && bitcoinAttr.data) {
      console.log('Using Bitcoin attribution data');
      entityInfo = {
        entityId: bitcoinAttr.data.entity,
        entityType: bitcoinAttr.data.entity === 'bittrex' ? 'exchange' : 'wallet', // Bittrex should be exchange
        label: bitcoinAttr.data.entity,
        bo: bitcoinAttr.data.bo,
        custodian: bitcoinAttr.data.custodian,
      };
    } else {
      console.log('Bitcoin attribution not found, trying general attribution');
      const entry = Array.isArray((attr as any)?.data) ? (attr as any).data.find((a: any) => a.address === address) : undefined;
      if (entry) {
        entityInfo = {
          entityId: entry?.entityId || entry?.entity_id,
          entityType: entry?.entityType || entry?.entity_type,
          label: entry?.label || entry?.name,
        };
      }
    }
    
    console.log('Entity info:', entityInfo);
    
    // Simple logo URL construction - let image loading handle existence check
    let logoUrl: string | null = null;
    if (entityInfo?.entityId) {
      console.log('🔍 Constructing logo URL for entity:', entityInfo.entityId);
      
      // Try JPG first (since we know bittrex.jpg exists)
      logoUrl = `https://storage.googleapis.com/entity-logos/${entityInfo.entityId}.jpg`;
      console.log('✅ Constructed logo URL:', logoUrl);
    } else {
      console.log('🔍 No entityId found, skipping logo fetch. EntityInfo:', entityInfo);
    }
    
    // If no logo from SOT and entityType exists, try fallback from main SOT data
    if (!logoUrl && entityInfo?.entityType) {
      try {
        console.log('Fetching fallback logo for entityType:', entityInfo.entityType);
        
        // Get main SOT data to search for fallback logos
        const mainSotResponse = await this.fetchSOT().catch(() => null);
        if (mainSotResponse?.data) {
          // Look for entries that match the entity type and have fallback logos
          const mappingEntry = mainSotResponse.data.find((entry: any) => 
            entry.entity_type === entityInfo.entityType && (entry.fallback_logo || entry.logo)
          );
          console.log('Found mapping entry in main SOT for entityType:', entityInfo.entityType, mappingEntry);
          
          if (mappingEntry) {
            logoUrl = mappingEntry.fallback_logo || mappingEntry.logo;
            console.log('Found fallback logo from main SOT:', logoUrl);
          } else {
            // If no exact entity_type match, try to find any exchange with a logo as fallback
            if (entityInfo.entityType === 'exchange') {
              const exchangeEntry = mainSotResponse.data.find((entry: any) => 
                entry.entity_type === 'exchange' && entry.logo
              );
              if (exchangeEntry?.logo) {
                logoUrl = exchangeEntry.logo;
                console.log('Found generic exchange logo fallback:', logoUrl);
              }
            }
          }
        } else {
          console.log('No main SOT data available for fallback lookup');
        }
      } catch (error) {
        console.error('Fallback logo lookup failed:', error);
      }
    }
    
    console.log('🎯 Final logoUrl before result:', logoUrl);
    
    const result = {
      entityId: entityInfo?.entityId,
      entityType: entityInfo?.entityType,
      label: entityInfo?.label,
      bo: entityInfo?.bo,
      custodian: entityInfo?.custodian,
      riskScore: (risk as any)?.data?.overallRisk ? Math.round((risk as any).data.overallRisk * 100) : undefined,
      logoUrl,
    };
    
    console.log('fetchEntityProfile result:', result);
    return result;
  },
  fetchSOT() {
    return axiosInstance.get(`/sot`).then(r => r.data);
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


