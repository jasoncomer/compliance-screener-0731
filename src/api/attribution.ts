import { axiosInstance } from './api';

export const getRelatedEntities = async (entity: string) => {
  try {
    const response = await axiosInstance.get(`/attribution/entity/${entity}/unique-values`);
    return response.data;
  } catch (error) {
    console.error('Error fetching related entities:', error);
    throw error;
  }
}; 