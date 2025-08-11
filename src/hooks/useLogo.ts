import { useState, useEffect, useCallback } from 'react';
import { LogoService } from '../services/logoService';

interface UseLogoOptions {
  entityId?: string;
  entityType?: string;
  enableFallback?: boolean;
  cacheTime?: number; // in milliseconds
}

interface UseLogoReturn {
  logoUrl: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  uploadLogo: (file: File) => Promise<boolean>;
}

// Simple in-memory cache
const logoCache = new Map<string, { url: string | null; timestamp: number }>();

export const useLogo = (options: UseLogoOptions = {}): UseLogoReturn => {
  const {
    entityId,
    entityType,
    enableFallback = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = entityId ? `${entityId}-${entityType || 'no-type'}` : null;

  const fetchLogo = useCallback(async () => {
    if (!entityId) {
      setLogoUrl(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let url: string | null = null;

      if (enableFallback) {
        url = await LogoService.getLogoUrlWithFallback(entityId, entityType);
      } else {
        url = await LogoService.getLogoUrl(entityId, entityType);
      }

      setLogoUrl(url);

      // Cache the result
      if (cacheKey) {
        logoCache.set(cacheKey, {
          url,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logo';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, enableFallback, cacheKey]);

  const uploadLogo = useCallback(async (file: File): Promise<boolean> => {
    if (!entityId) {
      setError('Entity ID is required for logo upload');
      return false;
    }

    // Validate file
    const validation = LogoService.validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await LogoService.uploadLogo(file, entityId, entityType);
      
      if (result.success && result.url) {
        setLogoUrl(result.url);
        
        // Update cache
        if (cacheKey) {
          logoCache.set(cacheKey, {
            url: result.url,
            timestamp: Date.now(),
          });
        }
        
        return true;
      } else {
        setError(result.error || 'Failed to upload logo');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload logo';
      setError(errorMessage);
      console.error('Error uploading logo:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, cacheKey]);



  const refetch = useCallback(async () => {
    // Clear cache to force fresh fetch
    if (cacheKey) {
      logoCache.delete(cacheKey);
    }
    await fetchLogo();
  }, [fetchLogo, cacheKey]);

  useEffect(() => {
    if (!entityId) {
      setLogoUrl(null);
      return;
    }

    // Check cache first
    if (cacheKey && logoCache.has(cacheKey)) {
      const cached = logoCache.get(cacheKey)!;
      const isExpired = Date.now() - cached.timestamp > cacheTime;
      
      if (!isExpired) {
        setLogoUrl(cached.url);
        return;
      } else {
        // Remove expired cache entry
        logoCache.delete(cacheKey);
      }
    }

    fetchLogo();
  }, [entityId, entityType, enableFallback, cacheKey, cacheTime, fetchLogo]);

  return {
    logoUrl,
    isLoading,
    error,
    refetch,
    uploadLogo,
  };
};

// Hook for managing multiple logos
export const useLogos = (entityIds: string[], entityType?: string) => {
  const [logos, setLogos] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogos = useCallback(async () => {
    if (entityIds.length === 0) {
      setLogos({});
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const logoPromises = entityIds.map(async (entityId) => {
        const url = await LogoService.getLogoUrlWithFallback(entityId, entityType);
        return { entityId, url };
      });

      const results = await Promise.all(logoPromises);
      const logoMap: Record<string, string | null> = {};
      
      results.forEach(({ entityId, url }) => {
        logoMap[entityId] = url;
      });

      setLogos(logoMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logos';
      setError(errorMessage);
      console.error('Error fetching logos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityIds, entityType]);

  useEffect(() => {
    fetchLogos();
  }, [fetchLogos]);

  return {
    logos,
    isLoading,
    error,
    refetch: fetchLogos,
  };
}; 