import { axiosInstance } from './api';

// Types
export interface NewsArticle {
  title: string;
  link: string;
  published: string;
  source?: string;
  description?: string;
}

export interface Tweet {
  content: string;
  url: string;
  date: string;
  username: string;
  userDisplayName?: string;
  retweetCount?: number;
  likeCount?: number;
}

export interface NewsData {
  news: NewsArticle[];
  tweets: Tweet[];
  searchContext: 'address' | 'beneficial_owner' | 'entity';
  searchTerm: string;
}

export interface NewsResponse {
  addressData: NewsData;
  beneficialOwnerData?: NewsData;
  entityData?: NewsData;
}

export const socialMedia = {
  // Get news data for an address
  getAddressData: async (address: string): Promise<NewsResponse> => {
    const response = await axiosInstance.get(`/social-media/address/${address}`);
    return response.data;
  },

  // Get news data for a specific search context
  getMentionsData: async (searchTerm: string, context: 'address' | 'beneficial_owner' | 'entity'): Promise<NewsData> => {
    const response = await axiosInstance.get(`/social-media/mentions/${searchTerm}`, {
      params: { context }
    });
    return response.data;
  }
}; 