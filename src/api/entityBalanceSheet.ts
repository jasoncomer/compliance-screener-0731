import { axiosInstance } from './api';

export interface EntityBalance {
  entity_id: string;
  btc_bal: number;
  [key: string]: any; // For other fields from the sheet
}

export const getEntityBalance = async (entityId: string): Promise<EntityBalance> => {
  const response = await axiosInstance.get(`/entity-balance-sheet/${entityId}`);
  return response.data;
};

export const getAllEntityBalances = async (): Promise<EntityBalance[]> => {
  const response = await axiosInstance.get('/entity-balance-sheet');
  return response.data;
}; 