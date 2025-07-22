import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { SocialMediaResponse } from '../api/socialMedia';

// Query keys for social media data
export const socialMediaQueryKeys = {
  all: ['socialMedia'] as const,
  address: (address: string) => [...socialMediaQueryKeys.all, 'address', address] as const,
  mentions: (searchTerm: string, context: string) => [...socialMediaQueryKeys.all, 'mentions', searchTerm, context] as const,
};

// Hook for fetching social media data for an address
export const useSocialMediaData = (address: string) => {
  return useQuery<SocialMediaResponse>({
    queryKey: socialMediaQueryKeys.address(address),
    queryFn: async () => {
      console.log('useSocialMediaData - Fetching data for address:', address);
      try {
        const result = await api.socialMedia.getAddressData(address);
        console.log('useSocialMediaData - Received data:', result);
        return result;
      } catch (error) {
        console.error('useSocialMediaData - Error:', error);
        throw error;
      }
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching mentions data for a specific context
export const useMentionsData = (searchTerm: string, context: 'address' | 'beneficial_owner' | 'entity') => {
  return useQuery({
    queryKey: socialMediaQueryKeys.mentions(searchTerm, context),
    queryFn: async () => {
      const result = await api.socialMedia.getMentionsData(searchTerm, context);
      return result;
    },
    enabled: !!searchTerm && searchTerm.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}; 