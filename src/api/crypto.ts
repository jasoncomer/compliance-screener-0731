import { axiosInstance } from "./api";

interface CryptoPrices {
  [symbol: string]: {
    price: number;
    symbol: string;
  }
}

const getPrices = async (): Promise<CryptoPrices> => {
  const res = await axiosInstance.get('/crypto/prices');
  return res.data.data;
}

export const crypto = {
  getPrices,
};