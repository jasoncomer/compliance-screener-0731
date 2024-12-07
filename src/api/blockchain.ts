import { IBtcAddress, IBtcAddressSummary } from "../typings/BtcAddress";
import { BtcTransaction } from "../typings/BtcTransaction";
import { SOT } from "../typings/interfaces";
import { IAttribution, IReferenceAttribution } from "../typings/ReferenceAttribution";
import { axiosInstance } from "./api";
import { getAddressTransactions } from "./blockchain/address";


const getAttributions = async (addresses: string[]): Promise<{ data: IAttribution[], referenceData: IReferenceAttribution[] }> => {
  const res = await axiosInstance.post(`/blockchain/attributions`, { addresses });
  return res.data;
};

const getAddressSummary = async (address: string): Promise<IBtcAddressSummary> => {
  const res = await axiosInstance.get(`/blockchain/address/${address}/summary`);
  return res.data;
};

const getTransaction = async (txHash: string) => {
  const res = await axiosInstance.get<BtcTransaction>('/blockchain/transaction/' + txHash);
  return res.data;
};

const getBlock = async (blockNumber: number) => {
  const res = await axiosInstance.get(`/blockchain/block/${blockNumber}`);
  return res.data;
};

interface GetAddressResponseData {
  data: IBtcAddress;
  txData: {
    totalTxs: number;
    txs: BtcTransaction[];
  };
}

const getAddress = async (address: string) => {
  const res = await axiosInstance.get<GetAddressResponseData>(`/blockchain/address/${address}`);
  return {
    data: res.data.data as IBtcAddress,
  };
};

const generateReport = async (address: string) => {
  const res = await axiosInstance.post(`/report`, { address });
  return res.data;
};

const getSOT = async () => {
  const res = await axiosInstance.get(`/blockchain/sot`, { timeout: 20000 });
  
  // TODO: fix the logo url for all SOTs in the sheet
  const sot = (res.data as SOT[]).map(item => {
    if (item.logo && !item.logo.startsWith('https://')) {
      item.logo = 'https://' + item.logo;
    }
    return item;
  });
  return sot;
};

export const updateSOT = async (id: string, data: Partial<SOT>): Promise<SOT> => {
  const response = await axiosInstance.put(`/blockchain/sot/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.data;
};

export const deleteSOT = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/blockchain/sot/${id}`);
};

export const blockchain = {
  generateReport,
  getAddress,
  getAddressSummary,
  getAttributions,
  getBlock,
  getTransaction,
  getSOT,
  updateSOT,
  deleteSOT,
  getAddressTransactions,
};