import { axiosInstance } from './api';

const getRelatedEntities = async (entity: string) => {
  try {
    const response = await axiosInstance.get(`/attribution/entity/${entity}/unique-values`, {
      params: {
        entity: entity
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out while fetching related entities for entity:', entity);
      throw new Error('The request took too long to complete. Please try again or contact support if the issue persists.');
    }
    console.error('Error fetching related entities:', error);
    throw error;
  }
};

export const attribution = {
  getRelatedEntities,
};