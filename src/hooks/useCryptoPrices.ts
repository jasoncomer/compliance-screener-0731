import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/api';

export type TTickerSymbol = 'BTC';

interface CryptoPrices {
  [key: string]: {
    price: number;
    lastUpdated: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState<CryptoPrices>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.crypto.getPrices();
      
      const newPrices: CryptoPrices = {};
      Object.entries(response).forEach(([symbol, data]: [string, any]) => {
        newPrices[symbol] = {
          price: data.price,
          lastUpdated: Date.now(),
        };
      });
      
      setPrices(newPrices);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch crypto prices'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPrice = useCallback((symbol: TTickerSymbol): number | null => {
    const priceData = prices[symbol];
    if (!priceData) return null;

    // Check if the price data is stale
    if (Date.now() - priceData.lastUpdated > CACHE_DURATION) {
      fetchPrices(); // Trigger a refresh
      return priceData.price; // Return stale data while fetching
    }

    return priceData.price;
  }, [prices, fetchPrices]);

  useEffect(() => {
    fetchPrices();
    
    // Set up periodic refresh
    const intervalId = setInterval(fetchPrices, CACHE_DURATION);
    
    return () => clearInterval(intervalId);
  }, [fetchPrices]);

  const memoizedPrices = useMemo(() => prices, [prices]);

  return {
    prices: memoizedPrices,
    isLoading,
    error,
    getPrice,
    refreshPrices: fetchPrices,
  };
}; 