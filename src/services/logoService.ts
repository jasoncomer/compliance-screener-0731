/**
 * Service for fetching and caching entity logos with fallback support
 */

interface LogoCache {
  [url: string]: {
    status: 'loading' | 'success' | 'error';
    image?: HTMLImageElement;
    timestamp: number;
  };
}

class LogoService {
  private cache: LogoCache = {};
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly RETRY_DELAY = 5 * 60 * 1000; // 5 minutes for retrying failed loads

  /**
   * Get logo URL for an entity, with fallback logic
   */
  getLogoUrl(entityId: string | undefined, customLogoUrl?: string | null): string | null {
    // Use custom logo URL if provided and it's a valid URL
    if (customLogoUrl && (customLogoUrl.startsWith('http://') || customLogoUrl.startsWith('https://'))) {
      return customLogoUrl;
    }

    // If customLogoUrl is provided but not a full URL, use it as the logo identifier
    // (e.g., "bridgers" instead of "bridgers_xyz")
    if (customLogoUrl && customLogoUrl !== 'true' && customLogoUrl !== 'false') {
      return `https://storage.googleapis.com/entity-logos/${customLogoUrl}.jpg`;
    }

    // Don't generate URLs for invalid or unknown entities
    if (!entityId || entityId === 'unknown_entity' || entityId === 'unknown') {
      return null;
    }

    // Fallback to entityId
    return `https://storage.googleapis.com/entity-logos/${entityId}.jpg`;
  }

  /**
   * Load an image with caching and error handling
   */
  async loadImage(url: string): Promise<HTMLImageElement | null> {
    // Check cache first
    const cached = this.cache[url];
    const now = Date.now();

    if (cached) {
      // Return cached success
      if (cached.status === 'success' && cached.image) {
        return cached.image;
      }

      // Don't retry recent failures
      if (cached.status === 'error' && (now - cached.timestamp) < this.RETRY_DELAY) {
        return null;
      }

      // Wait for loading to complete
      if (cached.status === 'loading') {
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            const current = this.cache[url];
            if (current && current.status !== 'loading') {
              clearInterval(checkInterval);
              resolve(current.status === 'success' ? current.image || null : null);
            }
          }, 100);

          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(null);
          }, 5000);
        });
      }
    }

    // Mark as loading
    this.cache[url] = { status: 'loading', timestamp: now };

    try {
      const img = await this.loadImageWithFallback(url);
      if (img) {
        this.cache[url] = { status: 'success', image: img, timestamp: now };
        return img;
      } else {
        this.cache[url] = { status: 'error', timestamp: now };
        return null;
      }
    } catch (error) {
      this.cache[url] = { status: 'error', timestamp: now };
      return null;
    }
  }

  /**
   * Try loading an image with fallback formats
   */
  private async loadImageWithFallback(url: string): Promise<HTMLImageElement | null> {
    // Try the original URL first
    const img = await this.tryLoadImage(url);
    if (img) return img;

    // If .jpg failed, try .png
    if (url.endsWith('.jpg')) {
      const pngUrl = url.replace('.jpg', '.png');
      const pngImg = await this.tryLoadImage(pngUrl);
      if (pngImg) return pngImg;
    }

    return null;
  }

  /**
   * Attempt to load a single image
   */
  private tryLoadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      // Don't set crossOrigin as it can cause issues with some CDNs

      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        resolve(null);
      }, 3000); // 3 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        if (img.complete && img.naturalWidth > 0) {
          resolve(img);
        } else {
          resolve(null);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };

      img.src = url;
    });
  }

  /**
   * Preload multiple images in parallel
   */
  async preloadImages(urls: (string | null)[]): Promise<void> {
    const validUrls = urls.filter((url): url is string => url !== null);
    await Promise.all(validUrls.map(url => this.loadImage(url)));
  }

  /**
   * Clear old cache entries
   */
  clearOldCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(url => {
      const entry = this.cache[url];
      if (now - entry.timestamp > this.CACHE_DURATION) {
        delete this.cache[url];
      }
    });
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): { total: number; success: number; error: number; loading: number } {
    const entries = Object.values(this.cache);
    return {
      total: entries.length,
      success: entries.filter(e => e.status === 'success').length,
      error: entries.filter(e => e.status === 'error').length,
      loading: entries.filter(e => e.status === 'loading').length
    };
  }
}

// Export singleton instance
export const logoService = new LogoService();

// Clear old cache entries periodically
setInterval(() => logoService.clearOldCache(), 60 * 60 * 1000); // Every hour