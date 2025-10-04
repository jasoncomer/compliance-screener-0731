import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from '../store';

/**
 * FlowTrace interaction modes
 */
export type FlowtraceInteractionMode = 'select' | 'area_select' | 'design';

/**
 * Design tools available in design mode
 */
export type FlowtraceDesignTool = 'select' | 'draw' | 'rectangle' | 'circle' | 'text';

/**
 * Generic UI state slice for app-wide UI preferences and state
 * Reusable for various UI features across the application
 */
interface UIState {
  sidebarCollapsed: boolean;
  flowtrace: {
    leftPanelExpanded: boolean;
    leftPanelLocked: boolean;
    interactionMode: FlowtraceInteractionMode;
    designTool: FlowtraceDesignTool;
  };
  // Future UI state can be added here:
  // modalStates: { [key: string]: boolean };
  // panelStates: { [key: string]: boolean };
  // notifications: Notification[];
}

const initialState: UIState = {
  sidebarCollapsed: false,
  flowtrace: {
    leftPanelExpanded: false,
    leftPanelLocked: true,
    interactionMode: 'select',
    designTool: 'select',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setFlowtraceLeftPanelExpanded: (state, action: PayloadAction<boolean>) => {
      state.flowtrace.leftPanelExpanded = action.payload;
    },
    setFlowtraceLeftPanelLocked: (state, action: PayloadAction<boolean>) => {
      state.flowtrace.leftPanelLocked = action.payload;
    },
    toggleFlowtraceLeftPanel: (state) => {
      state.flowtrace.leftPanelExpanded = !state.flowtrace.leftPanelExpanded;
    },
    setFlowtraceInteractionMode: (state, action: PayloadAction<FlowtraceInteractionMode>) => {
      state.flowtrace.interactionMode = action.payload;
    },
    setFlowtraceDesignTool: (state, action: PayloadAction<FlowtraceDesignTool>) => {
      state.flowtrace.designTool = action.payload;
    },
  },
});

export const {
  setSidebarCollapsed,
  toggleSidebar,
  setFlowtraceLeftPanelExpanded,
  setFlowtraceLeftPanelLocked,
  toggleFlowtraceLeftPanel,
  setFlowtraceInteractionMode,
  setFlowtraceDesignTool,
} = uiSlice.actions;

// Selectors
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed;
export const selectFlowtraceLeftPanelExpanded = (state: RootState) => state.ui.flowtrace.leftPanelExpanded;
export const selectFlowtraceLeftPanelLocked = (state: RootState) => state.ui.flowtrace.leftPanelLocked;
export const selectFlowtraceInteractionMode = (state: RootState) => state.ui.flowtrace.interactionMode;
export const selectFlowtraceDesignTool = (state: RootState) => state.ui.flowtrace.designTool;

export default uiSlice.reducer;
