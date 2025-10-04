/**
 * FlowTrace event handlers hook
 * Extracts all event handler functions from FlowTrace component
 */

import { useCallback } from 'react';

import { FTConnection } from '../components/NetworkGraph';

import { FlowTraceState, FlowTraceStateActions } from './useFlowTraceState';

interface UseFlowTraceHandlersParams {
  state: FlowTraceState;
  actions: FlowTraceStateActions;
  performTrace: (address: string) => Promise<void>;
  clearWorkspaceInfo: () => void;
  saveVersion: (workspaceId: string, graphState: any, saveType: 'auto' | 'quick' | 'manual', name?: string, description?: string) => Promise<any>;
}

export const useFlowTraceHandlers = ({
  state,
  actions,
  performTrace,
  clearWorkspaceInfo,
  saveVersion,
}: UseFlowTraceHandlersParams) => {

  // ==================== Graph State Helpers ====================

  const findDuplicateNode = useCallback((address: string) => {
    return state.nodes.find(node => node.id === address);
  }, [state.nodes]);

  // ==================== Search Confirmation Dialog Handlers ====================

  const handleAddToGraph = useCallback(async () => {
    if (!state.pendingAddress) return;
    actions.setSearchConfirmationOpen(false);
    await performTrace(state.pendingAddress);
    actions.setPendingAddress(null);
  }, [state.pendingAddress, actions, performTrace]);

  const handleSaveAndNew = useCallback(() => {
    if (!state.pendingAddress) return;

    // Show the save and new dialog instead of directly saving
    actions.setSearchConfirmationOpen(false);
    actions.setSaveAndNewDialogOpen(true);
  }, [state.pendingAddress, actions]);

  const handleDiscardAndNew = useCallback(async () => {
    if (!state.pendingAddress) return;

    // Clear everything and start new investigation
    clearWorkspaceInfo();
    actions.setNodes([]);
    actions.setConnections([]);
    actions.setDrawingHistory([]);
    actions.setHistoryIndex(-1);
    actions.setSearchConfirmationOpen(false);
    await performTrace(state.pendingAddress);
    actions.setPendingAddress(null);
  }, [state.pendingAddress, actions, clearWorkspaceInfo, performTrace]);

  const handleCancelSearch = useCallback(() => {
    actions.setSearchConfirmationOpen(false);
    actions.setPendingAddress(null);
  }, [actions]);

  // ==================== Save and New Dialog Handlers ====================

  const handleSaveToExisting = useCallback(async (workspaceId: string) => {
    if (!state.pendingAddress) return;

    try {
      await saveVersion(workspaceId, {
        nodes: state.nodes,
        edges: state.connections,
        zoom: 1,
        pan: { x: 0, y: 0 },
        hidePassThrough: false,
        drawings: state.drawingHistory
      }, 'auto', 'Auto-save before new investigation');
      actions.setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving to existing workspace:', error);
    }

    // Clear workspace info and start new investigation
    clearWorkspaceInfo();
    actions.setSaveAndNewDialogOpen(false);
    await performTrace(state.pendingAddress);
    actions.setPendingAddress(null);
  }, [state.pendingAddress, state.nodes, state.connections, state.drawingHistory, actions, clearWorkspaceInfo, performTrace, saveVersion]);

  const handleCreateNewWorkspace = useCallback(async (name: string, description: string) => {
    if (!state.pendingAddress) return;

    try {
      const { createWorkspace } = await import('@/lib/workspace-utils');
      const newWorkspace = await createWorkspace({
        nodes: state.nodes,
        edges: state.connections,
        zoom: 1,
        pan: { x: 0, y: 0 },
        hidePassThrough: false
      }, name, description);

      actions.setWorkspaceId(newWorkspace.id);
      actions.setCurrentVersionId(newWorkspace.masterVersionId || 'master');
      actions.setWorkspaceName(newWorkspace.name);
      actions.setVersionName('Master');
      actions.setVersionTimestamp(newWorkspace.versions[0]?.timestamp || new Date().toISOString());
      actions.setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error creating new workspace:', error);
    }

    actions.setSaveAndNewDialogOpen(false);
    await performTrace(state.pendingAddress);
    actions.setPendingAddress(null);
  }, [state.pendingAddress, state.nodes, state.connections, actions, performTrace]);

  const handleCancelSaveAndNew = useCallback(() => {
    actions.setSaveAndNewDialogOpen(false);
    actions.setPendingAddress(null);
  }, [actions]);

  // ==================== Duplicate Node Dialog Handlers ====================

  const handleViewExisting = useCallback(() => {
    if (!state.duplicateAddress) return;
    actions.setDuplicateNodeDialogOpen(false);
    actions.setCenterNodeId(state.duplicateAddress);
    actions.setCurrentAddress(state.duplicateAddress);
    actions.setDuplicateAddress(null);
  }, [state.duplicateAddress, actions]);

  const handleCancelDuplicate = useCallback(() => {
    actions.setDuplicateNodeDialogOpen(false);
    actions.setDuplicateAddress(null);
  }, [actions]);

  const handleStartNewGraph = useCallback(() => {
    if (!state.duplicateAddress) return;
    actions.setDuplicateNodeDialogOpen(false);
    actions.setPendingNewGraphAddress(state.duplicateAddress);
    actions.setStartNewGraphConfirmationOpen(true);
  }, [state.duplicateAddress, actions]);

  // ==================== Start New Graph Confirmation Handlers ====================

  const handleSaveAndStartNewGraph = useCallback(async () => {
    if (!state.pendingNewGraphAddress) return;

    // Auto-save current work if there's a workspace
    if (state.workspaceId) {
      try {
        await saveVersion(state.workspaceId, {
          nodes: state.nodes,
          edges: state.connections,
          zoom: 1,
          pan: { x: 0, y: 0 },
          hidePassThrough: false,
          drawings: state.drawingHistory
        }, 'auto', 'Auto-saved before starting new graph');
        actions.setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error saving before starting new graph:', error);
      }
    } else {
      // If no workspace, open the workspace manager to create one
      actions.setPendingStartNewGraphAfterSave(true);
      actions.setWorkspaceMgrOpen(true);
      return;
    }

    // Clear workspace info and start new graph
    clearWorkspaceInfo();
    actions.setStartNewGraphConfirmationOpen(false);

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
  }, [state.pendingNewGraphAddress, state.workspaceId, state.nodes, state.connections, state.drawingHistory, actions, saveVersion, clearWorkspaceInfo, performTrace]);

  const handleDiscardAndStartNewGraph = useCallback(async () => {
    if (!state.pendingNewGraphAddress) return;

    // Clear workspace info and start new graph
    clearWorkspaceInfo();
    actions.setStartNewGraphConfirmationOpen(false);

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
  }, [state.pendingNewGraphAddress, actions, clearWorkspaceInfo, performTrace]);

  const handleCancelStartNewGraph = useCallback(() => {
    actions.setStartNewGraphConfirmationOpen(false);
    actions.setPendingNewGraphAddress(null);
  }, [actions]);

  // ==================== Search Handler ====================

  const handleTrace = useCallback(async () => {
    if (!state.address) return;

    // Check for duplicate node first
    const duplicateNode = findDuplicateNode(state.address);
    if (duplicateNode) {
      actions.setDuplicateAddress(state.address);
      actions.setDuplicateNodeDialogOpen(true);
      return;
    }

    // If no existing nodes, start investigation directly
    if (state.nodes.length === 0) {
      await performTrace(state.address);
      return;
    }

    // Show confirmation dialog before adding to existing graph
    actions.setPendingAddress(state.address);
    actions.setSearchConfirmationOpen(true);
  }, [state.address, state.nodes.length, actions, findDuplicateNode, performTrace]);

  // ==================== Drawing Handlers ====================

  const handleDrawingAction = useCallback((action: { type: string; data: any }) => {
    const newHistory = [...state.drawingHistory.slice(0, state.historyIndex + 1), action];
    actions.setDrawingHistory(newHistory);
    actions.setHistoryIndex(newHistory.length - 1);
  }, [state.drawingHistory, state.historyIndex, actions]);

  const handleUndo = useCallback(() => {
    if (state.historyIndex > 0) {
      actions.setHistoryIndex(state.historyIndex - 1);
    }
  }, [state.historyIndex, actions]);

  const handleRedo = useCallback(() => {
    if (state.historyIndex < state.drawingHistory.length - 1) {
      actions.setHistoryIndex(state.historyIndex + 1);
    }
  }, [state.historyIndex, state.drawingHistory.length, actions]);

  const handleDelete = useCallback(() => {
    // Delete selected annotation if one is selected
    if (state.selectedAnnotationIndex !== null && state.selectedAnnotationIndex >= 0) {
      const newHistory = state.drawingHistory.filter((_, index) => index !== state.selectedAnnotationIndex);
      actions.setDrawingHistory(newHistory);
      actions.setSelectedAnnotationIndex(null); // Clear selection
      actions.setHasUnsavedChanges(true);
      // Adjust history index if needed
      if (state.historyIndex >= newHistory.length) {
        actions.setHistoryIndex(Math.max(0, newHistory.length - 1));
      }
    } else if (state.historyIndex >= 0) {
      // Fallback: Remove the last drawing action if no annotation is selected
      const newHistory = state.drawingHistory.filter((_, index) => index !== state.historyIndex);
      actions.setDrawingHistory(newHistory);
      actions.setHistoryIndex(Math.max(0, state.historyIndex - 1));
    }
  }, [state.selectedAnnotationIndex, state.historyIndex, state.drawingHistory, actions]);

  // ==================== Node and Edge Handlers ====================

  const handleAddNode = useCallback(() => {
    actions.setCustomDialogOpen(true);
  }, [actions]);

  const handleConnectionColorChange = useCallback((txHash: string, color: string) => {
    actions.setConnections(prev => prev.map(conn =>
      conn.txHash === txHash ? { ...conn, customColor: color } : conn
    ));
  }, [actions]);

  const handleEdgeClick = useCallback((connection: FTConnection) => {
    const fromNode = state.nodes.find(n => n.id === connection.from);
    const toNode = state.nodes.find(n => n.id === connection.to);

    // Create edge panel data for LeftPanel
    const edgePanelData = {
      selectionType: 'edge' as const,
      connection,
      fromNode,
      toNode,
      fromEntity: fromNode ? {
        label: fromNode.label,
        address: fromNode.id,
        entityId: fromNode.entityId,
        logoUrl: fromNode.logoUrl,
        type: fromNode.entityType || fromNode.type,
        riskScore: fromNode.risk,
        bo: fromNode.bo,
        custodian: fromNode.custodian
      } : undefined,
      toEntity: toNode ? {
        label: toNode.label,
        address: toNode.id,
        entityId: toNode.entityId,
        logoUrl: toNode.logoUrl,
        type: toNode.entityType || toNode.type,
        riskScore: toNode.risk,
        bo: toNode.bo,
        custodian: toNode.custodian
      } : undefined,
      network: 'Bitcoin' // Can be made dynamic based on connection data
    };

    // Update LeftPanel with edge data
    actions.setLeftPanelData(edgePanelData);

    // Also keep existing dialog functionality for backward compatibility
    const note = fromNode?.notes?.[0]?.content || toNode?.notes?.[0]?.content;
    actions.setSelectedEdge({ ...connection, note });
    // Optionally open dialog: actions.setEdgeDialogOpen(true);
  }, [state.nodes, actions]);

  const handleClearData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      actions.setNodes([]);
      actions.setConnections([]);
      actions.setDrawingHistory([]);
      actions.setHistoryIndex(-1);
      actions.setCurrentAddress('');
      actions.setCenterNodeId('');
      actions.setLeftPanelData(null);
    }
  }, [actions]);

  const handleImportData = useCallback((data: any) => {
    try {
      if (data.nodes) actions.setNodes(data.nodes);
      if (data.connections) actions.setConnections(data.connections);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  }, [actions]);

  return {
    // Search confirmation
    handleAddToGraph,
    handleSaveAndNew,
    handleDiscardAndNew,
    handleCancelSearch,

    // Save and new
    handleSaveToExisting,
    handleCreateNewWorkspace,
    handleCancelSaveAndNew,

    // Duplicate node
    handleViewExisting,
    handleCancelDuplicate,
    handleStartNewGraph,

    // Start new graph
    handleSaveAndStartNewGraph,
    handleDiscardAndStartNewGraph,
    handleCancelStartNewGraph,

    // Search
    handleTrace,

    // Drawing
    handleDrawingAction,
    handleUndo,
    handleRedo,
    handleDelete,

    // Node and edge
    handleAddNode,
    handleConnectionColorChange,
    handleEdgeClick,
    handleClearData,
    handleImportData,

    // Helpers
    findDuplicateNode,
  };
};