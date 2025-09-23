import { useCallback,useEffect, useState } from 'react';

interface UseLogoOptions {
  entityId?: string;
  entityType?: string;
  enableFallback?: boolean;
  cacheTime?: number;
}

interface UseLogoReturn {
  logoUrl: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
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
      // Try JPG first, then PNG if JPG fails
      const jpgUrl = `https://storage.googleapis.com/entity-logos/${entityId}.jpg`;
      const pngUrl = `https://storage.googleapis.com/entity-logos/${entityId}.png`;
      
      // Create a test image to check if JPG exists
      const testImg = new Image();
      testImg.onload = () => {
        setLogoUrl(jpgUrl);
        
        // Cache the successful result
        if (cacheKey) {
          logoCache.set(cacheKey, {
            url: jpgUrl,
            timestamp: Date.now(),
          });
        }
      };
      
      testImg.onerror = () => {
        // Try PNG if JPG fails
        const testPngImg = new Image();
        testPngImg.onload = () => {
          setLogoUrl(pngUrl);
          
          // Cache the successful result
          if (cacheKey) {
            logoCache.set(cacheKey, {
              url: pngUrl,
              timestamp: Date.now(),
            });
          }
        };
        
        testPngImg.onerror = () => {
          // Try entity-type fallback if enabled
          if (enableFallback && entityType) {
            const typeJpgUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.jpg`;
            const typePngUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.png`;
            
            const testTypeImg = new Image();
            testTypeImg.onload = () => {
              setLogoUrl(typeJpgUrl);
              
              // Cache the successful result
              if (cacheKey) {
                logoCache.set(cacheKey, {
                  url: typeJpgUrl,
                  timestamp: Date.now(),
                });
              }
            };
            
            testTypeImg.onerror = () => {
              const testTypePngImg = new Image();
              testTypePngImg.onload = () => {
                setLogoUrl(typePngUrl);
                
                // Cache the successful result
                if (cacheKey) {
                  logoCache.set(cacheKey, {
                    url: typePngUrl,
                    timestamp: Date.now(),
                  });
                }
              };
              
              testTypePngImg.onerror = () => {
                setLogoUrl(null);
                setError('No logo found');
                
                // Cache the null result
                if (cacheKey) {
                  logoCache.set(cacheKey, {
                    url: null,
                    timestamp: Date.now(),
                  });
                }
              };
              
              testTypePngImg.src = typePngUrl;
            };
            
            testTypeImg.src = typeJpgUrl;
          } else {
            setLogoUrl(null);
            setError('No logo found');
            
            // Cache the null result
            if (cacheKey) {
              logoCache.set(cacheKey, {
                url: null,
                timestamp: Date.now(),
              });
            }
          }
        };
        
        testPngImg.src = pngUrl;
      };
      
      testImg.src = jpgUrl;
    } catch (err) {
      console.error('Error fetching logo:', err);
      setError('Failed to fetch logo');
      setLogoUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, enableFallback, cacheKey]);

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
      const logoMap: Record<string, string | null> = {};
      
      // Test each entity's logo (JPG first, then PNG)
      const logoPromises = entityIds.map((entityId) => {
        return new Promise<void>((resolve) => {
          const jpgUrl = `https://storage.googleapis.com/entity-logos/${entityId}.jpg`;
          const pngUrl = `https://storage.googleapis.com/entity-logos/${entityId}.png`;
          
          const testImg = new Image();
          testImg.onload = () => {
            logoMap[entityId] = jpgUrl;
            resolve();
          };
          
          testImg.onerror = () => {
            const testPngImg = new Image();
            testPngImg.onload = () => {
              logoMap[entityId] = pngUrl;
              resolve();
            };
            
            testPngImg.onerror = () => {
              // Try entity-type fallback
              if (entityType) {
                const typeJpgUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.jpg`;
                const typePngUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.png`;
                
                const testTypeImg = new Image();
                testTypeImg.onload = () => {
                  logoMap[entityId] = typeJpgUrl;
                  resolve();
                };
                
                testTypeImg.onerror = () => {
                  const testTypePngImg = new Image();
                  testTypePngImg.onload = () => {
                    logoMap[entityId] = typePngUrl;
                    resolve();
                  };
                  
                  testTypePngImg.onerror = () => {
                    logoMap[entityId] = null;
                    resolve();
                  };
                  
                  testTypePngImg.src = typePngUrl;
                };
                
                testTypeImg.src = typeJpgUrl;
              } else {
                logoMap[entityId] = null;
                resolve();
              }
            };
            
            testPngImg.src = pngUrl;
          };
          
          testImg.src = jpgUrl;
        });
      });

      await Promise.all(logoPromises);
      setLogos(logoMap);
    } catch (err) {
      console.error('Error fetching logos:', err);
      setError('Failed to fetch logos');
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