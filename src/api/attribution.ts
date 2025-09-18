import { axiosInstance } from './api';

// This file is deprecated - use sot.getRelatedEntities instead
// Keeping this file for backward compatibility but redirecting to the main function

const getRelatedEntities = async (entity: string) => {
  console.warn('attribution.getRelatedEntities is deprecated. Use sot.getRelatedEntities instead.');
  
  try {
    const response = await axiosInstance.get(`/attribution/entity/${entity}/unique-values`);
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