/**
 * FlowTrace state management hook
 * Consolidates all useState declarations from FlowTrace component
 */

import React, { useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectFlowtraceLeftPanelExpanded,
  selectFlowtraceLeftPanelLocked,
  setFlowtraceLeftPanelExpanded,
  setFlowtraceLeftPanelLocked,
} from '@/store/slices/uiSlice';

import { FTConnection, FTNode } from '../components/NetworkGraph';

export interface FlowTraceState {
  // Core graph state
  address: string;
  nodes: FTNode[];
  connections: FTConnection[];

  // Panel state
  leftPanelData: any | null;
  centerNodeId: string | null;
  currentAddress: string;
  isExpanded: boolean;
  isLeftPanelLocked: boolean;

  // Dialog states
  nodeTxPickerOpen: boolean;
  customDialogOpen: boolean;
  edgeDialogOpen: boolean;
  customExpandOpen: boolean;
  aggregatedNodeDialogOpen: boolean;
  walletPanelOpen: boolean;
  workspaceMgrOpen: boolean;
  searchConfirmationOpen: boolean;
  duplicateNodeDialogOpen: boolean;
  startNewGraphConfirmationOpen: boolean;
  saveAndNewDialogOpen: boolean;
  settingsDialogOpen: boolean;

  // Dialog data
  selectedEdge: FTConnection | null;
  expandSourceNode: FTNode | null;
  nodeTxPickerSourceNode: string | null;
  selectedAggregatedNode: FTNode | null;
  pendingAddress: string | null;
  duplicateAddress: string | null;
  pendingNewGraphAddress: string | null;

  // UTXO and aggregation
  utxoCollapseMode: "aggregated" | "individual";
  consolidatedEntities: string[];
  aggregationMap: React.MutableRefObject<Record<string, {
    nodes: FTNode[];
    connections: FTConnection[];
    allMemberConnections?: FTConnection[];
    addresses: string[];
  }>>;

  // Drawing state
  activeColor: string;
  drawingHistory: any[];
  historyIndex: number;
  hasSelection: boolean;
  selectedAnnotationIndex: number | null;
  annotationEditMode: boolean;

  // Loading states
  isLoading: boolean;
  isLeftPanelLoading: boolean;

  // Feature flags
  useD3Force: boolean;

  // Workspace state
  workspaceId: string | null;
  currentVersionId: string;
  workspaceName: string | null;
  versionName: string | null;
  versionTimestamp: string | null;
  hasUnsavedChanges: boolean;
  pendingStartNewGraphAfterSave: boolean;
}

export interface FlowTraceStateActions {
  setAddress: (address: string) => void;
  setNodes: React.Dispatch<React.SetStateAction<FTNode[]>>;
  setConnections: React.Dispatch<React.SetStateAction<FTConnection[]>>;
  setLeftPanelData: React.Dispatch<React.SetStateAction<any | null>>;
  setCenterNodeId: (id: string | null) => void;
  setCurrentAddress: (address: string) => void;
  setIsExpanded: (expanded: boolean) => void;
  setIsLeftPanelLocked: (locked: boolean) => void;
  setNodeTxPickerOpen: (open: boolean) => void;
  setCustomDialogOpen: (open: boolean) => void;
  setEdgeDialogOpen: (open: boolean) => void;
  setCustomExpandOpen: (open: boolean) => void;
  setAggregatedNodeDialogOpen: (open: boolean) => void;
  setWalletPanelOpen: (open: boolean) => void;
  setWorkspaceMgrOpen: (open: boolean) => void;
  setSearchConfirmationOpen: (open: boolean) => void;
  setDuplicateNodeDialogOpen: (open: boolean) => void;
  setStartNewGraphConfirmationOpen: (open: boolean) => void;
  setSaveAndNewDialogOpen: (open: boolean) => void;
  setSettingsDialogOpen: (open: boolean) => void;
  setSelectedEdge: (edge: FTConnection | null) => void;
  setExpandSourceNode: (node: FTNode | null) => void;
  setNodeTxPickerSourceNode: (nodeId: string | null) => void;
  setSelectedAggregatedNode: (node: FTNode | null) => void;
  setPendingAddress: (address: string | null) => void;
  setDuplicateAddress: (address: string | null) => void;
  setPendingNewGraphAddress: (address: string | null) => void;
  setUtxoCollapseMode: (mode: "aggregated" | "individual") => void;
  setConsolidatedEntities: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveColor: (color: string) => void;
  setDrawingHistory: React.Dispatch<React.SetStateAction<any[]>>;
  setHistoryIndex: (index: number) => void;
  setSelectedAnnotationIndex: (index: number | null) => void;
  setAnnotationEditMode: (mode: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsLeftPanelLoading: (loading: boolean) => void;
  setUseD3Force: (use: boolean) => void;
  setWorkspaceId: (id: string | null) => void;
  setCurrentVersionId: (id: string) => void;
  setWorkspaceName: (name: string | null) => void;
  setVersionName: (name: string | null) => void;
  setVersionTimestamp: (timestamp: string | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setPendingStartNewGraphAfterSave: (pending: boolean) => void;
}

export const useFlowTraceState = () => {
  const dispatch = useAppDispatch();

  // Get panel state from Redux
  const isExpanded = useAppSelector(selectFlowtraceLeftPanelExpanded);
  const isLeftPanelLocked = useAppSelector(selectFlowtraceLeftPanelLocked);

  // Core graph state
  const [address, setAddress] = useState('');
  const [nodes, setNodes] = useState<FTNode[]>([]);
  const [connections, setConnections] = useState<FTConnection[]>([]);

  // Panel state
  const [leftPanelData, setLeftPanelData] = useState<any>(null);
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');

  // Dialog states
  const [nodeTxPickerOpen, setNodeTxPickerOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [customExpandOpen, setCustomExpandOpen] = useState(false);
  const [aggregatedNodeDialogOpen, setAggregatedNodeDialogOpen] = useState(false);
  const [walletPanelOpen, setWalletPanelOpen] = useState(false);
  const [workspaceMgrOpen, setWorkspaceMgrOpen] = useState(false);
  const [searchConfirmationOpen, setSearchConfirmationOpen] = useState(false);
  const [duplicateNodeDialogOpen, setDuplicateNodeDialogOpen] = useState(false);
  const [startNewGraphConfirmationOpen, setStartNewGraphConfirmationOpen] = useState(false);
  const [saveAndNewDialogOpen, setSaveAndNewDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Dialog data
  const [selectedEdge, setSelectedEdge] = useState<FTConnection | null>(null);
  const [expandSourceNode, setExpandSourceNode] = useState<FTNode | null>(null);
  const [nodeTxPickerSourceNode, setNodeTxPickerSourceNode] = useState<string | null>(null);
  const [selectedAggregatedNode, setSelectedAggregatedNode] = useState<FTNode | null>(null);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const [duplicateAddress, setDuplicateAddress] = useState<string | null>(null);
  const [pendingNewGraphAddress, setPendingNewGraphAddress] = useState<string | null>(null);

  // UTXO and aggregation
  const [utxoCollapseMode, setUtxoCollapseMode] = useState<"aggregated" | "individual">(() => {
    const saved = localStorage.getItem('flowtrace-utxo-collapse-mode');
    return (saved === 'aggregated' || saved === 'individual') ? saved : 'individual';
  });
  const [consolidatedEntities, setConsolidatedEntities] = useState<string[]>([]);
  const aggregationMap = React.useRef<Record<string, {
    nodes: FTNode[];
    connections: FTConnection[];
    allMemberConnections?: FTConnection[];
    addresses: string[];
  }>>({});

  // Drawing state
  const [activeColor, setActiveColor] = useState(() => {
    return localStorage.getItem('flowtrace-default-drawing-color') || '#ff6b35';
  });
  const [drawingHistory, setDrawingHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasSelection] = useState(false);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);
  const [annotationEditMode, setAnnotationEditMode] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLeftPanelLoading, setIsLeftPanelLoading] = useState(false);

  // Feature flags
  const [useD3Force, setUseD3Force] = useState(() => {
    const saved = localStorage.getItem('flowtrace-use-d3-force');
    return saved ? saved === 'true' : true;
  });

  // Workspace state
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string>('master');
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [versionName, setVersionName] = useState<string | null>(null);
  const [versionTimestamp, setVersionTimestamp] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingStartNewGraphAfterSave, setPendingStartNewGraphAfterSave] = useState(false);

  const state: FlowTraceState = {
    address,
    nodes,
    connections,
    leftPanelData,
    centerNodeId,
    currentAddress,
    isExpanded,
    isLeftPanelLocked,
    nodeTxPickerOpen,
    customDialogOpen,
    edgeDialogOpen,
    customExpandOpen,
    aggregatedNodeDialogOpen,
    walletPanelOpen,
    workspaceMgrOpen,
    searchConfirmationOpen,
    duplicateNodeDialogOpen,
    startNewGraphConfirmationOpen,
    saveAndNewDialogOpen,
    settingsDialogOpen,
    selectedEdge,
    expandSourceNode,
    nodeTxPickerSourceNode,
    selectedAggregatedNode,
    pendingAddress,
    duplicateAddress,
    pendingNewGraphAddress,
    utxoCollapseMode,
    consolidatedEntities,
    aggregationMap,
    activeColor,
    drawingHistory,
    historyIndex,
    hasSelection,
    selectedAnnotationIndex,
    annotationEditMode,
    isLoading,
    isLeftPanelLoading,
    useD3Force,
    workspaceId,
    currentVersionId,
    workspaceName,
    versionName,
    versionTimestamp,
    hasUnsavedChanges,
    pendingStartNewGraphAfterSave,
  };

  const actions: FlowTraceStateActions = useMemo(() => ({
    setAddress,
    setNodes,
    setConnections,
    setLeftPanelData,
    setCenterNodeId,
    setCurrentAddress,
    setIsExpanded: (expanded: boolean) => dispatch(setFlowtraceLeftPanelExpanded(expanded)),
    setIsLeftPanelLocked: (locked: boolean) => dispatch(setFlowtraceLeftPanelLocked(locked)),
    setNodeTxPickerOpen,
    setCustomDialogOpen,
    setEdgeDialogOpen,
    setCustomExpandOpen,
    setAggregatedNodeDialogOpen,
    setWalletPanelOpen,
    setWorkspaceMgrOpen,
    setSearchConfirmationOpen,
    setDuplicateNodeDialogOpen,
    setStartNewGraphConfirmationOpen,
    setSaveAndNewDialogOpen,
    setSettingsDialogOpen,
    setSelectedEdge,
    setExpandSourceNode,
    setNodeTxPickerSourceNode,
    setSelectedAggregatedNode,
    setPendingAddress,
    setDuplicateAddress,
    setPendingNewGraphAddress,
    setUtxoCollapseMode,
    setConsolidatedEntities,
    setActiveColor,
    setDrawingHistory,
    setHistoryIndex,
    setSelectedAnnotationIndex,
    setAnnotationEditMode,
    setIsLoading,
    setIsLeftPanelLoading,
    setUseD3Force,
    setWorkspaceId,
    setCurrentVersionId,
    setWorkspaceName,
    setVersionName,
    setVersionTimestamp,
    setHasUnsavedChanges,
    setPendingStartNewGraphAfterSave,
  }), [
    dispatch,
    setAddress,
    setNodes,
    setConnections,
    setLeftPanelData,
    setCenterNodeId,
    setCurrentAddress,
    setNodeTxPickerOpen,
    setCustomDialogOpen,
    setEdgeDialogOpen,
    setCustomExpandOpen,
    setAggregatedNodeDialogOpen,
    setWalletPanelOpen,
    setWorkspaceMgrOpen,
    setSearchConfirmationOpen,
    setDuplicateNodeDialogOpen,
    setStartNewGraphConfirmationOpen,
    setSaveAndNewDialogOpen,
    setSettingsDialogOpen,
    setSelectedEdge,
    setExpandSourceNode,
    setNodeTxPickerSourceNode,
    setSelectedAggregatedNode,
    setPendingAddress,
    setDuplicateAddress,
    setPendingNewGraphAddress,
    setUtxoCollapseMode,
    setConsolidatedEntities,
    setActiveColor,
    setDrawingHistory,
    setHistoryIndex,
    setSelectedAnnotationIndex,
    setAnnotationEditMode,
    setIsLoading,
    setIsLeftPanelLoading,
    setUseD3Force,
    setWorkspaceId,
    setCurrentVersionId,
    setWorkspaceName,
    setVersionName,
    setVersionTimestamp,
    setHasUnsavedChanges,
    setPendingStartNewGraphAfterSave,
  ]);

  return { state, actions };
};