import { useState, useEffect, useCallback } from 'react';

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
      console.log('🔍 useLogo: Constructing logo URL for entity:', entityId);
      
      const jpgUrl = `https://storage.googleapis.com/entity-logos/${entityId}.jpg`;
      const pngUrl = `https://storage.googleapis.com/entity-logos/${entityId}.png`;
      
      console.log('🔍 useLogo: Trying JPG first:', jpgUrl);
      
      // Special debugging for Coinbase
      if (entityId?.toLowerCase().includes('coinbase')) {
        console.log('🔍 Coinbase logo debugging:', {
          entityId,
          entityType,
          jpgUrl,
          pngUrl,
          willTryBothFormats: true
        });
      }
      
      // Create a test image to check if JPG exists
      const testImg = new Image();
      testImg.onload = () => {
        console.log('✅ useLogo: JPG loaded successfully:', jpgUrl);
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
        console.log('❌ useLogo: JPG failed, trying PNG:', pngUrl);
        
        // Try PNG if JPG fails
        const testPngImg = new Image();
        testPngImg.onload = () => {
          console.log('✅ useLogo: PNG loaded successfully:', pngUrl);
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
          console.log('❌ useLogo: Both JPG and PNG failed for entity:', entityId);
          
          // Try entity-type fallback if enabled
          if (enableFallback && entityType) {
            console.log('🔄 useLogo: Trying entity-type fallback for:', entityType);
            
            const typeJpgUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.jpg`;
            const typePngUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.png`;
            
            const testTypeImg = new Image();
            testTypeImg.onload = () => {
              console.log('✅ useLogo: Entity-type JPG fallback loaded:', typeJpgUrl);
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
                console.log('✅ useLogo: Entity-type PNG fallback loaded:', typePngUrl);
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
                console.log('❌ useLogo: All fallbacks failed for entity:', entityId);
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
            console.log('❌ useLogo: No fallback enabled or no entity type for entity:', entityId);
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
      console.log('🔍 useLogos: Testing logo URLs for entities:', entityIds);
      
      const logoMap: Record<string, string | null> = {};
      
      // Test each entity's logo (JPG first, then PNG)
      const logoPromises = entityIds.map((entityId) => {
        return new Promise<void>((resolve) => {
          const jpgUrl = `https://storage.googleapis.com/entity-logos/${entityId}.jpg`;
          const pngUrl = `https://storage.googleapis.com/entity-logos/${entityId}.png`;
          
          console.log('🔍 useLogos: Testing', entityId, 'JPG first:', jpgUrl);
          
          const testImg = new Image();
          testImg.onload = () => {
            console.log('✅ useLogos: JPG loaded for', entityId, ':', jpgUrl);
            logoMap[entityId] = jpgUrl;
            resolve();
          };
          
          testImg.onerror = () => {
            console.log('❌ useLogos: JPG failed for', entityId, ', trying PNG:', pngUrl);
            
            const testPngImg = new Image();
            testPngImg.onload = () => {
              console.log('✅ useLogos: PNG loaded for', entityId, ':', pngUrl);
              logoMap[entityId] = pngUrl;
              resolve();
            };
            
            testPngImg.onerror = () => {
              console.log('❌ useLogos: Both formats failed for', entityId);
              
              // Try entity-type fallback
              if (entityType) {
                const typeJpgUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.jpg`;
                const typePngUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.png`;
                
                const testTypeImg = new Image();
                testTypeImg.onload = () => {
                  console.log('✅ useLogos: Entity-type JPG fallback for', entityId, ':', typeJpgUrl);
                  logoMap[entityId] = typeJpgUrl;
                  resolve();
                };
                
                testTypeImg.onerror = () => {
                  const testTypePngImg = new Image();
                  testTypePngImg.onload = () => {
                    console.log('✅ useLogos: Entity-type PNG fallback for', entityId, ':', typePngUrl);
                    logoMap[entityId] = typePngUrl;
                    resolve();
                  };
                  
                  testTypePngImg.onerror = () => {
                    console.log('❌ useLogos: All fallbacks failed for', entityId);
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