/**
 * useSelectionState Hook
 * Manages all selection-related state using useReducer for atomic updates
 * Handles node selection, hover, and area selection box
 */

import { useReducer, useCallback } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface SelectionBox {
  start: Point;
  end: Point;
}

export interface SelectionState {
  selectedNodes: Set<string>;
  hoveredNode: string | null;
  selectionBox: SelectionBox | null;
  isShiftPressed: boolean;
}

type SelectionAction =
  | { type: 'SELECT_NODES'; nodeIds: string[] }
  | { type: 'ADD_TO_SELECTION'; nodeIds: string[] }
  | { type: 'REMOVE_FROM_SELECTION'; nodeIds: string[] }
  | { type: 'TOGGLE_NODE'; nodeId: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_HOVERED_NODE'; nodeId: string | null }
  | { type: 'START_SELECTION_BOX'; point: Point }
  | { type: 'UPDATE_SELECTION_BOX'; point: Point }
  | { type: 'END_SELECTION_BOX' }
  | { type: 'CANCEL_SELECTION_BOX' }
  | { type: 'SET_SHIFT_PRESSED'; pressed: boolean };

const initialState: SelectionState = {
  selectedNodes: new Set(),
  hoveredNode: null,
  selectionBox: null,
  isShiftPressed: false
};

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case 'SELECT_NODES':
      return {
        ...state,
        selectedNodes: new Set(action.nodeIds)
      };

    case 'ADD_TO_SELECTION': {
      const newSelection = new Set(state.selectedNodes);
      action.nodeIds.forEach(id => newSelection.add(id));
      return {
        ...state,
        selectedNodes: newSelection
      };
    }

    case 'REMOVE_FROM_SELECTION': {
      const newSelection = new Set(state.selectedNodes);
      action.nodeIds.forEach(id => newSelection.delete(id));
      return {
        ...state,
        selectedNodes: newSelection
      };
    }

    case 'TOGGLE_NODE': {
      const newSelection = new Set(state.selectedNodes);
      if (newSelection.has(action.nodeId)) {
        newSelection.delete(action.nodeId);
      } else {
        newSelection.add(action.nodeId);
      }
      return {
        ...state,
        selectedNodes: newSelection
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedNodes: new Set()
      };

    case 'SET_HOVERED_NODE':
      return {
        ...state,
        hoveredNode: action.nodeId
      };

    case 'START_SELECTION_BOX':
      return {
        ...state,
        selectionBox: {
          start: action.point,
          end: action.point
        }
      };

    case 'UPDATE_SELECTION_BOX':
      if (!state.selectionBox) return state;
      return {
        ...state,
        selectionBox: {
          ...state.selectionBox,
          end: action.point
        }
      };

    case 'END_SELECTION_BOX':
      return {
        ...state,
        selectionBox: null
      };

    case 'CANCEL_SELECTION_BOX':
      return {
        ...state,
        selectionBox: null
      };

    case 'SET_SHIFT_PRESSED':
      return {
        ...state,
        isShiftPressed: action.pressed
      };

    default:
      return state;
  }
}

export interface SelectionStateHandlers {
  state: SelectionState;
  selectNodes: (nodeIds: string[]) => void;
  addToSelection: (nodeIds: string[]) => void;
  removeFromSelection: (nodeIds: string[]) => void;
  toggleNode: (nodeId: string) => void;
  clearSelection: () => void;
  setHoveredNode: (nodeId: string | null) => void;
  startSelectionBox: (point: Point) => void;
  updateSelectionBox: (point: Point) => void;
  endSelectionBox: () => void;
  cancelSelectionBox: () => void;
  setShiftPressed: (pressed: boolean) => void;
}

/**
 * Hook for managing selection state with useReducer
 * Provides atomic state updates and prevents invalid states
 */
export function useSelectionState(): SelectionStateHandlers {
  const [state, dispatch] = useReducer(selectionReducer, initialState);

  const selectNodes = useCallback((nodeIds: string[]) => {
    dispatch({ type: 'SELECT_NODES', nodeIds });
  }, []);

  const addToSelection = useCallback((nodeIds: string[]) => {
    dispatch({ type: 'ADD_TO_SELECTION', nodeIds });
  }, []);

  const removeFromSelection = useCallback((nodeIds: string[]) => {
    dispatch({ type: 'REMOVE_FROM_SELECTION', nodeIds });
  }, []);

  const toggleNode = useCallback((nodeId: string) => {
    dispatch({ type: 'TOGGLE_NODE', nodeId });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const setHoveredNode = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SET_HOVERED_NODE', nodeId });
  }, []);

  const startSelectionBox = useCallback((point: Point) => {
    dispatch({ type: 'START_SELECTION_BOX', point });
  }, []);

  const updateSelectionBox = useCallback((point: Point) => {
    dispatch({ type: 'UPDATE_SELECTION_BOX', point });
  }, []);

  const endSelectionBox = useCallback(() => {
    dispatch({ type: 'END_SELECTION_BOX' });
  }, []);

  const cancelSelectionBox = useCallback(() => {
    dispatch({ type: 'CANCEL_SELECTION_BOX' });
  }, []);

  const setShiftPressed = useCallback((pressed: boolean) => {
    dispatch({ type: 'SET_SHIFT_PRESSED', pressed });
  }, []);

  return {
    state,
    selectNodes,
    addToSelection,
    removeFromSelection,
    toggleNode,
    clearSelection,
    setHoveredNode,
    startSelectionBox,
    updateSelectionBox,
    endSelectionBox,
    cancelSelectionBox,
    setShiftPressed
  };
}
