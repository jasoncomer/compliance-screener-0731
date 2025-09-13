import { axiosInstance } from './api';

export interface EntityBalance {
  entity_id: string;
  btc_bal: number;
  [key: string]: any; // For other fields from the sheet
}

export const getEntityBalance = async (entityId: string): Promise<EntityBalance> => {
  try {
    const response = await axiosInstance.get(`/entity-balance-sheet/${entityId}`);
    return response.data;
  } catch (error: any) {
    // Re-throw with more context for better error handling
    if (error.response?.status === 404) {
      throw new Error(`Entity balance data not found for: ${entityId}`);
    }
    throw error;
  }
};

export const getAllEntityBalances = async (): Promise<EntityBalance[]> => {
  const response = await axiosInstance.get('/entity-balance-sheet');
  return response.data;
}; 