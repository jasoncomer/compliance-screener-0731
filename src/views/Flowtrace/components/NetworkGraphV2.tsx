import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

import ForceGraph2D from 'react-force-graph-2d';

import { useTheme } from '../../../context/ThemeContext';
import { throttle } from '../../../utils/throttle';

import { InlineTextEditor } from './InlineTextEditor';
import { loadNodeImage, createNodeRenderer } from './graph/NodeRenderer';
import { createLinkRenderer, getLinkLabel } from './graph/LinkRenderer';
import { useGraphInteraction } from '../hooks/useGraphInteraction';
import { useAnnotationManagement } from '../hooks/useAnnotationManagement';
import { useAnnotationRendering } from './graph/AnnotationOverlay';
import { useNetworkGraphState } from '../hooks/useNetworkGraphState';
import { useImagePreloading } from '../hooks/useImagePreloading';
import { useInteractionMode } from '../hooks/useInteractionMode';

// Re-export the same types from original NetworkGraph for compatibility
export type FTNode = {
  id: string;
  label?: string;
  x: number;
  y: number;
  type?: string;
  risk?: number;
  logoUrl?: string;
  balance?: number | string;
  usdValue?: number | string;
  txCount?: number;
  entityId?: string;
  entityType?: string;
  bo?: string;
  custodian?: string;
  notes?: Array<{ id: string; userId: string; userName: string; content: string; timestamp: string }>;
};

export interface FTConnection {
  from: string;
  to: string;
  amount: string;
  receivedAmount?: string;
  currency: string;
  date: string;
  txHash: string;
  txid?: string;
  utxoKey?: string;
  connectionKey?: string;
  type?: "in" | "out";
  usdValue?: string;
  fee?: string;
  note?: string;
  groupId?: string;
  passThroughNodes?: string[];
  originalConnections?: FTConnection[];
  customColor?: string;
  isAggregated?: boolean;
  utxoCount?: number;
  locked?: boolean;
  _aggregatedText?: {
    amount: string;
    count: number;
    currency: string;
  };
}

interface NetworkGraphProps {
  nodes: FTNode[];
  connections: FTConnection[];
  onNodeClick: (node: FTNode) => void;
  onNodeDoubleClick?: (node: FTNode) => void;
  onNodeDrag: (nodeId: string, x: number, y: number) => void;
  onEdgeClick: (connection: FTConnection) => void;
  onNodeRemove: (nodeId: string) => void;
  onBulkNodeRemove?: (nodeIds: string[]) => void;
  onNodeAdd: (node: FTNode) => void;
  utxoCollapseMode: "aggregated" | "individual";
  activeColor?: string;
  onDrawingAction?: (action: { type: string; data: any }) => void;
  drawingHistory?: any[];
  centerNodeId?: string | null;
  selectedAnnotationIndex?: number | null;
  onAnnotationSelect?: (index: number | null) => void;
  onAnnotationUpdate?: (index: number, data: any) => void;
}

export type NetworkGraphHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  forceRender: () => void;
  centerOnNode: (nodeId: string) => void;
  getSelectedNodes: () => string[];
  clearSelection: () => void;
  selectNodes: (nodeIds: string[]) => void;
  editSelectedTextAnnotation: () => void;
};

const NetworkGraphV2Base = forwardRef<NetworkGraphHandle, NetworkGraphProps>(({
  nodes,
  connections,
  onNodeClick,
  onNodeDoubleClick,
  onNodeDrag,
  onEdgeClick,
  onNodeRemove,
  onBulkNodeRemove,
  onNodeAdd,
  utxoCollapseMode,
  activeColor = '#ff6b35',
  onDrawingAction,
  drawingHistory = [],
  centerNodeId,
  selectedAnnotationIndex = null,
  onAnnotationSelect,
  onAnnotationUpdate: _onAnnotationUpdate
}, ref) => {
  const { theme } = useTheme();

  // Use centralized interaction mode
  const { state: modeState, actions: modeActions } = useInteractionMode();
  const { designTool, isSelectMode, isAreaSelectMode, isDesignMode } = modeState;

  // Derive active tool from mode state
  const activeTool = isDesignMode ? designTool : 'select';
  const areaSelectionMode = isAreaSelectMode;

  // Use composition hook for all state management
  const { selection, drawing, ui, refs } = useNetworkGraphState();

  // Destructure for convenience
  const { fgRef, overlayCanvasRef, containerRef, imageCache, mountedRef, resizeTimeoutRef, centerTimeoutRef, isShiftPressedRef } = refs;
  const { dimensions, setDimensions, setGraphTransform } = ui;
  const { selectedNodes, hoveredNode, selectionBox, isShiftPressed } = selection.state;
  const { drawingLine, drawingShape, draggingAnnotation, resizingAnnotation, hoveredAnnotation, hoveredHandle, textEditorState, isDrawing } = drawing.state;

  // Track last text annotation click for double-click detection
  const lastTextClickTime = useRef<number>(0);

  // Throttled mouse move handler for better performance (~60fps)
  // Note: Annotation hit testing is not throttled for better UX
  const throttledMouseMove = useMemo(
    () => throttle((x: number, y: number, currentState: {
      draggingAnnotation: typeof draggingAnnotation;
      isDrawing: boolean;
      drawingLine: typeof drawingLine;
      drawingShape: typeof drawingShape;
    }) => {
      if (currentState.draggingAnnotation) {
        drawing.updateDraggingAnnotation(
          x - currentState.draggingAnnotation.startX,
          y - currentState.draggingAnnotation.startY
        );
      } else if (currentState.isDrawing && currentState.drawingLine) {
        drawing.updateDrawingLine({ x, y });
      } else if (currentState.drawingShape) {
        drawing.updateDrawingShape({ x, y });
      }
    }, 16), // 16ms = ~60fps
    [drawing]
  );

  // Throttled selection box update for better performance
  const throttledSelectionBoxMove = useMemo(
    () => throttle((x: number, y: number, currentBox: typeof selectionBox) => {
      if (currentBox) {
        selection.updateSelectionBox({ x, y });
      }
    }, 16), // 16ms = ~60fps
    [selection]
  );

  // Transform nodes and connections to ForceGraph format
  const graphData = useMemo(() => {
    // Map nodes with fixed positions if they have x,y coordinates
    const graphNodes = nodes.map(node => ({
      ...node,
      fx: node.x, // Fixed x position
      fy: node.y, // Fixed y position
      val: 10 // Node size
    }));

    // Process connections based on UTXO collapse mode
    let graphLinks: any[] = [];

    if (utxoCollapseMode === "aggregated") {
      // Group connections by from-to pairs
      const connectionGroups = new Map<string, FTConnection[]>();

      connections.forEach((connection) => {
        if (connection.from === connection.to) return; // Skip self-loops

        const key = `${connection.from}|${connection.to}`;
        if (!connectionGroups.has(key)) {
          connectionGroups.set(key, []);
        }
        connectionGroups.get(key)!.push(connection);
      });

      // Create aggregated links
      connectionGroups.forEach((conns, key) => {
        const [source, target] = key.split('|');
        const totalAmount = conns.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);
        const firstConn = conns[0];

        graphLinks.push({
          source,
          target,
          connections: conns,
          amount: totalAmount.toFixed(8),
          currency: firstConn.currency,
          customColor: firstConn.customColor,
          isAggregated: conns.length > 1,
          utxoCount: conns.length
        });
      });
    } else {
      // Individual mode - create link for each connection with curvature for multiple edges
      // First pass: group connections by node pairs
      const connectionGroups = new Map<string, FTConnection[]>();

      connections
        .filter(c => c.from !== c.to) // Skip self-loops
        .forEach((connection) => {
          const key = `${connection.from}|${connection.to}`;
          if (!connectionGroups.has(key)) {
            connectionGroups.set(key, []);
          }
          connectionGroups.get(key)!.push(connection);
        });

      // Second pass: assign curvatures based on total count
      graphLinks = [];
      connectionGroups.forEach((conns) => {
        const total = conns.length;

        conns.forEach((connection, index) => {
          let curvature = 0;

          if (total === 1) {
            // Single edge: straight line
            curvature = 0;
          } else if (total % 2 === 0) {
            // Even count: symmetrically curved, no center line
            // e.g., 2 txs: [-0.2, +0.2]
            // e.g., 4 txs: [-0.4, -0.2, +0.2, +0.4]
            const offset = index - (total / 2 - 0.5);
            curvature = offset * 0.2;
          } else {
            // Odd count: center edge is straight, others symmetrically curved
            // e.g., 3 txs: [-0.2, 0, +0.2]
            // e.g., 5 txs: [-0.4, -0.2, 0, +0.2, +0.4]
            const offset = index - Math.floor(total / 2);
            curvature = offset * 0.2;
          }

          graphLinks.push({
            source: connection.from,
            target: connection.to,
            ...connection,
            curvature
          });
        });
      });
    }

    return {
      nodes: graphNodes,
      links: graphLinks
    };
  }, [nodes, connections, utxoCollapseMode]);

  // Ref to hold the edit text annotation function (updated after graphToScreen is available)
  const editTextAnnotationRef = useRef<(() => void) | null>(null);

  // Imperative handle for external controls
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (fgRef.current) {
        const currentZoom = fgRef.current.zoom();
        fgRef.current.zoom(currentZoom * 1.1);
      }
    },
    zoomOut: () => {
      if (fgRef.current) {
        const currentZoom = fgRef.current.zoom();
        fgRef.current.zoom(currentZoom * 0.9);
      }
    },
    resetView: () => {
      if (fgRef.current) {
        fgRef.current.centerAt(0, 0, 1000);
        fgRef.current.zoom(1);
      }
    },
    forceRender: () => {
      if (fgRef.current) {
        // Force re-render by updating zoom slightly
        const currentZoom = fgRef.current.zoom();
        fgRef.current.zoom(currentZoom * 1.0001);
        fgRef.current.zoom(currentZoom);
      }
    },
    centerOnNode: (nodeId: string) => {
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (node && fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 1000);
      }
    },
    getSelectedNodes: () => {
      return Array.from(selectedNodes);
    },
    clearSelection: () => {
      selection.clearSelection();
    },
    selectNodes: (nodeIds: string[]) => {
      selection.selectNodes(nodeIds);
    },
    editSelectedTextAnnotation: () => {
      // Call the ref function which will be set after graphToScreen is available
      if (editTextAnnotationRef.current) {
        editTextAnnotationRef.current();
      }
    }
  }), [graphData.nodes, selectedNodes, selection]);

  // Center on specific node when requested
  useEffect(() => {
    if (centerNodeId && fgRef.current) {
      const node = graphData.nodes.find(n => n.id === centerNodeId);
      if (node) {
        // Clear any existing timeout
        if (centerTimeoutRef.current) {
          clearTimeout(centerTimeoutRef.current);
        }

        centerTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            fgRef.current?.centerAt(node.x, node.y, 1000);
          }
        }, 100);
      }
    }

    return () => {
      if (centerTimeoutRef.current) {
        clearTimeout(centerTimeoutRef.current);
      }
    };
  }, [centerNodeId, graphData.nodes]);

  // Handle container resizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && mountedRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Also update on initial mount with a small delay to ensure container is sized
    resizeTimeoutRef.current = setTimeout(updateDimensions, 100);

    // Use ResizeObserver to detect container size changes (e.g., when left panel collapses/expands)
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Clean up on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // Clear image cache on unmount
      imageCache.current.clear();
    };
  }, []);

  // Track graph transformations for overlay canvas re-rendering
  // Use callback-based approach instead of polling for better performance
  const updateGraphTransform = useCallback(() => {
    if (fgRef.current && mountedRef.current) {
      const zoom = fgRef.current.zoom();
      const center = fgRef.current.centerAt();
      if (center) {
        // Use requestAnimationFrame to defer state update and avoid updating during render
        requestAnimationFrame(() => {
          if (mountedRef.current) {
            setGraphTransform({ zoom, centerX: center.x || 0, centerY: center.y || 0 });
          }
        });
      }
    }
  }, []);

  // Track Shift key for area selection and handle Delete/Backspace for bulk delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        selection.setShiftPressed(true);
        isShiftPressedRef.current = true;
      }

      // Handle Delete/Backspace for bulk deletion
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodes.size > 0) {
        // Prevent default behavior (e.g., browser back on Backspace)
        e.preventDefault();

        const nodeIdsToDelete = Array.from(selectedNodes);

        // Use bulk delete if available, otherwise delete one by one
        if (onBulkNodeRemove) {
          onBulkNodeRemove(nodeIdsToDelete);
        } else {
          nodeIdsToDelete.forEach(nodeId => {
            onNodeRemove(nodeId);
          });
        }

        // Clear selection
        selection.clearSelection();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        selection.setShiftPressed(false);
        isShiftPressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNodes, onNodeRemove, onBulkNodeRemove, selection]);

  // Load and cache logo images using the logo service
  const loadImage = useCallback(async (url: string): Promise<HTMLImageElement | null> => {
    return loadNodeImage(url, imageCache.current, mountedRef);
  }, []);

  // Custom node canvas drawing using extracted renderer
  const nodeCanvasObject = useMemo(() => {
    return createNodeRenderer({
      radius: 20,
      theme,
      selectedNodes,
      hoveredNode,
      imageCache: imageCache.current,
      loadImage
    });
  }, [theme, selectedNodes, hoveredNode, loadImage]);


  // Custom link canvas drawing using extracted renderer
  const linkCanvasObject = useMemo(() => {
    return createLinkRenderer({
      theme,
      utxoCollapseMode,
      nodeRadius: 20
    });
  }, [theme, utxoCollapseMode]);

  // Graph interaction handlers (extracted to hook)
  const { handleNodeHover, handleNodeClick, handleNodeDragEnd, handleLinkClick } = useGraphInteraction({
    fgRef,
    mountedRef,
    hoveredNode,
    setHoveredNode: selection.setHoveredNode,
    selectedNodes,
    setSelectedNodes: (nodes: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      if (typeof nodes === 'function') {
        const result = nodes(selectedNodes);
        selection.selectNodes(Array.from(result));
      } else {
        selection.selectNodes(Array.from(nodes));
      }
    },
    areaSelectionMode,
    onNodeClick,
    onNodeDoubleClick,
    onNodeAdd,
    onNodeRemove,
    onNodeDrag,
    onEdgeClick
  });

  // Image preloading for performance (extracted to hook)
  useImagePreloading({
    fgRef: refs.fgRef,
    nodes,
    enabled: true
  });

  // Annotation management handlers (extracted to hook)
  const {
    graphToScreen,
    screenToGraph,
    findNearestNode,
    findAnnotationAtPoint,
    findResizeHandleAtPoint,
    getResizeHandles,
    calculateResizedDimensions,
    handleTextSave,
    handleTextCancel
  } = useAnnotationManagement({
    fgRef,
    overlayCanvasRef,
    nodes,
    drawingHistory,
    textEditorState,
    setTextEditorState: (value) => {
      if (value === null) {
        drawing.closeTextEditor();
      } else if (typeof value === 'function') {
        const result = value(textEditorState);
        if (result) drawing.openTextEditor(result);
        else drawing.closeTextEditor();
      } else {
        drawing.openTextEditor(value);
      }
    },
    activeColor,
    selectedAnnotationIndex,
    onDrawingAction,
    onAnnotationUpdate: _onAnnotationUpdate
  });

  // Get resize handles for selected annotation
  const resizeHandles = useMemo(() => {
    if (selectedAnnotationIndex !== null && selectedAnnotationIndex >= 0) {
      return getResizeHandles(selectedAnnotationIndex);
    }
    return [];
  }, [selectedAnnotationIndex, getResizeHandles]);

  // Helper function to get cursor for resize handles
  const getResizeCursor = useCallback((handleType: string): string => {
    if (handleType.startsWith('corner-nw') || handleType.startsWith('corner-se')) return 'nwse-resize';
    if (handleType.startsWith('corner-ne') || handleType.startsWith('corner-sw')) return 'nesw-resize';
    if (handleType.startsWith('edge-n') || handleType.startsWith('edge-s')) return 'ns-resize';
    if (handleType.startsWith('edge-e') || handleType.startsWith('edge-w')) return 'ew-resize';
    if (handleType.startsWith('endpoint-') || handleType.startsWith('circle-')) return 'move';
    return 'default';
  }, []);

  // Use annotation rendering hook (extracted from large useEffect)
  useAnnotationRendering({
    fgRef,
    overlayCanvasRef: overlayCanvasRef as React.RefObject<HTMLCanvasElement>,
    nodes,
    drawingHistory,
    selectedAnnotationIndex,
    draggingAnnotation,
    resizingAnnotation,
    drawingLine,
    drawingShape,
    activeTool,
    activeColor,
    selectionBox,
    graphToScreen,
    graphTransform: ui.graphTransform, // Add transform to trigger re-render on pan/zoom
    resizeHandles,
    hoveredHandle
  });

  // Create memoized edit text annotation function now that graphToScreen is available
  const editTextAnnotationFunction = useCallback(() => {
    if (selectedAnnotationIndex !== null && selectedAnnotationIndex >= 0) {
      const annotation = drawingHistory[selectedAnnotationIndex];
      if (annotation?.type === 'addText') {
        // Calculate screen position from annotation data
        let x = annotation.data.x;
        let y = annotation.data.y;

        // Handle node attachment
        if (annotation.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === annotation.data.attachedNodeId);
          if (attachedNode) {
            x = attachedNode.x + annotation.data.x;
            y = attachedNode.y + annotation.data.y;
          }
        }

        const screenCoords = graphToScreen(x, y);
        drawing.openTextEditor({
          x: screenCoords.x,
          y: screenCoords.y,
          graphX: x,
          graphY: y
        });
      }
    }
  }, [selectedAnnotationIndex, drawingHistory, nodes, graphToScreen, drawing]);

  // Update ref to the memoized function
  editTextAnnotationRef.current = editTextAnnotationFunction;

  // Handle mouse down for overlay canvas
  const handleOverlayMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'select') {
      // Priority 1: Check for resize handle click
      if (selectedAnnotationIndex !== null && selectedAnnotationIndex >= 0) {
        const handleInfo = findResizeHandleAtPoint(x, y, selectedAnnotationIndex);
        if (handleInfo) {
          const action = drawingHistory[selectedAnnotationIndex];
          const graphCoords = screenToGraph(x, y);
          drawing.startResizingAnnotation({
            index: selectedAnnotationIndex,
            handleType: handleInfo.type,
            startX: graphCoords.x,
            startY: graphCoords.y,
            currentX: graphCoords.x,
            currentY: graphCoords.y,
            originalData: action.data
          });
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // Priority 2: In design mode with select tool, check for annotation clicks
      const clickedIndex = findAnnotationAtPoint(x, y);

      if (clickedIndex >= 0) {
        // Clicking on an annotation
        const clickedAnnotation = drawingHistory[clickedIndex];

        // Check if double-clicking on a text annotation to edit it
        if (clickedAnnotation?.type === 'addText' && clickedIndex === selectedAnnotationIndex) {
          // Double-click detection - edit text annotation
          const now = Date.now();
          const timeSinceLastClick = now - (lastTextClickTime.current || 0);

          if (timeSinceLastClick < 300) {
            // Double-click detected - open text editor for editing
            const graphCoords = screenToGraph(x, y);
            drawing.openTextEditor({
              x,
              y,
              graphX: graphCoords.x,
              graphY: graphCoords.y
            });
            lastTextClickTime.current = 0; // Reset
            e.preventDefault();
            e.stopPropagation();
            return;
          }

          lastTextClickTime.current = now;

          // Single click on selected text - start dragging
          drawing.startDraggingAnnotation({
            index: selectedAnnotationIndex,
            startX: x,
            startY: y
          });
        } else if (clickedIndex === selectedAnnotationIndex) {
          // Start dragging the selected annotation (non-text)
          drawing.startDraggingAnnotation({
            index: selectedAnnotationIndex,
            startX: x,
            startY: y
          });
        } else {
          // Select a different annotation
          if (onAnnotationSelect) {
            onAnnotationSelect(clickedIndex);
          }
          lastTextClickTime.current = Date.now();
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Not clicking on an annotation - deselect if something was selected
      if (selectedAnnotationIndex !== null && onAnnotationSelect) {
        onAnnotationSelect(null);
      }

      // Let the event pass through for pan/zoom
      return;
    } else if (activeTool === 'draw') {
      drawing.startDrawingLine({ x, y });
    } else if (activeTool === 'rectangle' || activeTool === 'circle') {
      // Smart behavior: if clicking on existing shape of same type, select it instead of creating new
      const clickedIndex = findAnnotationAtPoint(x, y);
      if (clickedIndex >= 0) {
        const clickedAnnotation = drawingHistory[clickedIndex];
        const isSameType =
          (activeTool === 'circle' && clickedAnnotation.type === 'addCircle') ||
          (activeTool === 'rectangle' && clickedAnnotation.type === 'addRectangle');

        if (isSameType) {
          // Select the annotation and switch to select tool
          if (onAnnotationSelect) {
            onAnnotationSelect(clickedIndex);
          }
          // Auto-switch to select tool for manipulation
          modeActions.setDesignTool('select');
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // Not clicking on same shape type - create new shape
      drawing.startDrawingShape({ x, y });
    } else if (activeTool === 'text') {
      // Handle text annotation - show inline editor
      const graphCoords = screenToGraph(x, y);
      drawing.openTextEditor({ x, y, graphX: graphCoords.x, graphY: graphCoords.y });
    }
  }, [activeTool, selectedAnnotationIndex, findAnnotationAtPoint, findResizeHandleAtPoint, drawingHistory, screenToGraph, drawing, onAnnotationSelect, modeActions]);

  // Handle mouse move for overlay canvas
  const handleOverlayMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle resizing updates
    if (resizingAnnotation) {
      const graphCoords = screenToGraph(x, y);
      drawing.updateResizingAnnotation(graphCoords.x, graphCoords.y);
      return;
    }

    // Use throttled handler for drawing/dragging operations
    throttledMouseMove(x, y, {
      draggingAnnotation,
      isDrawing,
      drawingLine,
      drawingShape
    });

    // Resize handle hover detection (not throttled for better UX)
    if (activeTool === 'select' && selectedAnnotationIndex !== null && !draggingAnnotation && !isDrawing && !drawingShape) {
      const handleInfo = findResizeHandleAtPoint(x, y, selectedAnnotationIndex);
      drawing.setHoveredHandle(handleInfo ? handleInfo.type : null);

      // If not hovering a handle, check for annotation hover
      if (!handleInfo) {
        const annotationIndex = findAnnotationAtPoint(x, y);
        drawing.setHoveredAnnotation(annotationIndex >= 0 ? annotationIndex : null);
      }
    } else if (activeTool === 'select' && !draggingAnnotation && !isDrawing && !drawingShape) {
      // No annotation selected - just check for annotation hover
      const annotationIndex = findAnnotationAtPoint(x, y);
      drawing.setHoveredAnnotation(annotationIndex >= 0 ? annotationIndex : null);
    }
  }, [throttledMouseMove, draggingAnnotation, resizingAnnotation, isDrawing, drawingLine, drawingShape, activeTool, selectedAnnotationIndex, findAnnotationAtPoint, findResizeHandleAtPoint, screenToGraph, drawing]);

  // Handle mouse up for annotation dragging and drawing
  const handleOverlayMouseUp = useCallback(() => {
    // Handle resizing completion
    if (resizingAnnotation && _onAnnotationUpdate) {
      const action = drawingHistory[resizingAnnotation.index];
      if (action) {
        // Calculate new dimensions using the helper function
        const newData = calculateResizedDimensions(
          resizingAnnotation.originalData,
          resizingAnnotation.handleType,
          resizingAnnotation.currentX,
          resizingAnnotation.currentY,
          nodes
        );

        _onAnnotationUpdate(resizingAnnotation.index, newData);
      }
      drawing.endResizingAnnotation();
      return;
    }

    if (draggingAnnotation && _onAnnotationUpdate) {
      // Save the new position of the dragged annotation
      const action = drawingHistory[draggingAnnotation.index];
      if (!action) {
        drawing.endDraggingAnnotation();
        return;
      }

      // Convert screen offset to graph offset
      const startGraphCoords = screenToGraph(draggingAnnotation.startX, draggingAnnotation.startY);
      const endGraphCoords = screenToGraph(
        draggingAnnotation.startX + draggingAnnotation.offsetX,
        draggingAnnotation.startY + draggingAnnotation.offsetY
      );
      const graphOffsetX = endGraphCoords.x - startGraphCoords.x;
      const graphOffsetY = endGraphCoords.y - startGraphCoords.y;

      // Update annotation position based on type
      if (action.type === 'addText') {
        _onAnnotationUpdate(draggingAnnotation.index, {
          x: action.data.x + graphOffsetX,
          y: action.data.y + graphOffsetY
        });
      } else if (action.type === 'addLine') {
        _onAnnotationUpdate(draggingAnnotation.index, {
          line: {
            start: {
              x: action.data.line.start.x + graphOffsetX,
              y: action.data.line.start.y + graphOffsetY
            },
            end: {
              x: action.data.line.end.x + graphOffsetX,
              y: action.data.line.end.y + graphOffsetY
            }
          }
        });
      } else if (action.type === 'addRectangle' || action.type === 'addCircle') {
        _onAnnotationUpdate(draggingAnnotation.index, {
          shape: {
            start: {
              x: action.data.shape.start.x + graphOffsetX,
              y: action.data.shape.start.y + graphOffsetY
            },
            end: {
              x: action.data.shape.end.x + graphOffsetX,
              y: action.data.shape.end.y + graphOffsetY
            }
          }
        });
      }

      drawing.endDraggingAnnotation();
    } else if (isDrawing && drawingLine && onDrawingAction) {
      // Convert screen coordinates to graph coordinates before saving
      const startGraph = screenToGraph(drawingLine.start.x, drawingLine.start.y);
      const endGraph = screenToGraph(drawingLine.end.x, drawingLine.end.y);

      // Find nearest node for attachment (use midpoint of line)
      const midX = (startGraph.x + endGraph.x) / 2;
      const midY = (startGraph.y + endGraph.y) / 2;
      const attachedNodeId = findNearestNode(midX, midY);

      let lineStart = { x: startGraph.x, y: startGraph.y };
      let lineEnd = { x: endGraph.x, y: endGraph.y };

      // If attached to a node, store relative offsets
      if (attachedNodeId) {
        const node = nodes.find(n => n.id === attachedNodeId);
        if (node) {
          lineStart = { x: startGraph.x - node.x, y: startGraph.y - node.y };
          lineEnd = { x: endGraph.x - node.x, y: endGraph.y - node.y };
        }
      }

      onDrawingAction({
        type: 'addLine',
        data: {
          id: crypto.randomUUID(),
          line: { start: lineStart, end: lineEnd },
          color: activeColor,
          attachedNodeId: attachedNodeId || undefined
        }
      });
      drawing.endDrawingLine();
    } else if (drawingShape && onDrawingAction) {
      // Convert screen coordinates to graph coordinates before saving
      const startGraph = screenToGraph(drawingShape.start.x, drawingShape.start.y);
      const endGraph = screenToGraph(drawingShape.end.x, drawingShape.end.y);

      // Find nearest node for attachment (use center of shape)
      const centerX = (startGraph.x + endGraph.x) / 2;
      const centerY = (startGraph.y + endGraph.y) / 2;
      const attachedNodeId = findNearestNode(centerX, centerY);

      let shapeStart = { x: startGraph.x, y: startGraph.y };
      let shapeEnd = { x: endGraph.x, y: endGraph.y };

      // If attached to a node, store relative offsets
      if (attachedNodeId) {
        const node = nodes.find(n => n.id === attachedNodeId);
        if (node) {
          shapeStart = { x: startGraph.x - node.x, y: startGraph.y - node.y };
          shapeEnd = { x: endGraph.x - node.x, y: endGraph.y - node.y };
        }
      }

      const type = activeTool === 'rectangle' ? 'addRectangle' : 'addCircle';
      onDrawingAction({
        type,
        data: {
          id: crypto.randomUUID(),
          shape: { start: shapeStart, end: shapeEnd },
          color: activeColor,
          attachedNodeId: attachedNodeId || undefined
        }
      });
      drawing.endDrawingShape();
    }
  }, [draggingAnnotation, resizingAnnotation, _onAnnotationUpdate, drawingHistory, screenToGraph, isDrawing, drawingLine, drawingShape, onDrawingAction, activeColor, activeTool, findNearestNode, nodes, drawing, calculateResizedDimensions]);

  // Set cursor on the ForceGraph canvas
  useEffect(() => {
    if (!fgRef.current) return;

    // Find the canvas element inside the ForceGraph
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Determine cursor based on mode and hover state
    let cursor = 'default';

    if (isSelectMode) {
      // In select mode, show grab cursor when not hovering nodes
      cursor = 'grab';
    } else if (isDesignMode) {
      if (activeTool === 'select') {
        cursor = 'default';
      } else if (activeTool === 'text') {
        cursor = 'text';
      } else {
        cursor = 'crosshair';
      }
    } else if (isAreaSelectMode) {
      cursor = 'crosshair';
    }

    canvas.style.cursor = cursor;
  }, [fgRef, containerRef, isSelectMode, isDesignMode, isAreaSelectMode, activeTool]);

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className="w-full h-full relative overflow-hidden">
      {/* Transparent overlay for shift+drag or area selection mode */}
      {activeTool === 'select' && (isShiftPressed || areaSelectionMode) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            cursor: 'crosshair',
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            selection.startSelectionBox({ x, y });
          }}
          onMouseMove={(e) => {
            if (selectionBox) {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              throttledSelectionBoxMove(x, y, selectionBox);
            }
          }}
          onMouseUp={(e) => {
            if (selectionBox && fgRef.current) {
              // Find nodes within selection box
              const { start, end } = selectionBox;
              const minX = Math.min(start.x, end.x);
              const maxX = Math.max(start.x, end.x);
              const minY = Math.min(start.y, end.y);
              const maxY = Math.max(start.y, end.y);

              // Convert screen coordinates to graph coordinates
              const topLeft = fgRef.current.screen2GraphCoords(minX, minY);
              const bottomRight = fgRef.current.screen2GraphCoords(maxX, maxY);

              // Find nodes within bounds
              const nodesInBox = nodes.filter(node =>
                node.x >= topLeft.x && node.x <= bottomRight.x &&
                node.y >= topLeft.y && node.y <= bottomRight.y
              );

              // Check if multi-select key is pressed
              const isMultiSelect = e.metaKey || e.ctrlKey;

              if (isMultiSelect) {
                // Add to existing selection
                selection.addToSelection(nodesInBox.map(n => n.id));
              } else {
                // Replace selection
                selection.selectNodes(nodesInBox.map(n => n.id));
              }

              selection.endSelectionBox();
            }
          }}
        />
      )}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: FTNode, color: string, ctx: CanvasRenderingContext2D) => {
            // Increase clickable area to include node circle AND add/delete buttons
            // Buttons are at radius + 6 offset, with button radius of 7, so total reach is ~33
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 40, 0, Math.PI * 2);
            ctx.fill();
          }}
          onNodeHover={handleNodeHover}
          onBackgroundClick={(event) => {
            // Check if clicking on an annotation first
            if (activeTool === 'select' && onAnnotationSelect) {
              const canvas = event.target as HTMLCanvasElement;
              if (canvas && fgRef.current) {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const annotationIndex = findAnnotationAtPoint(x, y);

                if (annotationIndex >= 0) {
                  // Clicked on an annotation
                  onAnnotationSelect(annotationIndex);
                  return;
                }
              }
            }

            // Clicked on empty space - deselect annotation and clear node selection
            if (onAnnotationSelect) {
              onAnnotationSelect(null);
            }
            if (!event.metaKey && !event.ctrlKey) {
              selection.clearSelection();
            }
          }}
          // Link configuration - adapt color to theme
          linkWidth={0}
          linkColor={() => theme === 'dark' ? '#6b7280' : '#000000'}
          linkDirectionalArrowLength={0}
          linkDirectionalArrowRelPos={0}
          linkCurvature={(link: any) => link.curvature || 0}
          linkCanvasObject={linkCanvasObject}
          linkCanvasObjectMode={() => 'replace'}
          linkLabel={(link: FTConnection & { amount?: string; currency?: string; utxoCount?: number }) =>
            getLinkLabel(link, utxoCollapseMode)
          }
          onNodeClick={handleNodeClick}
          onNodeDragEnd={handleNodeDragEnd}
          onLinkClick={handleLinkClick}
          nodeRelSize={1}
          enableNodeDrag={isSelectMode}
          enablePanInteraction={!isAreaSelectMode}
          cooldownTicks={0}
          d3AlphaDecay={0}
          d3VelocityDecay={0.3}
          backgroundColor={theme === 'dark' ? '#0f172a' : '#f8fafc'}
          width={dimensions.width}
          height={dimensions.height}
          onZoom={updateGraphTransform}
        />
      </div>
      {/* Overlay canvas for drawing tools */}
      <canvas
        ref={overlayCanvasRef as React.RefObject<HTMLCanvasElement>}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: dimensions.width + 'px',
          height: dimensions.height + 'px',
          // Pointer events logic - Smart event handling for design mode:
          // - Design mode + select tool: intercept only when hovering/interacting with annotation
          // - Design mode + drawing tools: always intercept
          // - Select mode: only intercept when annotation is selected
          // - Area select mode: never intercept (handled by overlay div)
          pointerEvents:
            isDesignMode && activeTool === 'select'
              ? (hoveredAnnotation !== null || hoveredHandle !== null || draggingAnnotation || resizingAnnotation || selectedAnnotationIndex !== null)
                ? 'auto'  // Intercept for annotation interaction/resizing
                : 'none'  // Allow pan/zoom when not over annotation
              : isDesignMode
                ? 'auto'  // Drawing tools need to intercept all events
                : isSelectMode && selectedAnnotationIndex === null
                  ? 'none'  // Allow graph pan/zoom/drag
                  : isAreaSelectMode
                    ? 'none'  // Area selection handled by separate overlay
                    : 'auto', // Annotation selected
          cursor: resizingAnnotation
            ? getResizeCursor(resizingAnnotation.handleType)
            : hoveredHandle
              ? getResizeCursor(hoveredHandle)
              : draggingAnnotation
                ? 'grabbing'
                : hoveredAnnotation !== null
                  ? 'grab'
                  : activeTool === 'text'
                    ? 'text'
                    : activeTool === 'select'
                      ? 'grab'  // Show open hand when able to pan
                      : 'crosshair'
        }}
        onMouseDown={handleOverlayMouseDown}
        onMouseMove={handleOverlayMouseMove}
        onMouseUp={handleOverlayMouseUp}
      />

      {/* Inline Text Editor */}
      {textEditorState && (() => {
        // Check if we're editing an existing text annotation
        const editingAnnotation = selectedAnnotationIndex !== null && selectedAnnotationIndex >= 0
          ? drawingHistory[selectedAnnotationIndex]
          : null;
        const isEditingText = editingAnnotation?.type === 'addText';

        return (
          <InlineTextEditor
            x={textEditorState.x}
            y={textEditorState.y}
            color={activeColor}
            initialText={isEditingText ? editingAnnotation.data.text : undefined}
            initialFontSize={isEditingText ? editingAnnotation.data.fontSize : undefined}
            initialBold={isEditingText ? editingAnnotation.data.bold : undefined}
            initialItalic={isEditingText ? editingAnnotation.data.italic : undefined}
            initialBackgroundColor={isEditingText ? editingAnnotation.data.backgroundColor : undefined}
            onSave={handleTextSave}
            onCancel={handleTextCancel}
          />
        );
      })()}
    </div>
  );
});

NetworkGraphV2Base.displayName = 'NetworkGraphV2Base';

// Export memoized version to prevent unnecessary re-renders
export const NetworkGraphV2 = memo(NetworkGraphV2Base);
NetworkGraphV2.displayName = 'NetworkGraphV2';