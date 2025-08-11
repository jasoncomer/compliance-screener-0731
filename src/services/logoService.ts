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
  static async getLogoUrl(entityId: string, entityType?: string): Promise<string | null> {
    try {
      const url = entityType 
        ? `${this.baseUrl}/entity/${entityId}/${entityType}`
        : `${this.baseUrl}/entity/${entityId}`;
        
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
} 