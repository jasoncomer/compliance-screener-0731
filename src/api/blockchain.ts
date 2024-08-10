import { IBtcAddress, IBtcAddressSummary } from "../typings/BtcAddress";
import { BtcTransaction } from "../typings/BtcTransaction";
import { satsToBTC } from "../utils/crypto";
import { axiosInstance } from "./api";

const getAddressSummary = async (address: string): Promise<IBtcAddressSummary> => {
  const res = await axiosInstance.get(`/blockchain/address/${address}/summary`);
  return res.data;
};

const getTransaction = async (txHash: string) => {
  const res = await axiosInstance.get<BtcTransaction>('/blockchain/transaction/' + txHash);

  // TOOD: remove once we update db
  res.data.cpin.forEach((input) => {
    input.amt = satsToBTC(input.amt);
  });
  return res.data;
};

const getBlock = async (blockNumber: number) => {
  const res = await axiosInstance.get(`/blockchain/block/${blockNumber}`);
  return res.data;
};

const getAddress = async (address: string) => {
  const res = await axiosInstance.get(`/blockchain/address/${address}`);
  return {
    data: res.data.data as IBtcAddress,
    txData: res.data.txData as BtcTransaction[],
  };
};

const generateReport = async (address: string) => {
  const res = await axiosInstance.post(`/report`, { address });
  return res.data;
};

export const blockchain = {
  generateReport,
  getAddress,
  getAddressSummary,
  getBlock,
  getTransaction,
};