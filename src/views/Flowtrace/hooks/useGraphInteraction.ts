/**
 * useGraphInteraction Hook
 * Handles node/link click, drag, and hover interactions for NetworkGraphV2
 */

import { useCallback, useRef } from 'react';
import { ForceGraphMethods } from 'react-force-graph-2d';

import { FTConnection, FTNode } from '../components/NetworkGraph';

export interface GraphInteractionConfig {
  fgRef: React.MutableRefObject<ForceGraphMethods<any, any> | undefined>;
  mountedRef: React.MutableRefObject<boolean>;
  hoveredNode: string | null;
  setHoveredNode: (nodeId: string | null) => void;
  selectedNodes: Set<string>;
  setSelectedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  areaSelectionMode: boolean;
  onNodeClick: (node: FTNode) => void;
  onNodeDoubleClick?: (node: FTNode) => void;
  onNodeAdd: (node: FTNode) => void;
  onNodeRemove: (nodeId: string) => void;
  onNodeDrag: (nodeId: string, x: number, y: number) => void;
  onEdgeClick: (connection: FTConnection) => void;
}

export interface GraphInteractionHandlers {
  handleNodeHover: (node: FTNode | null) => void;
  handleNodeClick: (node: FTNode & { fx?: number; fy?: number }, event: MouseEvent) => void;
  handleNodeDragEnd: (node: FTNode & { x?: number; y?: number }) => void;
  handleLinkClick: (link: FTConnection & { connections?: FTConnection[]; isAggregated?: boolean; utxoCount?: number }) => void;
}

/**
 * Hook for managing graph interaction handlers
 */
export function useGraphInteraction(config: GraphInteractionConfig): GraphInteractionHandlers {
  const {
    fgRef,
    mountedRef,
    hoveredNode,
    setHoveredNode,
    selectedNodes,
    setSelectedNodes,
    areaSelectionMode,
    onNodeClick,
    onNodeDoubleClick,
    onNodeAdd,
    onNodeRemove,
    onNodeDrag,
    onEdgeClick
  } = config;

  // Track click time for double-click detection
  const lastClickTime = useRef<number>(0);
  const lastClickNode = useRef<string | null>(null);

  // Track which button is hovered (for visual feedback)
  const hoveredButtonRef = useRef<{ nodeId: string; button: 'add' | 'delete' } | null>(null);

  // Handle node hover
  const handleNodeHover = useCallback((node: FTNode | null, event?: MouseEvent) => {
    if (mountedRef.current) {
      // Check if hovering over add/delete buttons
      if (node && event && fgRef.current) {
        const canvas = event.target as HTMLCanvasElement;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const clickX = event.clientX - rect.left;
          const clickY = event.clientY - rect.top;

          const buttonRadius = 5;
          const zoom = fgRef.current.zoom();
          const hitRadius = (buttonRadius + 10) * zoom;
          const nodeRadius = 20;

          // Calculate button positions
          const addButtonX = node.x - nodeRadius - 6;
          const addButtonY = node.y - nodeRadius - 6;
          const delButtonX = node.x + nodeRadius + 6;
          const delButtonY = node.y - nodeRadius - 6;

          const addButtonScreen = fgRef.current.graph2ScreenCoords(addButtonX, addButtonY);
          const delButtonScreen = fgRef.current.graph2ScreenCoords(delButtonX, delButtonY);

          // Check add button
          const addDist = Math.sqrt(
            Math.pow(clickX - addButtonScreen.x, 2) +
            Math.pow(clickY - addButtonScreen.y, 2)
          );

          // Check delete button
          const delDist = Math.sqrt(
            Math.pow(clickX - delButtonScreen.x, 2) +
            Math.pow(clickY - delButtonScreen.y, 2)
          );

          if (addDist <= hitRadius) {
            hoveredButtonRef.current = { nodeId: node.id, button: 'add' };
            console.log('🎯 Hovering over ADD button');
          } else if (delDist <= hitRadius) {
            hoveredButtonRef.current = { nodeId: node.id, button: 'delete' };
            console.log('🎯 Hovering over DELETE button');
          } else {
            hoveredButtonRef.current = null;
          }
        }
      } else {
        hoveredButtonRef.current = null;
      }

      // Defer state update to avoid updating during ForceGraph2D render
      queueMicrotask(() => {
        if (mountedRef.current) {
          setHoveredNode(node ? node.id : null);
        }
      });
    }
  }, [mountedRef, setHoveredNode, fgRef]);

  // Handle node interactions
  const handleNodeClick = useCallback((node: FTNode & { fx?: number; fy?: number }, event: MouseEvent) => {
    console.log('🖱️ Node click handler triggered for node:', node.id);
    if (!mountedRef.current) return;

    // Get click position relative to canvas
    const canvas = event.target as HTMLCanvasElement;
    if (!canvas || !fgRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const transform = fgRef.current.graph2ScreenCoords(node.x, node.y);

    // Calculate click position relative to node center in screen coordinates
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const buttonRadius = 7; // Updated to match new button size in NodeRenderer
    const zoom = fgRef.current.zoom();
    // Use larger hit radius to make buttons easier to click
    // Include the outer glow (+2) and some extra padding (+6) for easier clicking
    const hitRadius = (buttonRadius + 8) * zoom; // 15 * zoom for easier clicking
    const nodeRadius = 20; // Fixed node radius

    // Calculate button positions in graph coordinates
    const addButtonX = node.x - nodeRadius - 6;
    const addButtonY = node.y - nodeRadius - 6;
    const delButtonX = node.x + nodeRadius + 6;
    const delButtonY = node.y - nodeRadius - 6;

    // Convert button positions to screen coordinates
    const addButtonScreen = fgRef.current.graph2ScreenCoords(addButtonX, addButtonY);
    const delButtonScreen = fgRef.current.graph2ScreenCoords(delButtonX, delButtonY);

    // Check if click is on add button (top-left of node)
    const addDx = clickX - addButtonScreen.x;
    const addDy = clickY - addButtonScreen.y;
    const addDistance = Math.sqrt(addDx * addDx + addDy * addDy);
    console.log('🔍 Add button click check:', {
      nodeId: node.id,
      nodeGraphCoords: { x: node.x, y: node.y },
      nodeScreenCoords: transform,
      addButtonGraphCoords: { x: addButtonX, y: addButtonY },
      addButtonScreen,
      clickPos: { clickX, clickY },
      offset: { addDx, addDy },
      addDistance,
      hitRadius,
      isHit: addDistance <= hitRadius,
      zoom
    });
    if (addDistance <= hitRadius) {
      console.log('✅ Add button clicked! Opening modal for node:', node.id);
      onNodeAdd(node);
      return;
    }

    // Check if click is on delete button (top-right of node)
    const delDx = clickX - delButtonScreen.x;
    const delDy = clickY - delButtonScreen.y;
    const delDistance = Math.sqrt(delDx * delDx + delDy * delDy);
    if (delDistance <= hitRadius) {
      console.log('✅ Delete button clicked! Removing node:', node.id);
      onNodeRemove(node.id);
      return;
    }

    // Check for double-click with adaptive timing
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime.current;
    // Use slightly longer threshold for touch devices
    const doubleClickThreshold = 'ontouchstart' in window ? 400 : 300;
    const isDoubleClick = timeDiff < doubleClickThreshold && lastClickNode.current === node.id;

    if (isDoubleClick && onNodeDoubleClick) {
      onNodeDoubleClick(node);
      // Reset to prevent triple-click issues
      lastClickTime.current = 0;
      lastClickNode.current = null;
    } else {
      // Regular node click
      const isMultiSelectMode = event.metaKey || event.ctrlKey;

      // Defer state updates to avoid updating during ForceGraph2D render
      queueMicrotask(() => {
        if (!mountedRef.current) return;

        if (isMultiSelectMode) {
          // Multi-select mode: Toggle node in/out of selection
          if (selectedNodes.has(node.id)) {
            // Remove from selection
            setSelectedNodes(prev => {
              const newSet = new Set(prev);
              newSet.delete(node.id);
              return newSet;
            });
          } else {
            // Add to selection
            setSelectedNodes(prev => {
              const newSet = new Set(prev);
              newSet.add(node.id);
              return newSet;
            });
          }
        } else {
          // Normal click behavior depends on mode
          if (areaSelectionMode) {
            // In area selection mode: additive selection
            setSelectedNodes(prev => {
              const newSet = new Set(prev);
              newSet.add(node.id);
              return newSet;
            });
          } else {
            // In pointer mode: replace selection (select only this node)
            setSelectedNodes(new Set([node.id]));
          }
        }
      });

      onNodeClick(node);
      lastClickTime.current = currentTime;
      lastClickNode.current = node.id;
    }
  }, [
    mountedRef,
    fgRef,
    hoveredNode,
    selectedNodes,
    setSelectedNodes,
    areaSelectionMode,
    onNodeClick,
    onNodeDoubleClick,
    onNodeAdd,
    onNodeRemove
  ]);

  // Handle node drag end
  const handleNodeDragEnd = useCallback((node: FTNode & { x?: number; y?: number }) => {
    if (node.x !== undefined && node.y !== undefined) {
      onNodeDrag(node.id, node.x, node.y);
    }
  }, [onNodeDrag]);

  // Handle link click
  const handleLinkClick = useCallback((link: FTConnection & { connections?: FTConnection[]; isAggregated?: boolean; utxoCount?: number }) => {
    if (link.connections && link.connections.length > 0) {
      // For aggregated connections, pass the summary
      const connection: FTConnection = {
        ...link.connections[0],
        amount: link.amount,
        isAggregated: link.isAggregated,
        utxoCount: link.utxoCount
      };
      onEdgeClick(connection);
    } else {
      // For individual connections
      onEdgeClick(link);
    }
  }, [onEdgeClick]);

  return {
    handleNodeHover,
    handleNodeClick,
    handleNodeDragEnd,
    handleLinkClick
  };
}
