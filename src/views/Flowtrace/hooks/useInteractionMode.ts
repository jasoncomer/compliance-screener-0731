/**
 * useInteractionMode Hook
 * Centralized state machine for FlowTrace interaction modes
 * Manages transitions between select, area selection, and design modes
 */

import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectFlowtraceInteractionMode,
  selectFlowtraceDesignTool,
  setFlowtraceInteractionMode,
  setFlowtraceDesignTool,
  FlowtraceInteractionMode,
  FlowtraceDesignTool
} from '@/store/slices/uiSlice';

export type { FlowtraceInteractionMode, FlowtraceDesignTool };

export interface InteractionModeState {
  mode: FlowtraceInteractionMode;
  designTool: FlowtraceDesignTool;
  isDesignMode: boolean;
  isAreaSelectMode: boolean;
  isSelectMode: boolean;
}

export interface InteractionModeActions {
  // Mode transitions
  enterSelectMode: () => void;
  enterAreaSelectMode: () => void;
  enterDesignMode: () => void;
  exitDesignMode: () => void;

  // Design tool changes
  setDesignTool: (tool: FlowtraceDesignTool) => void;

  // Cleanup callbacks
  onModeChange: (callback: (newMode: FlowtraceInteractionMode) => void) => void;
}

export interface InteractionModeHandlers {
  state: InteractionModeState;
  actions: InteractionModeActions;
}

/**
 * Centralized hook for managing interaction modes
 * Ensures clean transitions and prevents invalid state combinations
 */
export function useInteractionMode(options?: {
  onAnnotationDeselect?: () => void;
  onNodeSelectionClear?: () => void;
}): InteractionModeHandlers {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectFlowtraceInteractionMode);
  const designTool = useAppSelector(selectFlowtraceDesignTool);

  const { onAnnotationDeselect, onNodeSelectionClear } = options || {};

  // Computed state
  const isDesignMode = mode === 'design';
  const isAreaSelectMode = mode === 'area_select';
  const isSelectMode = mode === 'select';

  // Mode transition: Enter Select Mode
  const enterSelectMode = useCallback(() => {
    if (mode === 'select') return; // Already in select mode

    // Cleanup before entering select mode
    if (onAnnotationDeselect) {
      onAnnotationDeselect(); // Deselect any selected annotations
    }

    dispatch(setFlowtraceInteractionMode('select'));
  }, [mode, dispatch, onAnnotationDeselect]);

  // Mode transition: Enter Area Select Mode
  const enterAreaSelectMode = useCallback(() => {
    if (mode === 'area_select') return; // Already in area select mode

    // Cleanup before entering area select mode
    if (onAnnotationDeselect) {
      onAnnotationDeselect(); // Deselect any selected annotations
    }

    dispatch(setFlowtraceInteractionMode('area_select'));
  }, [mode, dispatch, onAnnotationDeselect]);

  // Mode transition: Enter Design Mode
  const enterDesignMode = useCallback(() => {
    if (mode === 'design') return; // Already in design mode

    // Cleanup before entering design mode
    if (onNodeSelectionClear) {
      onNodeSelectionClear(); // Clear node selection when entering design mode
    }

    dispatch(setFlowtraceInteractionMode('design'));
    // Default to select tool when entering design mode
    dispatch(setFlowtraceDesignTool('select'));
  }, [mode, dispatch, onNodeSelectionClear]);

  // Mode transition: Exit Design Mode (return to select mode)
  const exitDesignMode = useCallback(() => {
    if (mode !== 'design') return; // Not in design mode

    // Cleanup before exiting design mode
    if (onAnnotationDeselect) {
      onAnnotationDeselect(); // Deselect any selected annotations
    }

    dispatch(setFlowtraceInteractionMode('select'));
  }, [mode, dispatch, onAnnotationDeselect]);

  // Change design tool within design mode
  const setDesignToolAction = useCallback((tool: FlowtraceDesignTool) => {
    // Only allow tool changes when in design mode
    if (mode !== 'design') {
      console.warn('Cannot change design tool outside of design mode');
      return;
    }

    // Deselect annotation when switching tools (except when switching to select)
    if (tool !== 'select' && onAnnotationDeselect) {
      onAnnotationDeselect();
    }

    dispatch(setFlowtraceDesignTool(tool));
  }, [mode, dispatch, onAnnotationDeselect]);

  // Mode change callback registration
  const onModeChange = useCallback((callback: (newMode: FlowtraceInteractionMode) => void) => {
    // This is a placeholder for future effect subscription system
    // For now, components should use useEffect with mode as dependency
    callback(mode);
  }, [mode]);

  return {
    state: {
      mode,
      designTool,
      isDesignMode,
      isAreaSelectMode,
      isSelectMode
    },
    actions: {
      enterSelectMode,
      enterAreaSelectMode,
      enterDesignMode,
      exitDesignMode,
      setDesignTool: setDesignToolAction,
      onModeChange
    }
  };
}
