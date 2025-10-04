/**
 * useNetworkGraphState Hook
 * Composition hook that combines all state management for NetworkGraphV2
 * Provides a unified API for accessing selection, drawing, and UI state
 */

import { useState, useRef } from 'react';
import { ForceGraphMethods } from 'react-force-graph-2d';

import { useSelectionState, SelectionStateHandlers } from './useSelectionState';
import { useDrawingState, DrawingStateHandlers } from './useDrawingState';
import { LRUCache } from '../components/graph/NodeRenderer';

export interface NetworkGraphRefs {
  fgRef: React.MutableRefObject<ForceGraphMethods<any, any> | undefined>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  imageCache: React.MutableRefObject<LRUCache<string, HTMLImageElement>>;
  mountedRef: React.MutableRefObject<boolean>;
  resizeTimeoutRef: React.MutableRefObject<NodeJS.Timeout | undefined>;
  centerTimeoutRef: React.MutableRefObject<NodeJS.Timeout | undefined>;
  isShiftPressedRef: React.MutableRefObject<boolean>;
}

export interface NetworkGraphUIState {
  dimensions: { width: number; height: number };
  setDimensions: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  graphTransform: { zoom: number; centerX: number; centerY: number };
  setGraphTransform: React.Dispatch<React.SetStateAction<{ zoom: number; centerX: number; centerY: number }>>;
}

export interface NetworkGraphState {
  selection: SelectionStateHandlers;
  drawing: DrawingStateHandlers;
  ui: NetworkGraphUIState;
  refs: NetworkGraphRefs;
}

/**
 * Main composition hook for NetworkGraphV2 state management
 * Combines selection state, drawing state, UI state, and refs
 */
export function useNetworkGraphState(): NetworkGraphState {
  // Selection state (with useReducer)
  const selection = useSelectionState();

  // Drawing state (with useReducer)
  const drawing = useDrawingState();

  // UI state (simple useState - independent concerns)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphTransform, setGraphTransform] = useState({ zoom: 1, centerX: 0, centerY: 0 });

  // Refs (DOM and instance references)
  const fgRef = useRef<ForceGraphMethods<any, any>>();
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageCache = useRef<LRUCache<string, HTMLImageElement>>(new LRUCache(100));
  const mountedRef = useRef(true);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  const centerTimeoutRef = useRef<NodeJS.Timeout>();
  const isShiftPressedRef = useRef(false);

  return {
    selection,
    drawing,
    ui: {
      dimensions,
      setDimensions,
      graphTransform,
      setGraphTransform
    },
    refs: {
      fgRef,
      overlayCanvasRef,
      containerRef,
      imageCache,
      mountedRef,
      resizeTimeoutRef,
      centerTimeoutRef,
      isShiftPressedRef
    }
  };
}
