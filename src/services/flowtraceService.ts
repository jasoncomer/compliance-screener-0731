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
  fetchSOT() {
    return axiosInstance.get(`/sot`).then(r => r.data);
  },
};


