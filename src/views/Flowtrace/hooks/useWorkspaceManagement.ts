/**
 * Workspace management hook for FlowTrace
 * Handles workspace loading, saving, and autosave functionality
 */

import { useCallback, useEffect } from 'react';

import { useAutosave } from '@/context/AutosaveContext';
import { loadVersion, saveVersion, type Workspace } from '@/lib/workspace-utils';
import { useAppDispatch } from '@/store/hooks';
import { setSidebarCollapsed } from '@/store/slices/uiSlice';

import { FlowTraceState, FlowTraceStateActions } from './useFlowTraceState';

interface UseWorkspaceManagementParams {
  state: FlowTraceState;
  actions: FlowTraceStateActions;
  performTrace: (address: string) => Promise<void>;
}

export const useWorkspaceManagement = ({
  state,
  actions,
  performTrace,
}: UseWorkspaceManagementParams) => {
  const { autosaveInterval, isAutosaveEnabled } = useAutosave();
  const dispatch = useAppDispatch();

  /**
   * Clears workspace info when starting a new investigation
   */
  const clearWorkspaceInfo = useCallback(() => {
    actions.setWorkspaceName(null);
    actions.setVersionName(null);
    actions.setVersionTimestamp(null);
    actions.setWorkspaceId(null);
    actions.setCurrentVersionId('master');

    // Expand sidebar when clearing workspace
    dispatch(setSidebarCollapsed(false));
  }, [actions, dispatch]);

  /**
   * Handles loading a workspace/version chosen in the manager
   */
  const handleLoadWorkspaceFromManager = useCallback(async (ws: Workspace, versionId?: string) => {
    const version = await loadVersion(ws.id, versionId || 'master');
    if (version) {
      actions.setNodes(version.graphState.nodes as any);
      actions.setConnections(version.graphState.edges as any);

      // Restore drawings if they exist (stored as drawingElements in workspace)
      if (version.graphState.drawingElements) {
        actions.setDrawingHistory(version.graphState.drawingElements as any);
        actions.setHistoryIndex(version.graphState.drawingElements.length - 1);
      } else {
        actions.setDrawingHistory([]);
        actions.setHistoryIndex(-1);
      }

      actions.setWorkspaceId(ws.id);
      actions.setCurrentVersionId(version.id);
      actions.setWorkspaceName(ws.name);
      actions.setVersionName(version.name);
      actions.setVersionTimestamp(version.timestamp);
      actions.setHasUnsavedChanges(false);

      // Collapse sidebar when workspace is loaded
      dispatch(setSidebarCollapsed(true));
    }
  }, [actions, dispatch]);

  /**
   * Handles workspace creation
   */
  const handleWorkspaceCreated = useCallback(async (workspaceId: string) => {
    actions.setWorkspaceId(workspaceId);

    // If there's a pending start new graph action, execute it
    if (state.pendingStartNewGraphAfterSave && state.pendingNewGraphAddress) {
      try {
        // Save current work to the new workspace
        await saveVersion(workspaceId, {
          nodes: state.nodes,
          edges: state.connections,
          zoom: 1,
          pan: { x: 0, y: 0 },
          hidePassThrough: false,
          drawings: state.drawingHistory
        }, 'auto', 'Auto-saved before starting new graph');
        actions.setHasUnsavedChanges(false);

        // Clear workspace info and start new graph
        clearWorkspaceInfo();
        actions.setStartNewGraphConfirmationOpen(false);
        actions.setPendingStartNewGraphAfterSave(false);

        // Clear the current graph
        actions.setNodes([]);
        actions.setConnections([]);
        actions.setDrawingHistory([]);
        actions.setHistoryIndex(-1);
        actions.setCurrentAddress('');
        actions.setCenterNodeId('');
        actions.setLeftPanelData(null);

        // Start fresh with the new address
        actions.setAddress(state.pendingNewGraphAddress);
        actions.setPendingNewGraphAddress(null);

        // Trigger the trace for the new address
        await performTrace(state.pendingNewGraphAddress);
      } catch (error) {
        console.error('Error in handleWorkspaceCreated:', error);
        actions.setPendingStartNewGraphAfterSave(false);
      }
    }
  }, [state.pendingStartNewGraphAfterSave, state.pendingNewGraphAddress, state.nodes, state.connections, actions, clearWorkspaceInfo, performTrace]);

  /**
   * Handler for starting new investigation from existing workspace
   */
  const handleStartNewInvestigation = useCallback(async (workspaceId: string) => {
    if (!state.pendingNewGraphAddress) return;

    try {
      // Show loading state
      actions.setIsLoading(true);

      // Save current work to the selected workspace
      await saveVersion(workspaceId, {
        nodes: state.nodes,
        edges: state.connections,
        zoom: 1,
        pan: { x: 0, y: 0 },
        hidePassThrough: false,
        drawings: state.drawingHistory
      }, 'auto', 'Auto-saved before starting new graph');
      actions.setHasUnsavedChanges(false);

      // Close workspace manager first
      actions.setWorkspaceMgrOpen(false);

      // Brief delay to show save completion
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clear workspace info and start new graph
      clearWorkspaceInfo();
      actions.setStartNewGraphConfirmationOpen(false);
      actions.setPendingStartNewGraphAfterSave(false);

      // Clear the current graph
      actions.setNodes([]);
      actions.setConnections([]);
      actions.setDrawingHistory([]);
      actions.setHistoryIndex(-1);
      actions.setCurrentAddress('');
      actions.setCenterNodeId('');
      actions.setLeftPanelData(null);

      // Start fresh with the new address
      actions.setAddress(state.pendingNewGraphAddress);
      actions.setPendingNewGraphAddress(null);

      // Perform trace for the new address
      await performTrace(state.pendingNewGraphAddress);
    } catch (error) {
      console.error('Error in handleStartNewInvestigation:', error);
    } finally {
      actions.setIsLoading(false);
    }
  }, [state.pendingNewGraphAddress, state.nodes, state.connections, actions, clearWorkspaceInfo, performTrace]);

  /**
   * Quick save functionality
   */
  const handleQuickSave = useCallback(async () => {
    if (!state.workspaceId) {
      // If no workspace, open the workspace manager to create one
      actions.setWorkspaceMgrOpen(true);
      return;
    }

    try {
      await saveVersion(state.workspaceId, {
        nodes: state.nodes,
        edges: state.connections,
        zoom: 1,
        pan: { x: 0, y: 0 },
        hidePassThrough: false,
        drawings: state.drawingHistory
      }, 'quick', 'Quick save');
      actions.setHasUnsavedChanges(false);
      actions.setVersionTimestamp(new Date().toISOString());
    } catch (error) {
      console.error('Error in quick save:', error);
    }
  }, [state.workspaceId, state.nodes, state.connections, state.drawingHistory, actions]);

  // Reset unsaved changes when workspace is loaded
  useEffect(() => {
    if (state.workspaceId) {
      actions.setHasUnsavedChanges(false);
    }
  }, [state.workspaceId, actions]);

  // Autosave functionality
  useEffect(() => {
    if (!isAutosaveEnabled || !state.workspaceId || !state.hasUnsavedChanges) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        await saveVersion(state.workspaceId!, {
          nodes: state.nodes,
          edges: state.connections,
          zoom: 1,
          pan: { x: 0, y: 0 },
          hidePassThrough: false,
          drawings: state.drawingHistory
        }, 'auto', 'Auto-save', 'Automatic save');
        actions.setHasUnsavedChanges(false);
        actions.setVersionTimestamp(new Date().toISOString());
      } catch (error) {
        console.error('Error in autosave:', error);
      }
    }, autosaveInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [isAutosaveEnabled, state.workspaceId, state.hasUnsavedChanges, state.nodes, state.connections, state.drawingHistory, autosaveInterval, actions]);

  return {
    clearWorkspaceInfo,
    handleLoadWorkspaceFromManager,
    handleWorkspaceCreated,
    handleStartNewInvestigation,
    handleQuickSave,
  };
};