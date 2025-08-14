import { axiosInstance } from '../api/api';

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

export const flowtraceService = {
  fetchAddress(address: string) {
    return axiosInstance.get<AddressDataResponse>(`/blockchain/address/${address}`).then(r => r.data);
  },
  fetchTransactions(address: string, page = 1, limit = 100) {
    return axiosInstance
      .get<TransactionsResponse>(`/blockchain/address/${address}/transactions`, { params: { page, limit } })
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
  async fetchEntityProfile(address: string) {
    // Combine attribution + risk score for an address
    const [attr, risk] = await Promise.all([
      this.fetchAttribution([address]).catch(() => ({ data: [] })),
      this.fetchRiskScore(address, 'address').catch(() => ({ score: undefined })),
    ]);
    const entry = Array.isArray((attr as any)?.data) ? (attr as any).data.find((a: any) => a.address === address) : undefined;
    return {
      entityId: entry?.entityId || entry?.entity_id,
      entityType: entry?.entityType || entry?.entity_type,
      label: entry?.label || entry?.name,
      riskScore: (risk as any)?.score,
    } as { entityId?: string; entityType?: string; label?: string; riskScore?: number };
  },
  fetchSOT() {
    return axiosInstance.get(`/sot`).then(r => r.data);
  },
  fetchAddressSummary(address: string) {
    return axiosInstance.get(`/blockchain/address/${address}/summary`).then(r => r.data);
  },
  async fetchTotals(address: string) {
    const [txs] = await Promise.all([
      this.fetchTransactions(address, 1, 1).catch(() => ({ txs: [], pagination: { totalTxs: 0 } } as any)),
    ]);
    const totalTxs = (txs as any)?.pagination?.totalTxs ?? (txs as any)?.total ?? 0;
    return { totalTxs };
  },
};


