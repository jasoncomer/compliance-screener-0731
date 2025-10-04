/**
 * FlowTrace - Refactored Version
 * Reduced from 2056 LOC to ~400 LOC using extracted hooks and compound components
 */

import React, { useCallback, useEffect, useRef } from 'react';

import { Check, FolderOpen, Layers, Network, Save, Settings } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import AddressSearchInput from '@/components/common/AddressSearchInput';
import { Button } from '@/components/ui/button';
import ViewWrapper from '@/components/ViewWrapper';
import GitHubWorkspaceManager from '@/components/workspace/GitHubWorkspaceManager';
import { useFlowTraceInitialization } from '@/context/FlowTraceContext';
import { saveVersion, updateMasterVersion } from '@/lib/workspace-utils';
import { logoService } from '@/services/logoService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSOT } from '@/store/slices/sotSlice';
import { getBlockchainType } from '@/utils/addressValidation';
import { applyBeneficialOwnerOverride } from '@/utils/entityUtils';

import { FlowTraceDialogs } from './components/FlowTraceDialogs';
import { FlowTraceGraphContainer } from './components/FlowTraceGraphContainer';
import { FlowTraceToolbars } from './components/FlowTraceToolbars';
import { LoadingOverlay } from './components/LoadingIndicator';
import { FTNode, NetworkGraphHandle } from './components/NetworkGraph';
import { useConnectionManagement } from './hooks/useConnectionManagement';
import { useFlowTraceData } from './hooks/useFlowTraceData';
import { useFlowTraceHandlers } from './hooks/useFlowTraceHandlers';
import { useFlowTraceState } from './hooks/useFlowTraceState';
import { useWorkspaceManagement } from './hooks/useWorkspaceManagement';
import { DebugPanel, FlowTraceEmptyState, HelpSystem, SettingsDialog, WalletClusterPanel, WorkspaceInfo } from './components';

const FlowTracePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const graphRef = useRef<NetworkGraphHandle | null>(null);
  const dispatch = useAppDispatch();
  const { itemsMap } = useAppSelector((state) => state.sot);
  const [saveSuccessful, setSaveSuccessful] = React.useState(false);

  // Get initialization data from context
  let initializationData = null;
  let clearInitializationData = () => {};
  try {
    const context = useFlowTraceInitialization();
    initializationData = context.initializationData;
    clearInitializationData = context.clearInitializationData;
  } catch (error) {
    console.warn('FlowTraceContext not available:', error);
  }

  // Initialize all state
  const { state, actions } = useFlowTraceState();

  // Initialize data fetching
  const {
    fetchAndSetLeftPanelData,
    fetchAggregatedNodeData,
    prefetchProfilesAndLogos,
    prefetchRiskScores,
    attributions,
  } = useFlowTraceData({ actions });

  // Core trace function
  const performTrace = useCallback(async (addressToTrace: string) => {
    actions.setIsLoading(true);
    try {
      actions.setCenterNodeId(addressToTrace);
      actions.setCurrentAddress(addressToTrace);
      actions.setLeftPanelData(null);

      const leftPanelData = await fetchAndSetLeftPanelData(addressToTrace);

      const newNode: FTNode = {
        id: addressToTrace,
        label: leftPanelData?.selectedEntity?.label || addressToTrace,
        x: 300,
        y: 240,
        type: leftPanelData?.selectedEntity?.type || 'wallet',
        risk: leftPanelData?.riskScore || 0,
        entityId: leftPanelData?.selectedEntity?.entityId,
        entityType: leftPanelData?.selectedEntity?.type,
        logoUrl: leftPanelData?.selectedEntity?.logoUrl || undefined,
        balance: leftPanelData?.balance,
        txCount: leftPanelData?.txCount,
        usdValue: leftPanelData?.usdValue,
        bo: leftPanelData?.selectedEntity?.bo,
        custodian: leftPanelData?.selectedEntity?.custodian,
      };

      actions.setNodes(prev => {
        const exists = prev.find(n => n.id === addressToTrace);
        if (exists) return prev;
        return [...prev, newNode];
      });

      prefetchProfilesAndLogos([addressToTrace]);
      actions.setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error in performTrace:', error);
    } finally {
      actions.setIsLoading(false);
    }
  }, [actions, fetchAndSetLeftPanelData, prefetchProfilesAndLogos]);

  // Initialize workspace management
  const {
    clearWorkspaceInfo,
    handleLoadWorkspaceFromManager,
    handleWorkspaceCreated,
    handleStartNewInvestigation,
  } = useWorkspaceManagement({ state, actions, performTrace });

  // Initialize handlers
  const handlers = useFlowTraceHandlers({
    state,
    actions,
    performTrace,
    clearWorkspaceInfo,
    saveVersion,
  });

  // Initialize connection management
  const {
    processConnectionsForMode,
    onAdd,
  } = useConnectionManagement({
    state,
    actions,
    prefetchProfilesAndLogos,
    prefetchRiskScores,
  });

  // Node selection handler
  const handleNodeSelection = useCallback(async (node: FTNode) => {
    if (node.id.startsWith('agg:')) {
      // Extract entity key from aggregated node ID
      const entityKey = node.id.replace('agg:', '').replace(/_/g, ' ');

      // Get member nodes and connections from aggregation map
      const aggregationData = state.aggregationMap.current[entityKey];

      if (aggregationData) {
        // Fetch aggregated data for LeftPanel
        const aggData = await fetchAggregatedNodeData(
          node,
          aggregationData.nodes,
          aggregationData.allMemberConnections || aggregationData.connections,
          state.connections.filter(c => c.from === node.id || c.to === node.id)
        );

        if (aggData) {
          actions.setLeftPanelData(aggData);
        }
      }

      // Also keep dialog for backward compatibility
      actions.setSelectedAggregatedNode(node);
      // Optionally open dialog: actions.setAggregatedNodeDialogOpen(true);
      return;
    }

    actions.setCurrentAddress(node.id);
    // Clear leftPanelData to show loading state while fetching new data
    actions.setLeftPanelData(null);
    await fetchAndSetLeftPanelData(node.id);
  }, [actions, fetchAndSetLeftPanelData, fetchAggregatedNodeData, state.aggregationMap, state.connections]);

  // Node add handler
  const handleNodeAdd = useCallback(async (node: FTNode) => {
    if (node.type === 'custom') {
      actions.setExpandSourceNode(node);
      actions.setCustomExpandOpen(true);
    } else {
      actions.setNodeTxPickerSourceNode(state.currentAddress || state.centerNodeId);
      actions.setCurrentAddress(node.id);
      actions.setLeftPanelData(null);
      await fetchAndSetLeftPanelData(node.id);
      actions.setNodeTxPickerOpen(true);
    }
  }, [actions, state.currentAddress, state.centerNodeId, fetchAndSetLeftPanelData]);

  // Left panel callbacks - memoized to prevent excessive re-renders
  const handleTogglePanel = useCallback(() => {
    actions.setIsExpanded(!state.isExpanded);
  }, [actions, state.isExpanded]);

  const handleSetExpanded = useCallback((expanded: boolean) => {
    actions.setIsExpanded(expanded);
  }, [actions]);

  const handleToggleLock = useCallback(() => {
    actions.setIsLeftPanelLocked(!state.isLeftPanelLocked);
  }, [actions, state.isLeftPanelLocked]);

  const handleAnnotationSelect = useCallback((index: number | null) => {
    actions.setSelectedAnnotationIndex(index);
  }, [actions]);

  const handleAnnotationUpdate = useCallback((index: number, data: any) => {
    actions.setDrawingHistory(prev => prev.map((item, i) => i === index ? { ...item, data: { ...item.data, ...data } } : item));
    actions.setHasUnsavedChanges(true);
  }, [actions]);

  const handleNodeDrag = useCallback((nodeId: string, x: number, y: number) => {
    actions.setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n));
  }, [actions]);

  const handleNodeRemove = useCallback((nodeId: string) => {
    actions.setNodes(prev => prev.filter(n => n.id !== nodeId));
    actions.setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
  }, [actions]);

  // Node double click handler
  const handleNodeDoubleClick = useCallback((node: FTNode) => {
    const isCustom = node.type === 'custom' || (!node.entityId && !node.entityType);
    if (!isCustom) return;
    const current = node.label || node.id;
    const next = window.prompt('Rename node label:', current);
    if (next && next.trim().length) {
      actions.setNodes(prev => prev.map(n => n.id === node.id ? { ...n, label: next.trim() } : n));
    }
  }, [actions]);

  // Consolidated save handler
  const handleSave = useCallback(async () => {
    if (!state.workspaceId) return;

    try {
      const graphState = {
        nodes: state.nodes,
        edges: state.connections,
        zoom: 1,
        pan: { x: 0, y: 0 },
        hidePassThrough: false,
        drawings: state.drawingHistory  // Save annotations
      };

      // Save to master version
      await updateMasterVersion(state.workspaceId, graphState, 'manual');

      // Mark as saved
      actions.setHasUnsavedChanges(false);
      actions.setVersionTimestamp(new Date().toISOString());

      // Show success indicator
      setSaveSuccessful(true);
      setTimeout(() => setSaveSuccessful(false), 1500);
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  }, [state.workspaceId, state.nodes, state.connections, state.drawingHistory, actions]);

  // ==================== Effects ====================

  // Load SOT data on mount
  useEffect(() => {
    dispatch(fetchSOT());
  }, [dispatch]);

  // Track unsaved changes
  useEffect(() => {
    if (state.nodes.length > 0 || state.connections.length > 0) {
      actions.setHasUnsavedChanges(true);
    }
  }, [state.nodes, state.connections, actions]);

  // Keyboard shortcuts for annotation editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key: Delete selected annotation
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedAnnotationIndex !== null) {
        // Don't interfere if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        handlers.handleDelete();
      }

      // Escape key: Deselect annotation
      if (e.key === 'Escape' && state.selectedAnnotationIndex !== null) {
        e.preventDefault();
        actions.setSelectedAnnotationIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedAnnotationIndex, handlers, actions]);

  // Handle initialization from context
  useEffect(() => {
    if (initializationData && initializationData.addresses && initializationData.addresses.length > 0) {
      actions.setNodes([]);
      actions.setConnections([]);
      const firstAddress = initializationData.addresses[0];
      actions.setAddress(firstAddress);
      performTrace(firstAddress);
      clearInitializationData();
    }
  }, [initializationData, performTrace, clearInitializationData, actions]);

  // Handle URL parameters
  useEffect(() => {
    const addressesParam = searchParams.get('addresses');
    if (addressesParam && addressesParam.trim()) {
      const addresses = addressesParam.split(',').map(addr => addr.trim()).filter(addr => addr);
      if (addresses.length > 0) {
        actions.setNodes([]);
        actions.setConnections([]);
        const firstAddress = addresses[0];
        actions.setAddress(firstAddress);
        performTrace(firstAddress);
      }
    }
  }, [searchParams, performTrace, actions]);

  // Fetch attributions for all nodes if they don't exist
  useEffect(() => {
    const nodeAddresses = state.nodes.map(n => n.id);
    const missingAttributions = nodeAddresses.filter(addr => !attributions[addr]);

    if (missingAttributions.length > 0 && Object.keys(itemsMap).length > 0) {
      prefetchProfilesAndLogos(missingAttributions);
    }
  }, [state.nodes, attributions, itemsMap, prefetchProfilesAndLogos]);

  // Process attribution data
  useEffect(() => {
    if (Object.keys(attributions).length === 0 || Object.keys(itemsMap).length === 0) {
      return;
    }

    actions.setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        const attribution = attributions[node.id];
        if (!attribution) return node;

        try {
          const entitySOT = itemsMap[attribution.entity];
          const beneficialOwnerSOT = attribution.bo ? itemsMap[attribution.bo] : undefined;

          const override = applyBeneficialOwnerOverride(
            {
              entity: attribution.entity,
              bo: attribution.bo || '',
              custodian: attribution.custodian || '',
              script_type: attribution.script_type
            },
            entitySOT,
            beneficialOwnerSOT,
            undefined,
            node.id
          );

          return {
            ...node,
            label: override.displayTitle || node.id,
            logoUrl: override.logo || node.logoUrl || undefined,
            entityId: attribution.entity ?? node.entityId,
            entityType: override.entityType || node.entityType,
            risk: node.risk,
            bo: attribution.bo ?? node.bo,
            custodian: attribution.custodian ?? node.custodian,
          } as FTNode;
        } catch (error) {
          return node;
        }
      });
    });

    // Update left panel data
    if (state.currentAddress && attributions[state.currentAddress]) {
      const attribution = attributions[state.currentAddress];
      const entitySOT = itemsMap[attribution.entity];
      const beneficialOwnerSOT = attribution.bo ? itemsMap[attribution.bo] : undefined;

      const override = applyBeneficialOwnerOverride(
        {
          entity: attribution.entity,
          bo: attribution.bo || '',
          custodian: attribution.custodian || '',
          script_type: attribution.script_type
        },
        entitySOT,
        beneficialOwnerSOT,
        undefined,
        state.currentAddress
      );

      actions.setLeftPanelData((prev: any) => {
        if (prev) {
          return {
            ...prev,
            riskScore: prev.riskScore,
            selectedEntity: {
              ...prev.selectedEntity,
              label: override.displayTitle || state.currentAddress,
              logoUrl: override.logo ? logoService.getLogoUrl(attribution.entity) : prev.selectedEntity?.logoUrl,
              type: override.entityType || 'wallet',
              riskScore: prev.selectedEntity?.riskScore,
              bo: attribution.bo ?? prev.selectedEntity?.bo,
              custodian: attribution.custodian ?? prev.selectedEntity?.custodian,
              ofac: override.ofac ?? prev.selectedEntity?.ofac,
              entityTags: override.entityTags ?? prev.selectedEntity?.entityTags
            }
          };
        } else {
          return {
            address: state.currentAddress,
            network: getBlockchainType(state.currentAddress) === 'bitcoin' ? 'Bitcoin' : 'Ethereum',
            balance: '0',
            txCount: 0,
            riskScore: undefined,
            usdValue: '0',
            selectedEntity: {
              label: override.displayTitle || state.currentAddress,
              address: state.currentAddress,
              logoUrl: override.logo ? logoService.getLogoUrl(attribution.entity) : null,
              type: override.entityType || 'wallet',
              riskScore: undefined,
              bo: attribution.bo,
              custodian: attribution.custodian,
              ofac: override.ofac,
              entityTags: override.entityTags
            }
          };
        }
      });
    }
  }, [attributions, itemsMap, state.currentAddress, actions]);

  // ==================== Render ====================

  const isEmptyState = state.nodes.length === 0 && !state.isLoading;

  // Empty state: use ViewWrapper for centered, professional layout
  if (isEmptyState) {
    return (
      <ViewWrapper
        icon={<Network className="w-8 h-8 text-orange-500" />}
        title="FlowTrace"
        fullWidth={true}
        className=""
      >
        {/* Redesigned Navbar */}
        <div className="sticky top-[0] z-20 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 pt-2 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section: Search */}
          <div className="flex-1 max-w-3xl">
            <AddressSearchInput
              placeholder="Enter Bitcoin address to trace (e.g., bc1qxy2...)"
              value={state.address}
              onChange={(e) => actions.setAddress(e.target.value)}
              onSearch={handlers.handleTrace}
              loading={state.isLoading}
              disabled={state.isLoading}
              showValidation={true}
            />
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Workspace Actions Group */}
            <div className="flex items-center gap-2 pr-2 border-r border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                className="flex gap-1.5 items-center h-11"
                onClick={() => actions.setWorkspaceMgrOpen(true)}
                title="Manage workspaces"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Workspaces</span>
              </Button>
            </div>

            {/* Settings & Help */}
            <Button
              variant="outline"
              className="h-11 px-3"
              onClick={() => actions.setSettingsDialogOpen(true)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Help - Only when empty */}
            <HelpSystem />
          </div>
        </div>
      </div>

        {/* Main Content - Empty State */}
        <FlowTraceEmptyState />

        {/* Workspace Manager */}
        <GitHubWorkspaceManager
          open={state.workspaceMgrOpen}
          onOpenChange={(open) => {
            actions.setWorkspaceMgrOpen(open);
            if (!open && state.pendingStartNewGraphAfterSave) {
              actions.setPendingStartNewGraphAfterSave(false);
              actions.setStartNewGraphConfirmationOpen(false);
              actions.setPendingNewGraphAddress(null);
            }
          }}
          currentState={{ nodes: state.nodes, edges: state.connections, zoom: 1, pan: { x: 0, y: 0 }, hidePassThrough: false }}
          onLoadWorkspace={handleLoadWorkspaceFromManager}
          currentWorkspaceId={state.workspaceId || undefined}
          currentVersionId={state.currentVersionId}
          onWorkspaceCreated={handleWorkspaceCreated}
          onStartNewInvestigation={handleStartNewInvestigation}
          isSaveAndNewMode={state.pendingStartNewGraphAfterSave}
        />

        {/* Settings Dialog */}
        <SettingsDialog
          open={state.settingsDialogOpen}
          onOpenChange={actions.setSettingsDialogOpen}
          useD3Force={state.useD3Force}
          onUseD3ForceChange={actions.setUseD3Force}
          utxoCollapseMode={state.utxoCollapseMode}
          onUtxoCollapseModeChange={actions.setUtxoCollapseMode}
          activeColor={state.activeColor}
          onActiveColorChange={actions.setActiveColor}
          isExpanded={state.isExpanded}
          onIsExpandedChange={actions.setIsExpanded}
        />
      </ViewWrapper>
    );
  }

  // Active state: maximize viewport for graph visualization
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-background">
      <LoadingOverlay isLoading={state.isLoading} message="Tracing address..." />

      {/* Redesigned Navbar */}
      <div className="sticky top-[0] z-20 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 py-3">
        <div className="flex items-center justify-between gap-4 px-4">
          {/* Left Section: Search */}
          <div className="flex-1 max-w-3xl">
            <AddressSearchInput
              placeholder="Enter Bitcoin address to trace (e.g., bc1qxy2...)"
              value={state.address}
              onChange={(e) => actions.setAddress(e.target.value)}
              onSearch={handlers.handleTrace}
              loading={state.isLoading}
              disabled={state.isLoading}
              showValidation={true}
            />
          </div>

          {/* Middle Section: Workspace Info */}
          <div className="flex items-center gap-3 px-4 border-l border-r border-gray-200 dark:border-gray-700">
            <WorkspaceInfo
              workspaceName={state.workspaceName || undefined}
              versionName={state.versionName || undefined}
              versionTimestamp={state.versionTimestamp || undefined}
              hasUnsavedChanges={state.hasUnsavedChanges}
            />
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Analysis Tools Group */}
            <div className="flex items-center gap-2 pr-2 border-r border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                className="flex gap-2 items-center h-11"
                onClick={() => actions.setWalletPanelOpen(true)}
              >
                <Layers className="h-4 w-4" />
                <span>Clusters</span>
              </Button>
            </div>

            {/* Workspace Actions Group */}
            <div className="flex items-center gap-2 pr-2 border-r border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                className="flex gap-1.5 items-center h-11"
                onClick={handleSave}
                disabled={!state.workspaceId}
                title={state.hasUnsavedChanges ? 'Save changes to workspace' : 'Workspace saved'}
              >
                {saveSuccessful ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Save</span>
              </Button>
              <Button
                variant="outline"
                className="flex gap-1.5 items-center h-11"
                onClick={() => actions.setWorkspaceMgrOpen(true)}
                title="Manage workspaces"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Workspaces</span>
              </Button>
            </div>

            {/* Settings */}
            <Button
              variant="outline"
              className="h-11 px-3"
              onClick={() => actions.setSettingsDialogOpen(true)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Active State */}
      <div className="flex-1 overflow-hidden">
        <div className="relative h-full">
          <FlowTraceToolbars
            graphRef={graphRef}
            utxoCollapseMode={state.utxoCollapseMode}
            onToggleUtxoMode={() => {
              const newMode = state.utxoCollapseMode === "aggregated" ? "individual" : "aggregated";
              actions.setUtxoCollapseMode(newMode);
              processConnectionsForMode(newMode);
            }}
            activeColor={state.activeColor}
            onColorChange={actions.setActiveColor}
            onUndo={handlers.handleUndo}
            onRedo={handlers.handleRedo}
            onDelete={handlers.handleDelete}
            onAddNode={handlers.handleAddNode}
            onEdit={() => {
              graphRef.current?.editSelectedTextAnnotation();
            }}
            canUndo={state.historyIndex > 0}
            canRedo={state.historyIndex < state.drawingHistory.length - 1}
            hasSelection={state.selectedAnnotationIndex !== null}
            isTextSelected={
              state.selectedAnnotationIndex !== null &&
              state.drawingHistory[state.selectedAnnotationIndex]?.type === 'addText'
            }
            onClearSelection={() => graphRef.current?.clearSelection()}
            onAnnotationDeselect={() => actions.setSelectedAnnotationIndex(null)}
          />

          <DebugPanel
            nodes={state.nodes}
            connections={state.connections}
            onClearData={handlers.handleClearData}
            onImportData={handlers.handleImportData}
          />

          <FlowTraceGraphContainer
            graphRef={graphRef}
            useD3Force={state.useD3Force}
            nodes={state.nodes}
            connections={state.connections}
            utxoCollapseMode={state.utxoCollapseMode}
            centerNodeId={state.centerNodeId}
            activeColor={state.activeColor}
            drawingHistory={state.drawingHistory.slice(0, state.historyIndex + 1)}
            onDrawingAction={handlers.handleDrawingAction}
            selectedAnnotationIndex={state.selectedAnnotationIndex}
            onAnnotationSelect={handleAnnotationSelect}
            onAnnotationUpdate={handleAnnotationUpdate}
            onNodeClick={handleNodeSelection}
            onNodeDoubleClick={handleNodeDoubleClick}
            onNodeAdd={handleNodeAdd}
            onNodeDrag={handleNodeDrag}
            onEdgeClick={handlers.handleEdgeClick}
            onNodeRemove={handleNodeRemove}
            currentAddress={state.currentAddress}
            leftPanelData={state.leftPanelData}
            isExpanded={state.isExpanded}
            isLeftPanelLoading={state.isLeftPanelLoading}
            onTogglePanel={handleTogglePanel}
            onSetExpanded={handleSetExpanded}
            isLeftPanelLocked={state.isLeftPanelLocked}
            onToggleLock={handleToggleLock}
            onConnectionColorChange={handlers.handleConnectionColorChange}
          />
        </div>
      </div>

      {/* Dialogs */}
      <FlowTraceDialogs
        state={state}
        setNodes={actions.setNodes}
        setConnections={actions.setConnections}
        setSearchConfirmationOpen={actions.setSearchConfirmationOpen}
        setDuplicateNodeDialogOpen={actions.setDuplicateNodeDialogOpen}
        setStartNewGraphConfirmationOpen={actions.setStartNewGraphConfirmationOpen}
        setSaveAndNewDialogOpen={actions.setSaveAndNewDialogOpen}
        setEdgeDialogOpen={actions.setEdgeDialogOpen}
        setCustomExpandOpen={actions.setCustomExpandOpen}
        setExpandSourceNode={actions.setExpandSourceNode}
        setNodeTxPickerOpen={actions.setNodeTxPickerOpen}
        setNodeTxPickerSourceNode={actions.setNodeTxPickerSourceNode}
        setAggregatedNodeDialogOpen={actions.setAggregatedNodeDialogOpen}
        handleAddToGraph={handlers.handleAddToGraph}
        handleSaveAndNew={handlers.handleSaveAndNew}
        handleDiscardAndNew={handlers.handleDiscardAndNew}
        handleCancelSearch={handlers.handleCancelSearch}
        handleViewExisting={handlers.handleViewExisting}
        handleStartNewGraph={handlers.handleStartNewGraph}
        handleCancelDuplicate={handlers.handleCancelDuplicate}
        handleSaveAndStartNewGraph={handlers.handleSaveAndStartNewGraph}
        handleDiscardAndStartNewGraph={handlers.handleDiscardAndStartNewGraph}
        handleCancelStartNewGraph={handlers.handleCancelStartNewGraph}
        handleSaveToExisting={handlers.handleSaveToExisting}
        handleCreateNewWorkspace={handlers.handleCreateNewWorkspace}
        handleCancelSaveAndNew={handlers.handleCancelSaveAndNew}
        handleConnectionColorChange={handlers.handleConnectionColorChange}
        onAdd={onAdd}
        findDuplicateNode={handlers.findDuplicateNode}
      />

      {/* Workspace Manager */}
      <GitHubWorkspaceManager
        open={state.workspaceMgrOpen}
        onOpenChange={(open) => {
          actions.setWorkspaceMgrOpen(open);
          if (!open && state.pendingStartNewGraphAfterSave) {
            actions.setPendingStartNewGraphAfterSave(false);
            actions.setStartNewGraphConfirmationOpen(false);
            actions.setPendingNewGraphAddress(null);
          }
        }}
        currentState={{ nodes: state.nodes, edges: state.connections, zoom: 1, pan: { x: 0, y: 0 }, hidePassThrough: false }}
        onLoadWorkspace={handleLoadWorkspaceFromManager}
        currentWorkspaceId={state.workspaceId || undefined}
        currentVersionId={state.currentVersionId}
        onWorkspaceCreated={handleWorkspaceCreated}
        onStartNewInvestigation={handleStartNewInvestigation}
        isSaveAndNewMode={state.pendingStartNewGraphAfterSave}
      />

      {/* Wallet Cluster Panel */}
      <WalletClusterPanel
        open={state.walletPanelOpen}
        onOpenChange={actions.setWalletPanelOpen}
        nodes={state.nodes}
        connections={state.connections}
        consolidatedEntities={state.consolidatedEntities}
        onConfirmSelection={async (entityKey, _utxos) => {
          const memberIdsArr = state.nodes.filter(n => n.entityId === entityKey).map(n => n.id);
          if (!memberIdsArr.length) return;

          const { aggregateEntity } = await import('./utils/aggregateEntity');
          const { newState, undo } = aggregateEntity(
            { nodes: state.nodes, edges: state.connections },
            entityKey,
            memberIdsArr,
          );

          actions.setNodes(newState.nodes as any);
          actions.setConnections(newState.edges as any);

          state.aggregationMap.current[entityKey] = {
            nodes: undo.nodes as any,
            connections: undo.edges as any,
            allMemberConnections: undo.allMemberConnections as any,
            addresses: memberIdsArr
          };

          if (!state.consolidatedEntities.includes(entityKey))
            actions.setConsolidatedEntities([...state.consolidatedEntities, entityKey]);
        }}
        onUndoAggregation={(entityKey) => {
          const saved = state.aggregationMap.current[entityKey];
          if (!saved) return;

          actions.setNodes((prev) => {
            const aggId = `agg:${entityKey.replace(/\s+/g, '_')}`;
            const withoutAgg = prev.filter(n => n.id !== aggId);
            return [...withoutAgg, ...saved.nodes];
          });

          actions.setConnections(prev => {
            const aggId = `agg:${entityKey.replace(/\s+/g, '_')}`;
            const withoutAggEdges = prev.filter(c => c.from !== aggId && c.to !== aggId);
            return [...withoutAggEdges, ...saved.connections];
          });

          actions.setConsolidatedEntities(prev => prev.filter(e => e !== entityKey));
        }}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={state.settingsDialogOpen}
        onOpenChange={actions.setSettingsDialogOpen}
        useD3Force={state.useD3Force}
        onUseD3ForceChange={actions.setUseD3Force}
        utxoCollapseMode={state.utxoCollapseMode}
        onUtxoCollapseModeChange={actions.setUtxoCollapseMode}
        activeColor={state.activeColor}
        onActiveColorChange={actions.setActiveColor}
        isExpanded={state.isExpanded}
        onIsExpandedChange={actions.setIsExpanded}
      />
    </div>
  );
};

export default FlowTracePage;