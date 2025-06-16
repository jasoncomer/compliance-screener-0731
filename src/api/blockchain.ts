import { IBtcAddress, IBtcAddressSummary } from "../typings/BtcAddress";
import { BtcTransaction } from "../typings/BtcTransaction";
import { IAttribution, IReferenceAttribution } from "../typings/ReferenceAttribution";
import { axiosInstance } from "./api";
import { getAddressTransactions } from "./blockchain/address";


const getAttributions = async (addresses: string[]): Promise<{ data: IAttribution[], referenceData: IReferenceAttribution[] }> => {
  const res = await axiosInstance.post(`/blockchain/attributions`, { addresses });
  return res.data;
};

const getAddressSummary = async (address: string): Promise<IBtcAddressSummary> => {
  const res = await axiosInstance.get(`/blockchain/address/${address}/summary`);
  return res.data[0];
};

const getTransaction = async (txHash: string) => {
  const res = await axiosInstance.get<BtcTransaction>('/blockchain/transaction/' + txHash);
  return res.data;
};

const getBlock = async (height: number) => {
  try {
    // Validate block height
    if (!Number.isInteger(height) || height < 0) {
      throw new Error('Invalid block height');
    }

    const url = `/blockchain/block/${height}`;

    const res = await axiosInstance.get(url);
    console.log('Full API response:', {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      data: res.data,
      config: {
        url: res.config.url,
        method: res.config.method,
        headers: res.config.headers,
        baseURL: res.config.baseURL
      }
    });
    
    // Check if response is null or empty
    if (!res.data) {
      console.error('Block API returned empty response');
      throw new Error('Block not found or no data available');
    }

    // Validate the response data structure
    if (typeof res.data._id !== 'string' || typeof res.data.hash !== 'string') {
      console.error('Invalid block data structure:', res.data);
      throw new Error('Invalid block data structure received from API');
    }

    return res.data;
  } catch (error: any) {
    console.error('Error in getBlock:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    throw error;
  }
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

const getAddressBlockStats = async (address: string) => {
  const res = await axiosInstance.get(`/blockchain/transactions/${address}/getBlockStats`);
  return res.data.data;
};

const getBlockTransactions = async (height: number, params: { page: number, limit: number }) => {
  const res = await axiosInstance.get(`/blockchain/block/${height}/transactions?page=${params.page}&limit=${params.limit}`);
  return res.data;
};



export const blockchain = {
  generateReport,
  getAddress,
  getAddressSummary,
  getAttributions,
  getBlock,
  getTransaction,
  getAddressTransactions,
  getAddressBlockStats,
  getBlockTransactions,
};