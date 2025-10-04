/**
 * useDrawingState Hook
 * Manages drawing/annotation interaction state using useReducer
 * Implements state machine pattern to prevent invalid states
 */

import { useReducer, useCallback } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface LineShape {
  start: Point;
  end: Point;
}

export interface DraggingAnnotation {
  index: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export type ResizeHandleType =
  | 'corner-nw' | 'corner-ne' | 'corner-se' | 'corner-sw'
  | 'edge-n' | 'edge-s' | 'edge-e' | 'edge-w'
  | 'endpoint-start' | 'endpoint-end'
  | 'circle-n' | 'circle-ne' | 'circle-e' | 'circle-se'
  | 'circle-s' | 'circle-sw' | 'circle-w' | 'circle-nw';

export interface ResizingAnnotation {
  index: number;
  handleType: ResizeHandleType;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  originalData: any;
}

export interface TextEditorState {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
}

export type DrawingMode = 'idle' | 'drawing_line' | 'drawing_shape' | 'dragging_annotation' | 'resizing_annotation' | 'editing_text';

export interface DrawingState {
  mode: DrawingMode;
  drawingLine: LineShape | null;
  drawingShape: LineShape | null;
  draggingAnnotation: DraggingAnnotation | null;
  resizingAnnotation: ResizingAnnotation | null;
  hoveredAnnotation: number | null;
  hoveredHandle: ResizeHandleType | null;
  textEditorState: TextEditorState | null;
  isDrawing: boolean; // Legacy flag for compatibility
}

type DrawingAction =
  | { type: 'START_DRAWING_LINE'; point: Point }
  | { type: 'UPDATE_DRAWING_LINE'; point: Point }
  | { type: 'END_DRAWING_LINE' }
  | { type: 'START_DRAWING_SHAPE'; point: Point }
  | { type: 'UPDATE_DRAWING_SHAPE'; point: Point }
  | { type: 'END_DRAWING_SHAPE' }
  | { type: 'START_DRAGGING_ANNOTATION'; annotation: Omit<DraggingAnnotation, 'offsetX' | 'offsetY'> }
  | { type: 'UPDATE_DRAGGING_ANNOTATION'; offsetX: number; offsetY: number }
  | { type: 'END_DRAGGING_ANNOTATION' }
  | { type: 'START_RESIZING_ANNOTATION'; annotation: ResizingAnnotation }
  | { type: 'UPDATE_RESIZING_ANNOTATION'; x: number; y: number }
  | { type: 'END_RESIZING_ANNOTATION' }
  | { type: 'SET_HOVERED_ANNOTATION'; index: number | null }
  | { type: 'SET_HOVERED_HANDLE'; handleType: ResizeHandleType | null }
  | { type: 'OPEN_TEXT_EDITOR'; state: TextEditorState }
  | { type: 'CLOSE_TEXT_EDITOR' }
  | { type: 'CANCEL_ALL' };

const initialState: DrawingState = {
  mode: 'idle',
  drawingLine: null,
  drawingShape: null,
  draggingAnnotation: null,
  resizingAnnotation: null,
  hoveredAnnotation: null,
  hoveredHandle: null,
  textEditorState: null,
  isDrawing: false
};

function drawingReducer(state: DrawingState, action: DrawingAction): DrawingState {
  switch (action.type) {
    case 'START_DRAWING_LINE':
      return {
        ...initialState, // Reset all other state
        mode: 'drawing_line',
        drawingLine: {
          start: action.point,
          end: action.point
        },
        isDrawing: true
      };

    case 'UPDATE_DRAWING_LINE':
      if (state.mode !== 'drawing_line' || !state.drawingLine) return state;
      return {
        ...state,
        drawingLine: {
          ...state.drawingLine,
          end: action.point
        }
      };

    case 'END_DRAWING_LINE':
      if (state.mode !== 'drawing_line') return state;
      return {
        ...initialState,
        mode: 'idle'
      };

    case 'START_DRAWING_SHAPE':
      return {
        ...initialState, // Reset all other state
        mode: 'drawing_shape',
        drawingShape: {
          start: action.point,
          end: action.point
        }
      };

    case 'UPDATE_DRAWING_SHAPE':
      if (state.mode !== 'drawing_shape' || !state.drawingShape) return state;
      return {
        ...state,
        drawingShape: {
          ...state.drawingShape,
          end: action.point
        }
      };

    case 'END_DRAWING_SHAPE':
      if (state.mode !== 'drawing_shape') return state;
      return {
        ...initialState,
        mode: 'idle'
      };

    case 'START_DRAGGING_ANNOTATION':
      return {
        ...initialState, // Reset all other state
        mode: 'dragging_annotation',
        draggingAnnotation: {
          ...action.annotation,
          offsetX: 0,
          offsetY: 0
        }
      };

    case 'UPDATE_DRAGGING_ANNOTATION':
      if (state.mode !== 'dragging_annotation' || !state.draggingAnnotation) return state;
      return {
        ...state,
        draggingAnnotation: {
          ...state.draggingAnnotation,
          offsetX: action.offsetX,
          offsetY: action.offsetY
        }
      };

    case 'END_DRAGGING_ANNOTATION':
      if (state.mode !== 'dragging_annotation') return state;
      return {
        ...initialState,
        mode: 'idle'
      };

    case 'START_RESIZING_ANNOTATION':
      return {
        ...initialState, // Reset all other state
        mode: 'resizing_annotation',
        resizingAnnotation: action.annotation
      };

    case 'UPDATE_RESIZING_ANNOTATION':
      if (state.mode !== 'resizing_annotation' || !state.resizingAnnotation) return state;
      return {
        ...state,
        resizingAnnotation: {
          ...state.resizingAnnotation,
          currentX: action.x,
          currentY: action.y
        }
      };

    case 'END_RESIZING_ANNOTATION':
      if (state.mode !== 'resizing_annotation') return state;
      return {
        ...initialState,
        mode: 'idle'
      };

    case 'SET_HOVERED_ANNOTATION':
      // Only allow hovering when idle
      if (state.mode !== 'idle') return state;
      return {
        ...state,
        hoveredAnnotation: action.index
      };

    case 'SET_HOVERED_HANDLE':
      // Only allow handle hovering when idle or when hovering annotation
      if (state.mode !== 'idle') return state;
      return {
        ...state,
        hoveredHandle: action.handleType
      };

    case 'OPEN_TEXT_EDITOR':
      return {
        ...initialState, // Reset all other state
        mode: 'editing_text',
        textEditorState: action.state
      };

    case 'CLOSE_TEXT_EDITOR':
      if (state.mode !== 'editing_text') return state;
      return {
        ...initialState,
        mode: 'idle'
      };

    case 'CANCEL_ALL':
      return {
        ...initialState,
        mode: 'idle'
      };

    default:
      return state;
  }
}

export interface DrawingStateHandlers {
  state: DrawingState;
  startDrawingLine: (point: Point) => void;
  updateDrawingLine: (point: Point) => void;
  endDrawingLine: () => void;
  startDrawingShape: (point: Point) => void;
  updateDrawingShape: (point: Point) => void;
  endDrawingShape: () => void;
  startDraggingAnnotation: (annotation: Omit<DraggingAnnotation, 'offsetX' | 'offsetY'>) => void;
  updateDraggingAnnotation: (offsetX: number, offsetY: number) => void;
  endDraggingAnnotation: () => void;
  startResizingAnnotation: (annotation: ResizingAnnotation) => void;
  updateResizingAnnotation: (x: number, y: number) => void;
  endResizingAnnotation: () => void;
  setHoveredAnnotation: (index: number | null) => void;
  setHoveredHandle: (handleType: ResizeHandleType | null) => void;
  openTextEditor: (state: TextEditorState) => void;
  closeTextEditor: () => void;
  cancelAll: () => void;
}

/**
 * Hook for managing drawing state with useReducer
 * Uses state machine pattern to prevent invalid states
 * (e.g., can't be drawing and dragging simultaneously)
 */
export function useDrawingState(): DrawingStateHandlers {
  const [state, dispatch] = useReducer(drawingReducer, initialState);

  const startDrawingLine = useCallback((point: Point) => {
    dispatch({ type: 'START_DRAWING_LINE', point });
  }, []);

  const updateDrawingLine = useCallback((point: Point) => {
    dispatch({ type: 'UPDATE_DRAWING_LINE', point });
  }, []);

  const endDrawingLine = useCallback(() => {
    dispatch({ type: 'END_DRAWING_LINE' });
  }, []);

  const startDrawingShape = useCallback((point: Point) => {
    dispatch({ type: 'START_DRAWING_SHAPE', point });
  }, []);

  const updateDrawingShape = useCallback((point: Point) => {
    dispatch({ type: 'UPDATE_DRAWING_SHAPE', point });
  }, []);

  const endDrawingShape = useCallback(() => {
    dispatch({ type: 'END_DRAWING_SHAPE' });
  }, []);

  const startDraggingAnnotation = useCallback((annotation: Omit<DraggingAnnotation, 'offsetX' | 'offsetY'>) => {
    dispatch({ type: 'START_DRAGGING_ANNOTATION', annotation });
  }, []);

  const updateDraggingAnnotation = useCallback((offsetX: number, offsetY: number) => {
    dispatch({ type: 'UPDATE_DRAGGING_ANNOTATION', offsetX, offsetY });
  }, []);

  const endDraggingAnnotation = useCallback(() => {
    dispatch({ type: 'END_DRAGGING_ANNOTATION' });
  }, []);

  const startResizingAnnotation = useCallback((annotation: ResizingAnnotation) => {
    dispatch({ type: 'START_RESIZING_ANNOTATION', annotation });
  }, []);

  const updateResizingAnnotation = useCallback((x: number, y: number) => {
    dispatch({ type: 'UPDATE_RESIZING_ANNOTATION', x, y });
  }, []);

  const endResizingAnnotation = useCallback(() => {
    dispatch({ type: 'END_RESIZING_ANNOTATION' });
  }, []);

  const setHoveredAnnotation = useCallback((index: number | null) => {
    dispatch({ type: 'SET_HOVERED_ANNOTATION', index });
  }, []);

  const setHoveredHandle = useCallback((handleType: ResizeHandleType | null) => {
    dispatch({ type: 'SET_HOVERED_HANDLE', handleType });
  }, []);

  const openTextEditor = useCallback((editorState: TextEditorState) => {
    dispatch({ type: 'OPEN_TEXT_EDITOR', state: editorState });
  }, []);

  const closeTextEditor = useCallback(() => {
    dispatch({ type: 'CLOSE_TEXT_EDITOR' });
  }, []);

  const cancelAll = useCallback(() => {
    dispatch({ type: 'CANCEL_ALL' });
  }, []);

  return {
    state,
    startDrawingLine,
    updateDrawingLine,
    endDrawingLine,
    startDrawingShape,
    updateDrawingShape,
    endDrawingShape,
    startDraggingAnnotation,
    updateDraggingAnnotation,
    endDraggingAnnotation,
    startResizingAnnotation,
    updateResizingAnnotation,
    endResizingAnnotation,
    setHoveredAnnotation,
    setHoveredHandle,
    openTextEditor,
    closeTextEditor,
    cancelAll
  };
}
