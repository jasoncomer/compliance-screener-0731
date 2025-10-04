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
const HISTORICAL_CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds (same as backend)

// Query keys for crypto prices
export const cryptoPricesQueryKeys = {
  all: ['crypto-prices'] as const,
  historical: (date: string) => ['crypto-prices', 'historical', date] as const,
};

export const useCryptoPrices = () => {
  const { data: prices = {}, isLoading, error } = useQuery<CryptoPrices>({
    queryKey: cryptoPricesQueryKeys.all,
    queryFn: async () => {
      const response = await api.crypto.getPrices();

      const newPrices: CryptoPrices = {};
      Object.entries(response).forEach(([symbol, data]: [string, any]) => {
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

/**
 * Hook to fetch historical Bitcoin price for a specific date
 * @param date - Date string in YYYY-MM-DD format or UNIX timestamp
 * @param enabled - Whether the query should be enabled (default: true)
 */
export const useHistoricalBtcPrice = (date: string | number | null, enabled = true) => {
  // Convert date to YYYY-MM-DD format for cache key
  const dateKey = useMemo(() => {
    if (!date) return null;

    if (typeof date === 'number') {
      return new Date(date * 1000).toISOString().split('T')[0];
    }
    return date.split('T')[0];
  }, [date]);

  const { data, isLoading, error } = useQuery<number | null>({
    queryKey: cryptoPricesQueryKeys.historical(dateKey || ''),
    queryFn: async () => {
      if (!dateKey) return null;

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        console.error('Invalid date format:', dateKey);
        return null;
      }

      try {
        const targetDateObj = new Date(dateKey);
        const fromTimestamp = Math.floor(targetDateObj.getTime() / 1000);
        const toTimestamp = fromTimestamp + 86400; // Add one day in seconds

        const historicalData = await api.crypto.getHistoricalPrices({
          from: fromTimestamp,
          to: toTimestamp,
          interval: 'daily',
        });

        // Get the first price from the array
        if (!Array.isArray(historicalData) || historicalData.length === 0) {
          console.error('Invalid price data from API:', historicalData);
          return null;
        }

        return historicalData[0].price;
      } catch (error) {
        console.error('Error fetching historical Bitcoin price:', error);
        return null;
      }
    },
    enabled: enabled && !!dateKey,
    staleTime: HISTORICAL_CACHE_DURATION,
    gcTime: HISTORICAL_CACHE_DURATION * 2,
    retry: 1,
  });

  return {
    price: data,
    isLoading,
    error,
  };
}; 