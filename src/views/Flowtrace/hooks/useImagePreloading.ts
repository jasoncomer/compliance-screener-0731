/**
 * useImagePreloading Hook
 * Intelligently preloads images for nodes based on viewport and graph state
 * Reduces visual lag when nodes first appear on screen
 */

import { useEffect, useRef } from 'react';
import { ForceGraphMethods } from 'react-force-graph-2d';

import { FTNode } from '../components/NetworkGraph';
import { logoService } from '../../../services/logoService';

export interface ImagePreloadingConfig {
  fgRef: React.MutableRefObject<ForceGraphMethods<any, any> | undefined>;
  nodes: FTNode[];
  enabled?: boolean;
}

/**
 * Calculate viewport bounds in graph coordinates
 */
function getViewportBounds(fgRef: React.MutableRefObject<ForceGraphMethods<any, any> | undefined>) {
  if (!fgRef.current) return null;

  const zoom = fgRef.current.zoom();
  const centerPos = fgRef.current.centerAt();

  if (!centerPos) return null;

  // Estimate viewport size based on typical canvas dimensions
  // Add padding for nodes slightly outside viewport
  const viewportWidth = (window.innerWidth / zoom) * 1.5; // 50% padding
  const viewportHeight = (window.innerHeight / zoom) * 1.5;

  return {
    minX: centerPos.x - viewportWidth / 2,
    maxX: centerPos.x + viewportWidth / 2,
    minY: centerPos.y - viewportHeight / 2,
    maxY: centerPos.y + viewportHeight / 2
  };
}

/**
 * Check if node is within viewport bounds
 */
function isNodeInViewport(node: FTNode, bounds: { minX: number; maxX: number; minY: number; maxY: number }): boolean {
  return (
    node.x >= bounds.minX &&
    node.x <= bounds.maxX &&
    node.y >= bounds.minY &&
    node.y <= bounds.maxY
  );
}

/**
 * Hook that preloads images for nodes in viewport
 * Uses priority-based loading: visible nodes first, nearby nodes second
 */
export function useImagePreloading(config: ImagePreloadingConfig): void {
  const { fgRef, nodes, enabled = true } = config;
  const preloadedRef = useRef<Set<string>>(new Set());
  const preloadQueueRef = useRef<string[]>([]);
  const isPreloadingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !fgRef.current || nodes.length === 0) return;

    const bounds = getViewportBounds(fgRef);
    if (!bounds) return;

    // Categorize nodes: in viewport vs nearby
    const visibleNodes: FTNode[] = [];
    const nearbyNodes: FTNode[] = [];

    nodes.forEach(node => {
      if (isNodeInViewport(node, bounds)) {
        visibleNodes.push(node);
      } else {
        // Check if nearby (within 2x viewport)
        const expandedBounds = {
          minX: bounds.minX - (bounds.maxX - bounds.minX),
          maxX: bounds.maxX + (bounds.maxX - bounds.minX),
          minY: bounds.minY - (bounds.maxY - bounds.minY),
          maxY: bounds.maxY + (bounds.maxY - bounds.minY)
        };
        if (isNodeInViewport(node, expandedBounds)) {
          nearbyNodes.push(node);
        }
      }
    });

    // Get logo URLs for visible and nearby nodes
    const visibleUrls = visibleNodes
      .map(node => logoService.getLogoUrl(node.entityId, node.logoUrl))
      .filter((url): url is string => url !== null && !preloadedRef.current.has(url));

    const nearbyUrls = nearbyNodes
      .map(node => logoService.getLogoUrl(node.entityId, node.logoUrl))
      .filter((url): url is string => url !== null && !preloadedRef.current.has(url));

    // Priority 1: Preload visible nodes immediately
    if (visibleUrls.length > 0) {
      logoService.preloadImages(visibleUrls).then(() => {
        visibleUrls.forEach(url => preloadedRef.current.add(url));
      });
    }

    // Priority 2: Queue nearby nodes for background loading
    if (nearbyUrls.length > 0 && !isPreloadingRef.current) {
      preloadQueueRef.current = nearbyUrls;
      loadQueuedImages();
    }
  }, [nodes, fgRef, enabled]);

  /**
   * Load queued images in batches to avoid overwhelming the network
   */
  const loadQueuedImages = async () => {
    if (isPreloadingRef.current) return;

    isPreloadingRef.current = true;
    const BATCH_SIZE = 5;

    while (preloadQueueRef.current.length > 0) {
      const batch = preloadQueueRef.current.splice(0, BATCH_SIZE);

      try {
        await logoService.preloadImages(batch);
        batch.forEach(url => preloadedRef.current.add(url));
      } catch (error) {
        console.warn('Error preloading image batch:', error);
      }

      // Small delay between batches to avoid blocking
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    isPreloadingRef.current = false;
  };

  // Cleanup: Reset preloaded set when nodes change significantly
  useEffect(() => {
    const currentUrls = new Set(
      nodes
        .map(node => logoService.getLogoUrl(node.entityId, node.logoUrl))
        .filter((url): url is string => url !== null)
    );

    // Remove preloaded URLs that are no longer in the graph
    preloadedRef.current = new Set(
      Array.from(preloadedRef.current).filter(url => currentUrls.has(url))
    );
  }, [nodes]);
}
