import { axiosInstance } from "./api";

interface CryptoPrices {
  [symbol: string]: {
    price: number;
    symbol: string;
  }
}

interface HistoricalPrice {
  timestamp: number;
  price: number;
}

const getPrices = async (): Promise<CryptoPrices> => {
  const res = await axiosInstance.get('/crypto/prices');
  return res.data.data;
}

const getHistoricalPrices = async (params: {
  from: string | number;
  to: string | number;
  interval?: '5m' | 'hourly' | 'daily';
}): Promise<HistoricalPrice[]> => {
  const res = await axiosInstance.get('/crypto/prices/historical', { params });
  return res.data;
}

export const crypto = {
  getPrices,
  getHistoricalPrices,
};