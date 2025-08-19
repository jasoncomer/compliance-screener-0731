import { axiosInstance } from '../api/api';

export interface LogoUploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export interface LogoMetadata {
  filename: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  entityId?: string;
  entityType?: string;
}

export interface LogoListResponse {
  data: {
    logos: LogoMetadata[];
  };
}



export class LogoService {
  private static baseUrl = '/logos';
  private static readonly ENTITY_LOGOS_BASE = 'https://storage.googleapis.com/entity-logos';
  private static readonly ENTITY_TYPE_LOGOS_BASE = 'https://storage.googleapis.com/entity-type-logos';
  
  private static logoCache = new Map<string, string | null>();

  /**
   * Upload a logo for an entity
   */
  static async uploadLogo(
    file: File,
    entityId?: string,
    entityType?: string
  ): Promise<LogoUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      if (entityId) {
        formData.append('entityId', entityId);
      }
      
      if (entityType) {
        formData.append('entityType', entityType);
      }

      const response = await axiosInstance.post(`${this.baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        url: response.data.data.url,
        filename: response.data.data.filename,
      };
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload logo',
      };
    }
  }

  /**
   * Upload a default logo for an entity type
   */
  static async uploadDefaultLogo(
    file: File,
    entityType: string
  ): Promise<LogoUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('entityType', entityType);

      const response = await axiosInstance.post(`${this.baseUrl}/upload-default`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        url: response.data.data.url,
        filename: response.data.data.filename,
      };
    } catch (error: any) {
      console.error('Error uploading default logo:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload default logo',
      };
    }
  }

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

    // No logo found
    console.log('No logo found for entityId:', entityId, 'entityType:', entityType);
    this.logoCache.set(cacheKey, null);
    return null;
  }

  /**
   * Get default logo URL for an entity type
   */
  static async getDefaultLogoUrl(entityType: string): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/default/${entityType}`;
      
      const response = await axiosInstance.get(url);
      
      return response.data.data.url;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      return null;
    }
  }

  /**
   * List all logos for an entity
   */
  static async listEntityLogos(entityId: string): Promise<LogoMetadata[]> {
    try {
      const response = await axiosInstance.get<LogoListResponse>(`${this.baseUrl}/list/${entityId}`);
      return response.data.data.logos;
    } catch (error: any) {
      console.error('Error listing entity logos:', error);
      return [];
    }
  }



  /**
   * Get logo URL with fallback hierarchy:
   * 1. entity_id.jpg from entity-logos bucket
   * 2. entity_id.png from entity-logos bucket
   * 3. entity_type.jpg from entity-type-logos bucket
   */
  static async getLogoUrlWithFallback(
    entityId: string,
    entityType?: string
  ): Promise<string | null> {
    // Step 1: Try entity-specific logo via API
    try {
      const entityLogo = await this.getLogoUrl(entityId, entityType);
      if (entityLogo) {
        return entityLogo;
      }
    } catch (error) {
      // Entity logo not found, continue to fallback
    }

    // Step 2: Try entity type fallback logo via API
    if (entityType) {
      try {
        const defaultLogo = await this.getDefaultLogoUrl(entityType);
        if (defaultLogo) {
          return defaultLogo;
        }
      } catch (error) {
        // Entity type logo not found, continue to fallback
      }
    }
    
    return null;
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 5MB',
      };
    }

    return { isValid: true };
  }

  /**
   * Check if an image exists at the given URL
   */
  private static async checkImageExists(url: string): Promise<boolean> {
    try {
      console.log('Checking if image exists at:', url);
      const response = await fetch(url, { method: 'HEAD' });
      const exists = response.ok;
      console.log('Image exists at', url, ':', exists, 'Status:', response.status);
      return exists;
    } catch (error) {
      console.warn(`Failed to check image at ${url}:`, error);
      return false;
    }
  }

  /**
   * Preload logos for multiple entities
   */
  static async preloadLogos(entities: Array<{ entityId?: string; entityType?: string }>): Promise<void> {
    const promises = entities.map(entity => 
      this.getLogoUrl(entity.entityId, entity.entityType)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Clear the logo cache
   */
  static clearCache(): void {
    this.logoCache.clear();
  }

  /**
   * Get cached logo URL without checking existence
   */
  static getCachedLogoUrl(entityId?: string, entityType?: string): string | null {
    const cacheKey = `${entityId || ''}-${entityType || ''}`;
    return this.logoCache.get(cacheKey) || null;
  }
}

// Export a singleton instance
export const logoService = new LogoService(); 