export interface LogoUploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export interface LogoMetadata {
  filename: string;
  url: string;
  entityId?: string;
  entityType?: string;
  uploadedAt: string;
}

export interface LogoListResponse {
  data: {
    logos: LogoMetadata[];
  };
}

export class LogoService {
  private static readonly ENTITY_LOGOS_BASE = 'https://storage.googleapis.com/entity-logos';
  private static readonly ENTITY_TYPE_LOGOS_BASE = 'https://storage.googleapis.com/entity-type-logos';
  
  private static logoCache = new Map<string, string | null>();

  /**
   * Get logo URL for an entity
   */
  static async getLogoUrl(entityId?: string, entityType?: string): Promise<string | null> {
    console.log('LogoService.getLogoUrl called with entityId:', entityId, 'entityType:', entityType);
    
    if (!entityId && !entityType) {
      console.log('No entityId or entityType provided, returning null');
      return null;
    }

    // Create cache key
    const cacheKey = `${entityId || ''}-${entityType || ''}`;
    console.log('Cache key:', cacheKey);
    
    // Check cache first
    if (this.logoCache.has(cacheKey)) {
      const cachedUrl = this.logoCache.get(cacheKey) || null;
      console.log('Found cached logo URL:', cachedUrl);
      return cachedUrl;
    }

    // Try entity-specific logos first
    if (entityId) {
      console.log('Trying entity-specific logos for entityId:', entityId);
      
      // Try JPG first
      const entityJpgUrl = `${this.ENTITY_LOGOS_BASE}/${entityId}.jpg`;
      console.log('Trying JPG URL:', entityJpgUrl);
      if (await this.checkImageExists(entityJpgUrl)) {
        console.log('Found entity JPG logo:', entityJpgUrl);
        this.logoCache.set(cacheKey, entityJpgUrl);
        return entityJpgUrl;
      }

      // Try PNG
      const entityPngUrl = `${this.ENTITY_LOGOS_BASE}/${entityId}.png`;
      console.log('Trying PNG URL:', entityPngUrl);
      if (await this.checkImageExists(entityPngUrl)) {
        console.log('Found entity PNG logo:', entityPngUrl);
        this.logoCache.set(cacheKey, entityPngUrl);
        return entityPngUrl;
      }
    }

    // Fallback to entity-type logos
    if (entityType) {
      console.log('Trying entity-type logos for entityType:', entityType);
      
      // Try JPG first
      const typeJpgUrl = `${this.ENTITY_TYPE_LOGOS_BASE}/${entityType}.jpg`;
      console.log('Trying entity-type JPG URL:', typeJpgUrl);
      if (await this.checkImageExists(typeJpgUrl)) {
        console.log('Found entity-type JPG logo:', typeJpgUrl);
        this.logoCache.set(cacheKey, typeJpgUrl);
        return typeJpgUrl;
      }

      // Try PNG
      const typePngUrl = `${this.ENTITY_TYPE_LOGOS_BASE}/${entityType}.png`;
      console.log('Trying entity-type PNG URL:', typePngUrl);
      if (await this.checkImageExists(typePngUrl)) {
        console.log('Found entity-type PNG logo:', typePngUrl);
        this.logoCache.set(cacheKey, typePngUrl);
        return typePngUrl;
      }
    }

    console.log('No logo found for entityId:', entityId, 'entityType:', entityType);
    this.logoCache.set(cacheKey, null);
    return null;
  }

  /**
   * Get logo URL with fallback logic (same as getLogoUrl but with better error handling)
   */
  static async getLogoUrlWithFallback(entityId?: string, entityType?: string): Promise<string | null> {
    try {
      return await this.getLogoUrl(entityId, entityType);
    } catch (error) {
      console.error('Error getting logo URL with fallback:', error);
      return null;
    }
  }

  /**
   * Check if an image exists at the given URL
   */
  private static async checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.log('Image check failed for URL:', url, error);
      return false;
    }
  }

  /**
   * Clear the logo cache
   */
  static clearCache(): void {
    this.logoCache.clear();
    console.log('Logo cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.logoCache.size,
      entries: Array.from(this.logoCache.keys()),
    };
  }
}

// Export a singleton instance
export const logoService = new LogoService(); 