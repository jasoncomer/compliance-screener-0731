import { axiosInstance } from '../api';
import { BtcTransaction } from '../../typings/BtcTransaction';

interface GetAddressTransactionsResponseData {
  txs: BtcTransaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTxs: number;
    limit: number;
  }
}

export const getAddressTransactions = async (address: string, params: { page: number, limit: number }) => {
  const res = await axiosInstance.get<GetAddressTransactionsResponseData>(`/blockchain/address/${address}/transactions?page=${params.page}&limit=${params.limit}`);
  return res.data;
};

interface GetAddressSummaryResponseData {
  address: string;
  totalIn: number;
  totalOut: number;
  balance: number;
}

export const getAddressSummary = async (address: string) => {
  const res = await axiosInstance.get<GetAddressSummaryResponseData>(`/blockchain/address/${address}/summary`);
  return res.data;
};