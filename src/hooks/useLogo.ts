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
        
        // Try PNG fallback
        const pngTestImg = new Image();
        pngTestImg.onload = () => {
          console.log('✅ useLogo: PNG loaded successfully:', pngUrl);
          setLogoUrl(pngUrl);
          
          // Cache the successful PNG result
          if (cacheKey) {
            logoCache.set(cacheKey, {
              url: pngUrl,
              timestamp: Date.now(),
            });
          }
        };
        
        pngTestImg.onerror = () => {
          console.log('❌ useLogo: Both entity-specific formats failed for:', entityId);
          
          // Third fallback: Try entity-type logo from logo_mappings
          if (entityType) {
            console.log('🔍 useLogo: Trying entity-type fallback for:', entityType);
            const entityTypeJpgUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.jpg`;
            const entityTypePngUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.png`;
            
            console.log('🔍 useLogo: Trying entity-type JPG:', entityTypeJpgUrl);
            
            const entityTypeTestImg = new Image();
            entityTypeTestImg.onload = () => {
              console.log('✅ useLogo: Entity-type JPG loaded successfully:', entityTypeJpgUrl);
              setLogoUrl(entityTypeJpgUrl);
              
              // Cache the successful entity-type result
              if (cacheKey) {
                logoCache.set(cacheKey, {
                  url: entityTypeJpgUrl,
                  timestamp: Date.now(),
                });
              }
            };
            
            entityTypeTestImg.onerror = () => {
              console.log('❌ useLogo: Entity-type JPG failed, trying PNG:', entityTypePngUrl);
              
              const entityTypePngTestImg = new Image();
              entityTypePngTestImg.onload = () => {
                console.log('✅ useLogo: Entity-type PNG loaded successfully:', entityTypePngUrl);
                setLogoUrl(entityTypePngUrl);
                
                // Cache the successful entity-type PNG result
                if (cacheKey) {
                  logoCache.set(cacheKey, {
                    url: entityTypePngUrl,
                    timestamp: Date.now(),
                  });
                }
              };
              
              entityTypePngTestImg.onerror = () => {
                console.log('❌ useLogo: All logo attempts failed for:', entityId, 'entityType:', entityType);
                setLogoUrl(null);
                setError(`No logo found for ${entityId} (tried entity-specific JPG/PNG and entity-type JPG/PNG)`);
              };
              
              entityTypePngTestImg.src = entityTypePngUrl;
            };
            
            entityTypeTestImg.src = entityTypeJpgUrl;
          } else {
            console.log('❌ useLogo: No entityType provided, cannot try entity-type fallback');
            setLogoUrl(null);
            setError(`No logo found for ${entityId} (tried both JPG and PNG, no entityType for fallback)`);
          }
        };
        
        pngTestImg.src = pngUrl;
      };
      
      // Start the test by setting JPG source
      testImg.src = jpgUrl;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to construct logo URL';
      setError(errorMessage);
      console.error('❌ useLogo error:', errorMessage);
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
            
            const pngTestImg = new Image();
            pngTestImg.onload = () => {
              console.log('✅ useLogos: PNG loaded for', entityId, ':', pngUrl);
              logoMap[entityId] = pngUrl;
              resolve();
            };
            
            pngTestImg.onerror = () => {
              console.log('❌ useLogos: Both entity-specific formats failed for', entityId);
              
              // Third fallback: Try entity-type logo from logo_mappings
              if (entityType) {
                console.log('🔍 useLogos: Trying entity-type fallback for', entityId, ':', entityType);
                
                const entityTypeJpgUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.jpg`;
                const entityTypePngUrl = `https://storage.googleapis.com/entity-type-logos/${entityType}.png`;
                
                console.log('🔍 useLogos: Trying entity-type JPG for', entityId, ':', entityTypeJpgUrl);
                
                const entityTypeTestImg = new Image();
                entityTypeTestImg.onload = () => {
                  console.log('✅ useLogos: Entity-type JPG loaded for', entityId, ':', entityTypeJpgUrl);
                  logoMap[entityId] = entityTypeJpgUrl;
                  resolve();
                };
                
                entityTypeTestImg.onerror = () => {
                  console.log('❌ useLogos: Entity-type JPG failed for', entityId, ', trying PNG:', entityTypePngUrl);
                  
                  const entityTypePngTestImg = new Image();
                  entityTypePngTestImg.onload = () => {
                    console.log('✅ useLogos: Entity-type PNG loaded for', entityId, ':', entityTypePngUrl);
                    logoMap[entityId] = entityTypePngUrl;
                    resolve();
                  };
                  
                  entityTypePngTestImg.onerror = () => {
                    console.log('❌ useLogos: All logo attempts failed for', entityId, 'entityType:', entityType);
                    logoMap[entityId] = null;
                    resolve();
                  };
                  
                  entityTypePngTestImg.src = entityTypePngUrl;
                };
                
                entityTypeTestImg.src = entityTypeJpgUrl;
              } else {
                console.log('❌ useLogos: No entityType provided for', entityId, ', cannot try entity-type fallback');
                logoMap[entityId] = null;
                resolve();
              }
            };
            
            pngTestImg.src = pngUrl;
          };
          
          testImg.src = jpgUrl;
        });
      });
      
      // Wait for all logo tests to complete
      await Promise.all(logoPromises);
      setLogos(logoMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to construct logo URLs';
      setError(errorMessage);
      console.error('❌ useLogos error:', err);
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