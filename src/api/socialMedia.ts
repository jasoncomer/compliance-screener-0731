import { axiosInstance } from './api';

// Types
export interface Tweet {
  content: string;
  url: string;
  date: string;
  username: string;
  userDisplayName?: string;
  retweetCount?: number;
  likeCount?: number;
}

export interface NewsArticle {
  title: string;
  link: string;
  published: string;
  source?: string;
  description?: string;
}

export interface SocialMediaData {
  tweets: Tweet[];
  news: NewsArticle[];
  searchContext: 'address' | 'beneficial_owner' | 'entity';
  searchTerm: string;
}

export interface SocialMediaResponse {
  addressData: SocialMediaData;
  beneficialOwnerData?: SocialMediaData;
  entityData?: SocialMediaData;
}

export const socialMedia = {
  // Get social media data for an address with fallback logic
  getAddressData: async (address: string): Promise<SocialMediaResponse> => {
    const response = await axiosInstance.get(`/social-media/address/${address}`);
    return response.data;
  },

  // Get mentions data for a specific search context
  getMentionsData: async (searchTerm: string, context: 'address' | 'beneficial_owner' | 'entity'): Promise<SocialMediaData> => {
    const response = await axiosInstance.get(`/social-media/mentions/${searchTerm}`, {
      params: { context }
    });
    return response.data;
  }
}; 