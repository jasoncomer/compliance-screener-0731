import { IBtcAddress, IBtcAddressSummary } from "../typings/BtcAddress";
import { BtcTransaction } from "../typings/BtcTransaction";
import { axiosInstance } from "./api";

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

const getAddress = async (address: string) => {
  const res = await axiosInstance.get(`/blockchain/address/${address}`);
  const txData = (res.data.txData as BtcTransaction[]).sort((a, b) => b.block - a.block);
  return {
    data: res.data.data as IBtcAddress,
    txData,
  };
};

const generateReport = async (address: string) => {
  const res = await axiosInstance.post(`/report`, { address });
  return res.data;
};

const getSOT = async () => {
  // set axios timeout to 10 seconds
  const res = await axiosInstance.get(`/blockchain/sot`, { timeout: 20000 });
  return res.data;
};

export const blockchain = {
  generateReport,
  getAddress,
  getAddressSummary,
  getBlock,
  getTransaction,
  getSOT,
};
