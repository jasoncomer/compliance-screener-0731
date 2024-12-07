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

export const getAddressTransactions = async (address: string) => {
  const res = await axiosInstance.get<GetAddressTransactionsResponseData>(`/blockchain/address/${address}/transactions`);
  return res.data;
};