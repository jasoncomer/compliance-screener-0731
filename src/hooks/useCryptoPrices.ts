import { useCallback, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { api } from '../api/api';

export type TTickerSymbol = 'BTC';

interface CryptoPrices {
  [key: string]: {
    price: number;
    lastUpdated: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Query keys for crypto prices
export const cryptoPricesQueryKeys = {
  all: ['crypto-prices'] as const,
};

export const useCryptoPrices = () => {
  const { data: prices = {}, isLoading, error } = useQuery<CryptoPrices>({
    queryKey: cryptoPricesQueryKeys.all,
    queryFn: async () => {
      const response = await api.crypto.getPrices();
      
      const newPrices: CryptoPrices = {};
      Object.entries(response.data).forEach(([symbol, data]: [string, any]) => {
        newPrices[symbol] = {
          price: data.price,
          lastUpdated: Date.now(),
        };
      });
      
      return newPrices;
    },
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION * 2, // 10 minutes
    refetchInterval: CACHE_DURATION,
  });

  const getPrice = useCallback((symbol: TTickerSymbol): number | null => {
    const priceData = prices[symbol];
    if (!priceData) return null;

    // Check if the price data is stale
    if (Date.now() - priceData.lastUpdated > CACHE_DURATION) {
      return priceData.price; // Return stale data while fetching
    }

    return priceData.price;
  }, [prices]);

  const memoizedPrices = useMemo(() => prices, [prices]);

  return {
    prices: memoizedPrices,
    isLoading,
    error,
    getPrice,
  };
}; 