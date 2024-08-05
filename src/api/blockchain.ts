import { BtcTransaction } from "../typings/BtcTransaction";
import { satsToBTC } from "../utils/crypto";
import { axiosInstance } from "./api";

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
    data: res.data.data,
    txData: res.data.txData,
  };
};

export const blockchain = {
  getAddress,
  getBlock,
  getTransaction,
};