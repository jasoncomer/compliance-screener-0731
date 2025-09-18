import React, { useEffect, useState, useCallback } from 'react';
import { flowtraceService } from '../../services/flowtraceService';
import { generateUTXOKey, connectionInvolvesAddress, generateConnectionKey, findConnectionsForAddress, ensureConnectionKeys } from './utils/utxoKeyGeneration';
import { Network } from 'lucide-react';
import { useAttribution } from '../../context/AttributionContext';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchSOT } from '../../store/slices/sotSlice';
import { applyBeneficialOwnerOverride } from '../../utils/entityUtils';

import { getBlockchainType } from '../../utils/addressValidation';
import { NetworkGraph, FTConnection, FTNode, NetworkGraphHandle } from './components/NetworkGraph';
import { Toolbar } from './components/Toolbar';
import { DrawingToolbar, DrawingTool } from './components/DrawingToolbar';

import { LoadingOverlay } from './components/LoadingIndicator';
import { DebugPanel } from './components/DebugPanel';
import { HelpSystem } from './components/HelpSystem';
import LeftPanel from './components/LeftPanel';
import NodeTxPicker from './components/NodeTxPicker';
import EdgeDialog from './components/EdgeDialog';
import FlowTraceEmptyState from './components/FlowTraceEmptyState';
import AddressSearchInput from '../../components/common/AddressSearchInput';
import ViewWrapper from '../../components/ViewWrapper';
import SaveWorkspaceButton from '@/components/workspace/SaveWorkspaceButton'
import GitHubWorkspaceManager from '@/components/workspace/GitHubWorkspaceManager'
import { loadVersion, saveVersion, type Workspace } from '@/lib/workspace-utils'
import { GitBranch, Save, Network, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CustomNodeDialog from './components/CustomNodeDialog'
import CustomNodeExpandDialog from './components/CustomNodeExpandDialog'
import { WalletClusterPanel } from './components/WalletClusterPanel'
import { AggregatedNodeDialog } from './components/AggregatedNodeDialog'
import { WorkspaceInfo } from './components/WorkspaceInfo'
import SearchConfirmationDialog from './components/SearchConfirmationDialog'
import DuplicateNodeDialog from './components/DuplicateNodeDialog'
import StartNewGraphConfirmationDialog from './components/StartNewGraphConfirmationDialog'
import SaveAndNewDialog from './components/SaveAndNewDialog'
import { useAutosave } from '../../context/AutosaveContext'

// helper to merge duplicate edges using the same key format as generateConnectionKey
const mergeEdges = (existing: FTConnection[], incoming: FTConnection[]) => {
  const map = new Map<string, FTConnection>()

  // Use the same key format as generateConnectionKey: from:to:utxo:amount
  const edgeKey = (e: FTConnection) => generateConnectionKey(e)

  const addEdge = (edge: FTConnection) => {
    const k = edgeKey(edge)
    if (map.has(k)) {
      const existingEdge = map.get(k)!
      
      // If existing edge is locked, never replace it
      if (existingEdge.locked) {
        console.log('🔒 Locked connection preserved:', {
          key: k,
          existing: existingEdge,
          incoming: edge,
          reason: 'existing connection is locked'
        });
        return;
      }
      
      // If incoming edge is locked, replace the existing one
      if (edge.locked) {
        console.log('🔒 Locked connection replacing existing:', {
          key: k,
          existing: existingEdge,
          incoming: edge,
          reason: 'incoming connection is locked'
        });
        map.set(k, { ...edge });
        return;
      }
      
      // Neither is locked, keep existing (should not happen with proper keys)
      console.log('⚠️ Duplicate connection detected:', {
        key: k,
        existing: existingEdge,
        incoming: edge,
        keeping: 'existing'
      });
      return;
    } else {
      console.log('✅ Adding new unique connection:', {
        key: k,
        txHash: edge.txHash,
        utxoKey: edge.utxoKey,
        amount: edge.amount,
        currency: edge.currency,
        locked: edge.locked
      });
      map.set(k, { ...edge })
    }
  }

  // Add existing connections first (they may be locked)
  existing.forEach(addEdge)
  // Then add incoming connections (they may override unlocked existing ones)
  incoming.forEach(addEdge)

  return Array.from(map.values())
}

const FlowTracePage: React.FC = () => {
  const { autosaveInterval, isAutosaveEnabled } = useAutosave();
  const [address, setAddress] = useState('');
  const [nodes, setNodes] = useState<FTNode[]>([]);
  const [connections, setConnections] = useState<FTConnection[]>([]);
  const [leftPanelData, setLeftPanelData] = useState<any>(null);
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [nodeTxPickerOpen, setNodeTxPickerOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [utxoCollapseMode, setUtxoCollapseMode] = useState<"aggregated" | "individual">("individual");
  const [walletPanelOpen, setWalletPanelOpen] = useState(false)
  const [consolidatedEntities, setConsolidatedEntities] = useState<string[]>([])
  // Store originals so we can undo aggregation
  const aggregationMap = React.useRef<Record<string, { nodes: FTNode[]; connections: FTConnection[]; allMemberConnections?: FTConnection[]; addresses: string[] }>>({})
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  // Attribution and SOT data hooks (same as Risk Dashboard)
  const { fetchAttributions, attributions } = useAttribution();
  const { itemsMap } = useAppSelector((state) => state.sot);
  const dispatch = useAppDispatch();
  
  // Drawing toolbar state
  const [drawingToolbarVisible, setDrawingToolbarVisible] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>('select');
  const [activeColor, setActiveColor] = useState('#ff6b35');
  const [drawingHistory, setDrawingHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLeftPanelLoading, setIsLeftPanelLoading] = useState(false);
  
  // Edge dialog state
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<FTConnection | null>(null);
  const [customExpandOpen, setCustomExpandOpen] = useState(false);
  const [expandSourceNode, setExpandSourceNode] = useState<FTNode | null>(null);
  const [nodeTxPickerSourceNode, setNodeTxPickerSourceNode] = useState<string | null>(null);
  const graphRef = React.useRef<NetworkGraphHandle | null>(null);
  
  // Aggregated node dialog state
  const [aggregatedNodeDialogOpen, setAggregatedNodeDialogOpen] = useState(false);
  const [selectedAggregatedNode, setSelectedAggregatedNode] = useState<FTNode | null>(null);

  const [workspaceMgrOpen, setWorkspaceMgrOpen] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string>('master');
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [versionName, setVersionName] = useState<string | null>(null);
  const [versionTimestamp, setVersionTimestamp] = useState<string | null>(null);

  // Search confirmation dialog state
  const [searchConfirmationOpen, setSearchConfirmationOpen] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const [duplicateNodeDialogOpen, setDuplicateNodeDialogOpen] = useState(false);
  const [duplicateAddress, setDuplicateAddress] = useState<string | null>(null);
  const [startNewGraphConfirmationOpen, setStartNewGraphConfirmationOpen] = useState(false);
  const [pendingNewGraphAddress, setPendingNewGraphAddress] = useState<string | null>(null);
  const [pendingStartNewGraphAfterSave, setPendingStartNewGraphAfterSave] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveAndNewDialogOpen, setSaveAndNewDialogOpen] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    if (nodes.length > 0 || connections.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, connections]);

  // Reset unsaved changes when workspace is loaded
  useEffect(() => {
    if (workspaceId) {
      setHasUnsavedChanges(false);
    }
  }, [workspaceId]);

  // Autosave functionality
  useEffect(() => {
    if (!isAutosaveEnabled || !workspaceId || !hasUnsavedChanges) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        await saveVersion(workspaceId, {
          nodes,
          edges: connections,
          zoom: 1,
          pan: { x: 0, y: 0 },
          hidePassThrough: false
        }, 'auto', 'Auto-save', 'Automatic save');
        setHasUnsavedChanges(false);
        setVersionTimestamp(new Date().toISOString());
      } catch (error) {
        console.error('Failed to autosave:', error);
      }
    }, autosaveInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [isAutosaveEnabled, workspaceId, hasUnsavedChanges, nodes, connections, autosaveInterval]);

  // Handles loading a workspace/version chosen in the manager
  const handleLoadWorkspaceFromManager = useCallback(async (ws: Workspace, versionId?: string) => {
    const version = await loadVersion(ws.id, versionId || 'master');
    if (version) {
      setNodes(version.graphState.nodes as any);
      setConnections(version.graphState.edges as any);
      setWorkspaceId(ws.id);
      setCurrentVersionId(version.id);
      setWorkspaceName(ws.name);
      setVersionName(version.name);
      setVersionTimestamp(version.timestamp);
    }
  }, [setNodes, setConnections]);

  // Clear workspace info when starting a new investigation
  const clearWorkspaceInfo = useCallback(() => {
    setWorkspaceName(null);
    setVersionName(null);
    setVersionTimestamp(null);
    setWorkspaceId(null);
    setCurrentVersionId('master');
  }, []);

  // Handle workspace creation
  const handleWorkspaceCreated = useCallback(async (workspaceId: string) => {
    setWorkspaceId(workspaceId);
    // Note: We'll need to fetch the workspace details to get the name
    // This will be handled when the workspace is loaded
    
    // If there's a pending start new graph action, execute it
    if (pendingStartNewGraphAfterSave && pendingNewGraphAddress) {
      try {
        // Save current work to the new workspace
        await saveVersion(workspaceId, {
          nodes,
          edges: connections,
          zoom: 1,
          pan: { x: 0, y: 0 },
          hidePassThrough: false
        }, 'auto', 'Auto-saved before starting new graph');
        setHasUnsavedChanges(false);
        
        // Clear workspace info and start new graph
        clearWorkspaceInfo();
        setStartNewGraphConfirmationOpen(false);
        setPendingStartNewGraphAfterSave(false);
        
        // Clear the current graph
        setNodes([]);
        setConnections([]);
        setDrawingHistory([]);
        setHistoryIndex(-1);
        setCurrentAddress('');
        setCenterNodeId('');
        setLeftPanelData(null);
        
        // Start fresh with the new address
        setAddress(pendingNewGraphAddress);
        setPendingNewGraphAddress(null);
        
        // Trigger the trace for the new address
        await performTrace(pendingNewGraphAddress);
      } catch (error) {
        console.error('Failed to save and start new graph after workspace creation:', error);
        setPendingStartNewGraphAfterSave(false);
      }
    }
  }, [pendingStartNewGraphAfterSave, pendingNewGraphAddress, nodes, connections, saveVersion, clearWorkspaceInfo]);

  // Helper functions for graph state detection

  const findDuplicateNode = useCallback((address: string) => {
    return nodes.find(node => node.id === address);
  }, [nodes]);

  // const hasCustomElements = useCallback(() => {
  //   return nodes.some(node => node.type === 'custom') || 
  //          connections.some(conn => conn.customColor) ||
  //          drawingHistory.length > 0;
  // }, [nodes, connections, drawingHistory.length]);

  // Action handlers for search confirmation dialog
  const handleAddToGraph = useCallback(async () => {
    if (!pendingAddress) return;
    setSearchConfirmationOpen(false);
    await performTrace(pendingAddress);
    setPendingAddress(null);
  }, [pendingAddress]);

  const handleSaveAndNew = useCallback(() => {
    if (!pendingAddress) return;
    
    // Show the save and new dialog instead of directly saving
    setSearchConfirmationOpen(false);
    setSaveAndNewDialogOpen(true);
  }, [pendingAddress]);

  const handleDiscardAndNew = useCallback(async () => {
    if (!pendingAddress) return;
    
    // Clear everything and start new investigation
    clearWorkspaceInfo();
    setNodes([]);
    setConnections([]);
    setDrawingHistory([]);
    setHistoryIndex(-1);
    setSearchConfirmationOpen(false);
    await performTrace(pendingAddress);
    setPendingAddress(null);
  }, [pendingAddress, clearWorkspaceInfo]);

  const handleCancelSearch = useCallback(() => {
    setSearchConfirmationOpen(false);
    setPendingAddress(null);
  }, []);

  // Action handlers for save and new dialog
  const handleSaveToExisting = useCallback(async (workspaceId: string) => {
    if (!pendingAddress) return;
    
    try {
      await saveVersion(workspaceId, {
        nodes,
        edges: connections,
        zoom: 1,
        pan: { x: 0, y: 0 },
        hidePassThrough: false
      }, 'auto', 'Auto-save before new investigation');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save to existing workspace:', error);
    }
    
    // Clear workspace info and start new investigation
    clearWorkspaceInfo();
    setSaveAndNewDialogOpen(false);
    await performTrace(pendingAddress);
    setPendingAddress(null);
  }, [pendingAddress, nodes, connections, clearWorkspaceInfo]);

  const handleCreateNewWorkspace = useCallback(async (name: string, description: string) => {
    if (!pendingAddress) return;
    
    try {
      const { createWorkspace } = await import('@/lib/workspace-utils');
      const newWorkspace = await createWorkspace({
        nodes,
        edges: connections,
        zoom: 1,
        pan: { x: 0, y: 0 },
        hidePassThrough: false
      }, name, description);
      
      setWorkspaceId(newWorkspace.id);
      setCurrentVersionId(newWorkspace.masterVersionId || 'master');
      setWorkspaceName(newWorkspace.name);
      setVersionName('Master');
      setVersionTimestamp(newWorkspace.versions[0]?.timestamp || new Date().toISOString());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to create new workspace:', error);
    }
    
    setSaveAndNewDialogOpen(false);
    await performTrace(pendingAddress);
    setPendingAddress(null);
  }, [pendingAddress, nodes, connections]);

  const handleCancelSaveAndNew = useCallback(() => {
    setSaveAndNewDialogOpen(false);
    setPendingAddress(null);
  }, []);

  // Action handlers for duplicate node dialog
  const handleViewExisting = useCallback(() => {
    if (!duplicateAddress) return;
    setDuplicateNodeDialogOpen(false);
    setCenterNodeId(duplicateAddress);
    setCurrentAddress(duplicateAddress);
    setDuplicateAddress(null);
  }, [duplicateAddress]);

  const handleCancelDuplicate = useCallback(() => {
    setDuplicateNodeDialogOpen(false);
    setDuplicateAddress(null);
  }, []);

  const handleStartNewGraph = useCallback(() => {
    if (!duplicateAddress) return;
    setDuplicateNodeDialogOpen(false);
    setPendingNewGraphAddress(duplicateAddress);
    setStartNewGraphConfirmationOpen(true);
  }, [duplicateAddress]);

  // Handlers for start new graph confirmation dialog
  const handleSaveAndStartNewGraph = useCallback(async () => {
    if (!pendingNewGraphAddress) return;
    
    // Auto-save current work if there's a workspace
    if (workspaceId) {
      try {
        await saveVersion(workspaceId, {
          nodes,
          edges: connections,
          zoom: 1,
          pan: { x: 0, y: 0 },
          hidePassThrough: false
        }, 'auto', 'Auto-saved before starting new graph');
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Failed to save before starting new graph:', error);
      }
    } else {
      // If no workspace, open the workspace manager to create one
      setPendingStartNewGraphAfterSave(true);
      setWorkspaceMgrOpen(true);
      return;
    }
    
    // Clear workspace info and start new graph
    clearWorkspaceInfo();
    setStartNewGraphConfirmationOpen(false);
    
    // Clear the current graph
    setNodes([]);
    setConnections([]);
    setDrawingHistory([]);
    setHistoryIndex(-1);
    setCurrentAddress('');
    setCenterNodeId('');
    setLeftPanelData(null);
    
    // Start fresh with the new address
    setAddress(pendingNewGraphAddress);
    setPendingNewGraphAddress(null);
    
    // Trigger the trace for the new address
    await performTrace(pendingNewGraphAddress);
  }, [pendingNewGraphAddress, workspaceId, nodes, connections, saveVersion, clearWorkspaceInfo]);

  const handleDiscardAndStartNewGraph = useCallback(async () => {
    if (!pendingNewGraphAddress) return;
    
    // Clear workspace info and start new graph
    clearWorkspaceInfo();
    setStartNewGraphConfirmationOpen(false);
    
    // Clear the current graph
    setNodes([]);
    setConnections([]);
    setDrawingHistory([]);
    setHistoryIndex(-1);
    setCurrentAddress('');
    setCenterNodeId('');
    setLeftPanelData(null);
    
    // Start fresh with the new address
    setAddress(pendingNewGraphAddress);
    setPendingNewGraphAddress(null);
    
    // Trigger the trace for the new address
    await performTrace(pendingNewGraphAddress);
  }, [pendingNewGraphAddress, clearWorkspaceInfo]);

  const handleCancelStartNewGraph = useCallback(() => {
    setStartNewGraphConfirmationOpen(false);
    setPendingNewGraphAddress(null);
  }, []);

  // Handler for starting new investigation from existing workspace
  const handleStartNewInvestigation = useCallback(async (workspaceId: string) => {
    if (!pendingNewGraphAddress) return;
    
    try {
      // Show loading state
      setIsLoading(true);
      
      // Save current work to the selected workspace
      await saveVersion(workspaceId, {
        nodes,
        edges: connections,
        zoom: 1,
        pan: { x: 0, y: 0 },
        hidePassThrough: false
      }, 'auto', 'Auto-saved before starting new graph');
      setHasUnsavedChanges(false);
      
      // Close workspace manager first
      setWorkspaceMgrOpen(false);
      
      // Brief delay to show save completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear workspace info and start new graph
      clearWorkspaceInfo();
      setStartNewGraphConfirmationOpen(false);
      setPendingStartNewGraphAfterSave(false);
      
      // Clear the current graph
      setNodes([]);
      setConnections([]);
      setDrawingHistory([]);
      setHistoryIndex(-1);
      setCurrentAddress('');
      setCenterNodeId('');
      setLeftPanelData(null);
      
      // Start fresh with the new address
      setAddress(pendingNewGraphAddress);
      setPendingNewGraphAddress(null);
      
      // Perform trace for the new address
      await performTrace(pendingNewGraphAddress);
    } catch (error) {
      console.error('Failed to save to existing workspace and start new graph:', error);
      setIsLoading(false);
    }
  }, [pendingNewGraphAddress, nodes, connections, saveVersion, clearWorkspaceInfo]);

  // Quick save functionality
  const handleQuickSave = useCallback(async () => {
    if (!workspaceId) {
      // If no workspace, open the workspace manager to create one
      setWorkspaceMgrOpen(true);
      return;
    }

    try {
      await saveVersion(workspaceId, {
        nodes,
        edges: connections,
        zoom: 1,
        pan: { x: 0, y: 0 },
        hidePassThrough: false
      }, 'quick', 'Quick save');
      setHasUnsavedChanges(false);
      setVersionTimestamp(new Date().toISOString());
    } catch (error) {
      console.error('Failed to quick save:', error);
    }
  }, [workspaceId, nodes, connections]);

  // Prefetch attribution profile and logos for a list of addresses (non-blocking)
  const prefetchProfilesAndLogos = async (addresses: string[]) => {
    console.log('prefetchProfilesAndLogos called with addresses:', addresses);
    const unique = Array.from(new Set(addresses.filter(Boolean)));
    if (!unique.length) return;
    
    // Don't await this - let it run in the background
    Promise.allSettled(
      unique.map(async (addr) => {
        try {
          // Add timeout to prevent hanging
          const profilePromise = flowtraceService.fetchEntityProfile(addr);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
          );
          
          const profile = await Promise.race([profilePromise, timeoutPromise]).catch(() => ({} as any));
          
          // The logo URL should come directly from the SOT data in the profile
          const logoUrl = (profile as any)?.logoUrl || null;
          
          setNodes((prev) => prev.map((n) => (n.id === addr ? {
            ...n,
            label: ((profile as any)?.properName || (profile as any)?.label) ?? n.label,
            risk: (profile as any)?.riskScore ?? n.risk,
            logoUrl: logoUrl ?? n.logoUrl,
            entityId: (profile as any)?.entityId ?? n.entityId,
            entityType: (profile as any)?.entityType ?? n.entityType,
            bo: (profile as any)?.bo ?? n.bo,
            custodian: (profile as any)?.custodian ?? n.custodian,
          } : n)));
          
          // Debug logging for risk score updates
          console.log('🔍 Risk score update:', {
            address: addr,
            profileRiskScore: (profile as any)?.riskScore,
            profileType: typeof (profile as any)?.riskScore,
            profileData: profile
          });
          
          // If this is the currently selected address, also update the left panel data
          if (addr === currentAddress || addr === centerNodeId) {
            setLeftPanelData((prev: any) => prev ? {
              ...prev,
              selectedEntity: {
                ...prev.selectedEntity,
                label: (profile as any)?.properName || (profile as any)?.label || prev.selectedEntity?.label,
                logoUrl: logoUrl ?? prev.selectedEntity?.logoUrl,
                type: (profile as any)?.entityType || prev.selectedEntity?.type,
                riskScore: (profile as any)?.riskScore ?? prev.selectedEntity?.riskScore,
                bo: (profile as any)?.bo ?? prev.selectedEntity?.bo,
                custodian: (profile as any)?.custodian ?? prev.selectedEntity?.custodian,
              }
            } : null);
          }
        } catch (error) {
          console.warn('Error in prefetchProfilesAndLogos for', addr, ':', error);
        }
      })
    );
  };

  // Function to fetch and set left panel data for an address
  const fetchAndSetLeftPanelData = async (address: string) => {
    setIsLeftPanelLoading(true);
    try {

      // Use the new optimized endpoint that replaces 15-20 API calls with 1
      const optimizedResponse = await flowtraceService.expandNodeOptimized(address, {
        includeRiskScores: true,
        includeTransactions: true
      });


      // Extract data from optimized response
      const { transactions, enhancedData, riskScores, summary } = optimizedResponse.data;
      
      // Convert to legacy format for compatibility
      const data = {
        address: optimizedResponse.data.address,
        balance: '0', // Placeholder - could be calculated from transactions
        txs: summary.totalTransactions,
        network: 'bitcoin'
      };

      const summary_data = {
        balance: '0',
        usdValue: 0
      };

      const txs = {
        txs: transactions,
        pagination: { totalTxs: summary.totalTransactions }
      };

      // Use client-side resolved entity data if available, fallback to API data
      const attribution = attributions[address];
      let profile;
      
      if (attribution && Object.keys(itemsMap).length > 0) {
        // Use client-side resolution (same as node visualization)
        const entitySOT = Object.values(itemsMap).find(sot => sot.entity_id === attribution.entity);
        const beneficialOwnerSOT = attribution.bo ? 
          Object.values(itemsMap).find(sot => sot.entity_id === attribution.bo) : undefined;
        
        const override = applyBeneficialOwnerOverride(
          {
            entity: attribution.entity,
            bo: attribution.bo || '',
            custodian: attribution.custodian || '',
            script_type: attribution.script_type
          },
          entitySOT,
          beneficialOwnerSOT,
          Object.values(itemsMap)
        );
        
        profile = {
          entityId: attribution.entity,
          entityType: override.entityType || 'wallet',
          properName: override.displayTitle || attribution.entity,
          riskScore: riskScores[address]?.overallRisk ? Math.round(riskScores[address].overallRisk * 100) : undefined,
          logoUrl: override.logo ? `https://storage.googleapis.com/entity-logos/${attribution.entity}.jpg` : null,
          bo: attribution.bo,
          custodian: attribution.custodian
        };
        
        console.log('🔍 Using client-side resolved profile for left panel:', profile);
      } else {
        // Fallback to API data
        profile = {
          entityId: enhancedData.find((item: any) => item.attribution?.entity)?.attribution?.entity,
          entityType: enhancedData.find((item: any) => item.entityProfile?.entity_type)?.entityProfile?.entity_type,
          properName: enhancedData.find((item: any) => item.entityProfile?.proper_name)?.entityProfile?.proper_name,
          riskScore: riskScores[address]?.overallRisk ? Math.round(riskScores[address].overallRisk * 100) : undefined,
          logoUrl: enhancedData.find((item: any) => item.entityProfile?.logo)?.entityProfile?.logo,
          bo: enhancedData.find((item: any) => item.attribution?.bo)?.attribution?.bo,
          custodian: enhancedData.find((item: any) => item.attribution?.custodian)?.attribution?.custodian
        };
        
        console.log('🔍 Using API fallback profile for left panel:', profile);
      }
      
      console.log('API Debug:', {
        address,
        data,
        summary: summary_data,
        txs,
        profile
      });
      
      // Debug risk score specifically
      console.log('🔍 Risk Score Debug:', {
        address,
        profileRiskScore: profile.riskScore,
        profileType: typeof profile.riskScore,
        profileData: profile
      });

      // Use actual transaction count from the optimized response
      const actualTxCount = summary.totalTransactions || 0;

      // Update left panel data
      const leftPanelData = {
        address,
        network: getBlockchainType(address) === 'bitcoin' ? 'Bitcoin' : 'Ethereum',
        balance: summary_data.balance,
        txCount: actualTxCount,
        riskScore: profile.riskScore,
        usdValue: summary_data.usdValue,
        selectedEntity: {
          label: profile.properName || profile.entityId || address,
          address,
          logoUrl: profile.logoUrl,
          type: profile.entityType || 'wallet',
          riskScore: profile.riskScore,
          bo: profile.bo,
          custodian: profile.custodian
        }
      };
      
      setLeftPanelData(leftPanelData);

      // Also update the node with risk score data for visualization
      setNodes((prev) => prev.map((n) => (n.id === address ? {
        ...n,
        risk: profile.riskScore,
        balance: summary_data.balance,
        txCount: actualTxCount,
        usdValue: summary_data.usdValue
      } : n)));
    } catch (error) {
      console.error('Error fetching left panel data:', error);
    } finally {
      setIsLeftPanelLoading(false);
    }
  };

  // Core trace function that performs the actual address search and node addition
  const performTrace = useCallback(async (addressToTrace: string) => {
    setIsLoading(true);
    try {
      // Set both center node and current address to ensure left panel shows correct data
      setCenterNodeId(addressToTrace);
      setCurrentAddress(addressToTrace);
      
      // Clear any existing left panel data to prevent showing stale information
      setLeftPanelData(null);
      
      // Fetch background data and hydrate once available (includes risk score)
      await fetchAndSetLeftPanelData(addressToTrace);

      // Add node to graph
      const newNode: FTNode = {
        id: addressToTrace,
        label: addressToTrace, // Will be updated by prefetchProfilesAndLogos
        x: 300,
        y: 240,
        type: 'wallet', // Will be updated by prefetchProfilesAndLogos
        risk: 0, // Initialize with 0, will be updated by prefetchProfilesAndLogos
      };

      setNodes(prev => {
        const exists = prev.find(n => n.id === addressToTrace);
        if (exists) return prev;
        return [...prev, newNode];
      });

      // Fetch entity profile and logo for the new node
      prefetchProfilesAndLogos([addressToTrace]);
      
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAndSetLeftPanelData, prefetchProfilesAndLogos]);

  // Function to handle node selection and update left panel
  const handleNodeSelection = useCallback(async (node: FTNode) => {
    // Check if this is an aggregated node (starts with 'agg:')
    if (node.id.startsWith('agg:')) {
      setSelectedAggregatedNode(node);
      setAggregatedNodeDialogOpen(true);
      return;
    }
    
    // Immediately update the current address
    setCurrentAddress(node.id);
    
    // Clear old left panel data to prevent showing stale information
    setLeftPanelData(null);
    
    // Fetch new data for the selected node
    await fetchAndSetLeftPanelData(node.id);
  }, []);

  // Drawing action handlers
  const handleDrawingAction = (action: { type: string; data: any }) => {
    const newHistory = [...drawingHistory.slice(0, historyIndex + 1), action];
    setDrawingHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Edge click handler
  const handleEdgeClick = (connection: FTConnection) => {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);
    const note = fromNode?.notes?.[0]?.content || toNode?.notes?.[0]?.content;
    setSelectedEdge({ ...connection, note });
    setEdgeDialogOpen(true);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < drawingHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleDelete = () => {
    // Remove the last drawing action
    if (historyIndex >= 0) {
      const newHistory = drawingHistory.filter((_, index) => index !== historyIndex);
      setDrawingHistory(newHistory);
      setHistoryIndex(Math.max(0, historyIndex - 1));
    }
  };

  const handleAddNode = () => {
    // Add a custom node at a default position
    setCustomDialogOpen(true);
  };

  const handleConnectionColorChange = (txHash: string, color: string) => {
    setConnections(prev => prev.map(conn => 
      conn.txHash === txHash ? { ...conn, customColor: color } : conn
    ));
  };



  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      setNodes([]);
      setConnections([]);
      setDrawingHistory([]);
      setHistoryIndex(-1);
      setCurrentAddress('');
      setCenterNodeId('');
      setLeftPanelData(null);
    }
  };


  const handleImportData = (data: any) => {
    try {
      if (data.nodes) setNodes(data.nodes);
      if (data.connections) setConnections(data.connections);
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  };

  const handleTrace = async () => {
    if (!address) return;
    
    // Check for duplicate node first
    const duplicateNode = findDuplicateNode(address);
    if (duplicateNode) {
      setDuplicateAddress(address);
      setDuplicateNodeDialogOpen(true);
      return;
    }
    
    // Always show confirmation dialog before adding new nodes
    setPendingAddress(address);
    setSearchConfirmationOpen(true);
  };

  // Prefetch attribution profile and logos for a list of addresses (non-blocking)
  const prefetchProfilesAndLogos = async (addresses: string[]) => {
    const unique = Array.from(new Set(addresses.filter(Boolean)));
    if (!unique.length) return;
    
    // Fetch attribution data for all addresses at once (same as Risk Dashboard)
    try {
      await fetchAttributions(unique);
      console.log('🔍 FlowTrace: Attribution data fetch initiated for:', unique);
    } catch (error) {
      console.warn('Error fetching attributions:', error);
    }
  };

  // Process attribution data when it becomes available (same pattern as Risk Dashboard)
  useEffect(() => {
    if (Object.keys(attributions).length === 0 || Object.keys(itemsMap).length === 0) {
      return; // Wait for both attributions and SOT data to be loaded
    }

    console.log('🔍 FlowTrace: Processing attributions for nodes:', {
      attributionKeys: Object.keys(attributions),
      itemsMapKeys: Object.keys(itemsMap).length
    });

    // Process each node that needs entity resolution
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        const attribution = attributions[node.id];
        if (!attribution) {
          return node; // No attribution data, keep node as is
        }

        try {
          // Use client-side entity resolution (same as Risk Dashboard)
          const entitySOT = Object.values(itemsMap).find(sot => sot.entity_id === attribution.entity);
          const beneficialOwnerSOT = attribution.bo ? 
            Object.values(itemsMap).find(sot => sot.entity_id === attribution.bo) : undefined;
          
          console.log('🔍 FlowTrace entity resolution for', node.id, ':', {
            attribution,
            entitySOT,
            beneficialOwnerSOT,
            itemsMapKeys: Object.keys(itemsMap).length
          });
          
          const override = applyBeneficialOwnerOverride(
            {
              entity: attribution.entity,
              bo: attribution.bo || '',
              custodian: attribution.custodian || '',
              script_type: attribution.script_type
            },
            entitySOT,
            beneficialOwnerSOT,
            Object.values(itemsMap)
          );
          
          console.log('🔍 FlowTrace override result for', node.id, ':', override);
          
          // Update node with client-side resolved profile data
          const resolvedLabel = override.displayTitle || node.id;
          const resolvedEntityId = attribution.entity;
          const resolvedEntityType = override.entityType || 'wallet';
          const logoUrl = override.logo ? `https://storage.googleapis.com/entity-logos/${attribution.entity}.jpg` : null;
          
          console.log('🔍 FlowTrace resolved data for', node.id, ':', {
            resolvedLabel,
            resolvedEntityId,
            resolvedEntityType,
            logoUrl
          });
          
          return {
            ...node,
            label: resolvedLabel,
            logoUrl: logoUrl ?? node.logoUrl,
            entityId: resolvedEntityId ?? node.entityId,
            entityType: resolvedEntityType,
            bo: attribution.bo ?? node.bo,
            custodian: attribution.custodian ?? node.custodian,
          };
        } catch (error) {
          console.warn('Error processing attribution for', node.id, ':', error);
          return node;
        }
      });
    });

    // Update left panel data if the current address has attribution
    if (currentAddress && attributions[currentAddress]) {
      const attribution = attributions[currentAddress];
      const entitySOT = Object.values(itemsMap).find(sot => sot.entity_id === attribution.entity);
      const beneficialOwnerSOT = attribution.bo ? 
        Object.values(itemsMap).find(sot => sot.entity_id === attribution.bo) : undefined;
      
      const override = applyBeneficialOwnerOverride(
        {
          entity: attribution.entity,
          bo: attribution.bo || '',
          custodian: attribution.custodian || '',
          script_type: attribution.script_type
        },
        entitySOT,
        beneficialOwnerSOT,
        Object.values(itemsMap)
      );
      
      setLeftPanelData((prev: any) => prev ? {
        ...prev,
        selectedEntity: {
          ...prev.selectedEntity,
          label: override.displayTitle || currentAddress,
          logoUrl: override.logo ? `https://storage.googleapis.com/entity-logos/${attribution.entity}.jpg` : prev.selectedEntity?.logoUrl,
          type: override.entityType || 'wallet',
          bo: attribution.bo ?? prev.selectedEntity?.bo,
          custodian: attribution.custodian ?? prev.selectedEntity?.custodian,
        }
      } : null);
    }
  }, [attributions, itemsMap, currentAddress]);
>>>>>>> origin/staging

  useEffect(() => {
    // initial mount: empty graph
  }, []);

  // Load SOT data on component mount (same as Risk Dashboard)
  useEffect(() => {
    console.log('FlowTrace: Loading SOT data on component mount');
    dispatch(fetchSOT());
  }, [dispatch]);

  const handleAddConnections = useCallback((newConnections: FTConnection[]) => {
    setConnections(prev => {
      let updatedConnections = [...prev]
      
      newConnections.forEach(newConnection => {
        // First check if this exact UTXO already exists (by utxoKey)
        const existingUtxo = updatedConnections.find(conn => {
          // Check direct match
          if (conn.utxoKey === newConnection.utxoKey) return true;
          
          // Check if it's in an aggregated connection's originalConnections
          if (conn.isAggregated && conn.originalConnections) {
            return conn.originalConnections.some(origConn => origConn.utxoKey === newConnection.utxoKey);
          }
          
          return false;
        });
        
        // Skip if this UTXO already exists
        if (existingUtxo) {
          console.log('🚫 Skipping duplicate UTXO:', newConnection.utxoKey);
          return;
        }
        
        // Check if there are existing connections between the same nodes
        const existingIndividualConnections = updatedConnections.filter(conn => 
          conn.from === newConnection.from && conn.to === newConnection.to && !conn.isAggregated
        )
        
        const existingAggregatedConnection = updatedConnections.find(conn => 
          conn.from === newConnection.from && conn.to === newConnection.to && conn.isAggregated
        )
        
        if (utxoCollapseMode === 'aggregated' && (existingIndividualConnections.length > 0 || existingAggregatedConnection)) {
          // There are existing connections, create or update an aggregated connection
          let allConnections = [...existingIndividualConnections, newConnection]
          
          // If there's already an aggregated connection, include its original connections
          if (existingAggregatedConnection && existingAggregatedConnection.originalConnections) {
            allConnections = [...existingAggregatedConnection.originalConnections, newConnection]
          }
          
          // Calculate totals
          const totalAmount = allConnections.reduce((sum, conn) => 
            sum + parseFloat(conn.amount || '0'), 0
          )
          
          // Create aggregated connection
          const aggregatedConnection: FTConnection = {
            ...newConnection,
            amount: totalAmount.toFixed(8),
            txHash: allConnections.map(c => c.txHash).join(","),
            txid: allConnections.map(c => c.txid).filter(Boolean).join(","),
            isAggregated: true,
            utxoCount: allConnections.length,
            originalConnections: allConnections,
            groupId: `${newConnection.from}-${newConnection.to}`,
            _aggregatedText: {
              amount: totalAmount.toFixed(8),
              count: allConnections.length,
              currency: newConnection.currency
            }
          }
          
          // Remove individual connections and add aggregated one
          updatedConnections = updatedConnections.filter(conn => 
            !(conn.from === newConnection.from && conn.to === newConnection.to)
          ).concat([aggregatedConnection])
        } else {
          // If in individual mode or no existing, just add
          updatedConnections.push(newConnection)
        }
      })
      
      return updatedConnections;
    });
  }, [utxoCollapseMode]);

  // Function to process existing connections when UTXO mode changes
  const processConnectionsForMode = useCallback((mode: "aggregated" | "individual") => {
    setConnections(prev => {
      if (mode === "individual") {
        // Expand aggregated connections back to individual ones
        const expandedConnections: FTConnection[] = [];
        
        prev.forEach(conn => {
          if (conn.isAggregated && conn.originalConnections) {
            // Add all original individual connections
            expandedConnections.push(...conn.originalConnections);
          } else {
            // Keep non-aggregated connections as-is
            expandedConnections.push(conn);
          }
        });
        
        return expandedConnections;
      } else {
        // Aggregate individual connections
        const connectionGroups = new Map<string, FTConnection[]>();
        const nonGroupedConnections: FTConnection[] = [];
        
        prev.forEach(conn => {
          if (conn.isAggregated) {
            // Keep existing aggregated connections
            nonGroupedConnections.push(conn);
          } else {
            // Group individual connections by from-to pair
            const groupKey = `${conn.from}|${conn.to}`;
            if (!connectionGroups.has(groupKey)) {
              connectionGroups.set(groupKey, []);
            }
            connectionGroups.get(groupKey)!.push(conn);
          }
        });
        
        // Process each group
        const processedConnections: FTConnection[] = [...nonGroupedConnections];
        
        connectionGroups.forEach((groupConnections, groupKey) => {
          if (groupConnections.length > 1) {
            // Create aggregated connection
            const firstConn = groupConnections[0];
            const totalAmount = groupConnections.reduce((sum, conn) => 
              sum + parseFloat(conn.amount || '0'), 0
            );
            
            const aggregatedConnection: FTConnection = {
              ...firstConn,
              amount: totalAmount.toFixed(8),
              txHash: groupConnections.map(c => c.txHash).join(","),
              txid: groupConnections.map(c => c.txid).filter(Boolean).join(","),
              isAggregated: true,
              utxoCount: groupConnections.length,
              originalConnections: groupConnections,
              groupId: groupKey,
              _aggregatedText: {
                amount: totalAmount.toFixed(8),
                count: groupConnections.length,
                currency: firstConn.currency
              }
            };
            
            processedConnections.push(aggregatedConnection);
          } else {
            // Keep single connections as-is
            processedConnections.push(...groupConnections);
          }
        });
        
        return processedConnections;
      }
    });
  }, []);

  const onAdd = useCallback((payload: { address: string; selectedTxs: any[] }) => {
    const { selectedTxs, address } = payload
    
    // Since selectedTxs only contains NEW connections (filtered by !t.wouldCreateExistingConnection),
    // we don't need to handle removals here. The removal logic was incorrectly assuming that
    // all existing connections for the node were being re-selected, but that's not how it works.
    // We only add new connections, we don't remove existing ones.
    
    // Note: If we need to handle removals in the future, we should track which UTXOs were
    // previously selected in the dialog, not all existing connections for the node.
    
    // Handle additions only - no removals needed since selectedTxs only contains NEW connections
    const newConnections: FTConnection[] = []
    const addressesToPrefetch = new Set<string>()
    const addressEntityData = new Map<string, { entityName?: string; entityId?: string; entityType?: string; logoUrl?: string }>()

    // Group transactions by counterparty address to consolidate nodes
    const addressConnections = new Map<string, FTConnection[]>()
    
    selectedTxs.forEach((tx: any) => {
      // Each tx is an EnhancedTransaction representing a single UTXO
      // The direction tells us if this is an input or output UTXO
      console.log('🔍 Processing selectedTx:', {
        txid: tx.txid,
        direction: tx.direction,
        amount: tx.amount,
        currency: tx.currency,
        inputs: tx.inputs,
        outputs: tx.outputs
      });
      
      // Check if this UTXO is already connected in any direction
      const counterparty = tx.counterpartyAddress || (tx.direction === 'in' ? tx.inputs?.[0]?.addr : tx.outputs?.[0]?.addr);
      if (!counterparty) return;
      
      // Generate UTXO key to check for existing connections
      const utxoKey = generateUTXOKey({
        originalTxHash: tx.originalTxHash,
        txid: tx.txid,
        originalInputIndex: tx.originalInputIndex,
        originalOutputIndex: tx.originalOutputIndex,
        inputs: tx.inputs,
        outputs: tx.outputs,
        sourceAddress: tx.direction === 'in' ? counterparty : address,
        destinationAddress: tx.direction === 'in' ? address : counterparty,
        amount: tx.amount
      });
      
      // Check if this UTXO is already connected in any direction
      const existingConnection = connections.find(conn => {
        if (conn.utxoKey === utxoKey) return true;
        
        // Check if it's in an aggregated connection's originalConnections
        if (conn.isAggregated && conn.originalConnections) {
          return conn.originalConnections.some(origConn => origConn.utxoKey === utxoKey);
        }
        
        return false;
      });
      
      if (existingConnection) {
        console.log('🚫 Skipping already connected UTXO:', utxoKey, 'existing connection:', existingConnection);
        return;
      }
      
      if (tx.direction === 'in') {
        // This is an input UTXO - the address is receiving money
        // The connection goes from the input address to the current address
        const inputAddress = tx.counterpartyAddress || tx.inputs?.[0]?.addr
        if (!inputAddress) return
        
        // Store entity data for the input address - prioritize transaction-level attribution
        if (tx.entityName || tx.entityId || tx.entityType || tx.logo) {
          // Only set if we don't already have data for this address, or if the new data is more specific
          const existing = addressEntityData.get(inputAddress);
          if (!existing || (tx.entityId && !existing.entityId)) {
            addressEntityData.set(inputAddress, {
              entityName: tx.entityName,
              entityId: tx.entityId,
              entityType: tx.entityType,
              logoUrl: tx.logo
            })
          }
        }
        
        // UTXO key already generated above for deduplication check
        console.log('🔗 Creating input connection with utxoKey:', utxoKey, 'from', inputAddress, 'to', address);
        
        const connection: FTConnection = {
          from: inputAddress,
          to: address,
          amount: tx.amount || '0',
          currency: tx.currency || 'BTC',
          date: tx.time ? new Date(tx.time * 1000).toISOString() : new Date().toISOString(),
          txHash: tx.originalTxHash || tx.txid,
          txid: tx.txid,
          utxoKey,
          type: 'in',
          usdValue: tx.usdValue,
          locked: true // Mark as locked to prevent any future modifications
        }
        
        console.log('🔗 Created connection:', {
          from: connection.from,
          to: connection.to,
          amount: connection.amount,
          type: connection.type,
          utxoKey: connection.utxoKey
        });
        
        // Group connections by counterparty address
        if (!addressConnections.has(inputAddress)) {
          addressConnections.set(inputAddress, [])
        }
        addressConnections.get(inputAddress)!.push(connection)
        
        addressesToPrefetch.add(inputAddress)
      } else if (tx.direction === 'out') {
        // This is an output UTXO - the address is spending money
        // The connection goes from the current address to the output address
        const outputAddress = tx.counterpartyAddress || tx.outputs?.[0]?.addr
        if (!outputAddress) return
        
        // Store entity data for the output address - prioritize transaction-level attribution
        if (tx.entityName || tx.entityId || tx.entityType || tx.logo) {
          // Only set if we don't already have data for this address, or if the new data is more specific
          const existing = addressEntityData.get(outputAddress);
          if (!existing || (tx.entityId && !existing.entityId)) {
            addressEntityData.set(outputAddress, {
              entityName: tx.entityName,
              entityId: tx.entityId,
              entityType: tx.entityType,
              logoUrl: tx.logo
            })
          }
        }
        
        // UTXO key already generated above for deduplication check
        console.log('🔗 Creating output connection with utxoKey:', utxoKey, 'from', address, 'to', outputAddress);
        
        const connection: FTConnection = {
          from: address,
          to: outputAddress,
          amount: tx.amount || '0',
          currency: tx.currency || 'BTC',
          date: tx.time ? new Date(tx.time * 1000).toISOString() : new Date().toISOString(),
          txHash: tx.originalTxHash || tx.txid,
          txid: tx.txid,
          utxoKey,
          type: 'out',
          usdValue: tx.usdValue,
          locked: true // Mark as locked to prevent any future modifications
        }
        
        console.log('🔗 Created connection:', {
          from: connection.from,
          to: connection.to,
          amount: connection.amount,
          type: connection.type,
          utxoKey: connection.utxoKey
        });
        
        // Group connections by counterparty address
        if (!addressConnections.has(outputAddress)) {
          addressConnections.set(outputAddress, [])
        }
        addressConnections.get(outputAddress)!.push(connection)
        
        addressesToPrefetch.add(outputAddress)
      }
    })
    
    // Flatten all connections into the newConnections array
    addressConnections.forEach((connections) => {
      newConnections.push(...connections)
    })

    // Ensure nodes exist for all counterparties and position them relative to current node
    setNodes(prev => {
      const existingIds = new Set(prev.map(n => n.id))
      const base = prev.find(n => n.id === address)
      const baseX = base?.x ?? 300
      const baseY = base?.y ?? 240

      // Get unique addresses from the addressConnections map
      const uniqueAddresses = Array.from(addressConnections.keys())
      
      // Separate addresses by direction relative to the base node
      const inputAddresses: string[] = []
      const outputAddresses: string[] = []
      
      uniqueAddresses.forEach(addr => {
        const connections = addressConnections.get(addr) || []
        const hasIncoming = connections.some(conn => conn.to === address)
        const hasOutgoing = connections.some(conn => conn.from === address)
        
        if (hasIncoming && !inputAddresses.includes(addr)) {
          inputAddresses.push(addr)
        }
        if (hasOutgoing && !outputAddresses.includes(addr)) {
          outputAddresses.push(addr)
        }
      })

      const newNodes: FTNode[] = []
      
      // Position input nodes (incoming) on the left
      inputAddresses.forEach((addr, i) => {
        if (!existingIds.has(addr)) {
          const y = baseY + (i - (inputAddresses.length - 1) / 2) * 80
          const entityData = addressEntityData.get(addr)
          // Use consistent entity resolution - prioritize entityId over entityName
          const resolvedLabel = entityData?.entityName || addr;
          const resolvedEntityType = entityData?.entityType || 'wallet';
          
          newNodes.push({
            id: addr,
            label: resolvedLabel,
            x: baseX - 220, // Left side for inputs
            y,
            type: resolvedEntityType,
            entityId: entityData?.entityId,
            entityType: entityData?.entityType,
            logoUrl: entityData?.logoUrl,
            risk: 0 // Initialize with 0, will be updated when profile is fetched
          })
        }
      })
      
      // Position output nodes (outgoing) on the right
      outputAddresses.forEach((addr, i) => {
        if (!existingIds.has(addr)) {
          const y = baseY + (i - (outputAddresses.length - 1) / 2) * 80
          const entityData = addressEntityData.get(addr)
          // Use consistent entity resolution - prioritize entityId over entityName
          const resolvedLabel = entityData?.entityName || addr;
          const resolvedEntityType = entityData?.entityType || 'wallet';
          
          newNodes.push({
            id: addr,
            label: resolvedLabel,
            x: baseX + 220, // Right side for outputs
            y,
            type: resolvedEntityType,
            entityId: entityData?.entityId,
            entityType: entityData?.entityType,
            logoUrl: entityData?.logoUrl,
            risk: 0 // Initialize with 0, will be updated when profile is fetched
          })
        }
      })

      return newNodes.length ? [...prev, ...newNodes] : prev
    })

    // Use the new aggregation logic
    handleAddConnections(newConnections)

    // Fetch entity profiles and logos for all involved addresses (non-blocking)
    // This runs in the background and updates nodes as data becomes available
    prefetchProfilesAndLogos(Array.from(addressesToPrefetch).filter(Boolean))
  }, [handleAddConnections, prefetchProfilesAndLogos])

  const isEmptyState = nodes.length === 0 && !isLoading;

  return (
    <ViewWrapper
      icon={<Network className="w-8 h-8 text-orange-500" />}
      title={isEmptyState ? "FlowTrace" : ""}
      fullWidth={true}
    >
      {/* Sticky Search Bar */}
      <div className={`sticky top-[0] z-20 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 px-4 ${isEmptyState ? 'pt-2 py-4 mb-2' : 'py-4'}`}>
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="max-w-2xl flex-1">
              <AddressSearchInput
                placeholder="Enter Bitcoin address to trace (e.g., bc1qxy2...)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onSearch={handleTrace}
                loading={isLoading}
                disabled={isLoading}
                showValidation={true}
              />
            </div>
            <WorkspaceInfo 
              workspaceName={workspaceName || undefined}
              versionName={versionName || undefined}
              versionTimestamp={versionTimestamp || undefined}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>
          <div className="flex items-center gap-2">
            <HelpSystem />
            <Button variant="outline" size="sm" className="flex gap-1 items-center" onClick={() => setWalletPanelOpen(true)}>
              <Wallet className="h-4 w-4" />
              Wallet Clusters
            </Button>
            {hasUnsavedChanges && (
              <Button variant="outline" size="sm" className="flex gap-1 items-center" onClick={handleQuickSave}>
                <Save className="h-4 w-4" />
                Quick Save
              </Button>
            )}
            <SaveWorkspaceButton
              workspaceId={workspaceId}
              graphState={{ nodes, edges: connections, zoom: 1, pan: { x: 0, y: 0 }, hidePassThrough: false }}
              onSaveSuccess={() => {
                setHasUnsavedChanges(false);
                setVersionTimestamp(new Date().toISOString());
              }}
            />
            <Button variant="ghost" size="icon" aria-label="Manage workspaces" onClick={() => setWorkspaceMgrOpen(true)}>
              <GitBranch className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isEmptyState ? (
        <FlowTraceEmptyState />
      ) : (
        <div className="relative mt-4">
          {/* Main Toolbar - positioned on the right to avoid left panel */}
          <div className="absolute top-0 right-0 z-20">
            <Toolbar
              onZoomIn={() => graphRef.current?.zoomIn()}
              onZoomOut={() => graphRef.current?.zoomOut()}
              onReset={() => graphRef.current?.resetView()}
              onAddNode={handleAddNode}
              onColorPicker={() => {
                setDrawingToolbarVisible(!drawingToolbarVisible);
              }}
              utxoCollapseMode={utxoCollapseMode}
              onToggleUtxoMode={() => {
                const newMode = utxoCollapseMode === "aggregated" ? "individual" : "aggregated";
                setUtxoCollapseMode(newMode);
                processConnectionsForMode(newMode);
              }}
            />
          </div>

          {/* Drawing Toolbar - positioned vertically on the right side */}
          <DrawingToolbar
            isVisible={drawingToolbarVisible}
            onToggleVisibility={() => setDrawingToolbarVisible(!drawingToolbarVisible)}
            activeTool={activeDrawingTool}
            onToolChange={setActiveDrawingTool}
            activeColor={activeColor}
            onColorChange={setActiveColor}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDelete={handleDelete}
            onAddNode={handleAddNode}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < drawingHistory.length - 1}
            hasSelection={hasSelection}
          />

          <DebugPanel
            nodes={nodes}
            connections={connections}
            onClearData={handleClearData}
            onImportData={handleImportData}
          />

          {/* Network Graph and Left Panel */}
          <div className="relative" style={{ height: 'calc(100vh - 160px)' }}>
            <NetworkGraph
              ref={graphRef}
              nodes={nodes}
              connections={connections}
              onNodeClick={(node) => {
                // Node click selects the node and fetches its data for the left panel
                handleNodeSelection(node);
              }}
              onNodeDoubleClick={(node) => {
                // Allow renaming only for custom/empty nodes (no entityId/type or type === 'custom')
                const isCustom = node.type === 'custom' || (!node.entityId && !node.entityType);
                if (!isCustom) return;
                const current = node.label || node.id;
                const next = window.prompt('Rename node label:', current);
                if (next && next.trim().length) {
                  setNodes(prev => prev.map(n => n.id === node.id ? { ...n, label: next.trim() } : n));
                }
              }}
              onNodeAdd={(node) => {
                if (node.type === 'custom') {
                  setExpandSourceNode(node);
                  setCustomExpandOpen(true);
                } else {
                  // Set the source node to the currently selected node (the one we're expanding from)
                  setNodeTxPickerSourceNode(currentAddress || centerNodeId);
                  setCurrentAddress(node.id);
                  setNodeTxPickerOpen(true);
                }
              }}
              onNodeDrag={(nodeId, x, y) => {
                setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n));
              }}
              onEdgeClick={handleEdgeClick}
              onNodeRemove={(nodeId) => {
                setNodes(prev => prev.filter(n => n.id !== nodeId));
                setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
              }}
              utxoCollapseMode={utxoCollapseMode}
              activeTool={activeDrawingTool}
              activeColor={activeColor}
              onDrawingAction={handleDrawingAction}
              drawingHistory={drawingHistory.slice(0, historyIndex + 1)}

              centerNodeId={centerNodeId}
            />

            {/* Left Panel */}
            <div className="absolute top-0 left-0 h-full z-20">
              <LeftPanel
                address={currentAddress || centerNodeId || undefined}
                network={leftPanelData?.network}
                balance={leftPanelData?.balance}
                usdValue={leftPanelData?.usdValue}
                txCount={leftPanelData?.txCount}
                riskScore={leftPanelData?.riskScore}
                selectedEntity={leftPanelData?.selectedEntity}
                nodeData={nodes.find(n => n.id === (currentAddress || centerNodeId))}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
                isLoading={isLeftPanelLoading}
              />
            </div>
          </div>
        </div>
      )}

      <LoadingOverlay isLoading={isLoading} message="Tracing address..." />

      <NodeTxPicker
        open={nodeTxPickerOpen}
        onOpenChange={(open) => {
          setNodeTxPickerOpen(open);
          if (!open) {
            setNodeTxPickerSourceNode(null);
          }
        }}
        address={currentAddress || ''}
        nodeLabel={nodes.find(n => n.id === currentAddress)?.label}
        onAdd={onAdd}
                existingConnections={currentAddress ? findConnectionsForAddress(ensureConnectionKeys(connections), currentAddress) : []}
        sourceNode={nodeTxPickerSourceNode}
      />

      <EdgeDialog
        open={edgeDialogOpen}
        onOpenChange={setEdgeDialogOpen}
        data={selectedEdge ? {
          from: selectedEdge.from,
          to: selectedEdge.to,
          amount: selectedEdge.amount,
          currency: selectedEdge.currency,
          txHash: selectedEdge.txHash,
          date: selectedEdge.date,
          usdValue: selectedEdge.usdValue,
          note: selectedEdge.note
        } : undefined}
        onSetColor={(color) => {
          if (selectedEdge) {
            handleConnectionColorChange(selectedEdge.txHash, color);
          }
        }}
      />

      <GitHubWorkspaceManager
        open={workspaceMgrOpen}
        onOpenChange={(open) => {
          setWorkspaceMgrOpen(open);
          // If workspace manager is closed and there was a pending start new graph action, cancel it
          if (!open && pendingStartNewGraphAfterSave) {
            setPendingStartNewGraphAfterSave(false);
            setStartNewGraphConfirmationOpen(false);
            setPendingNewGraphAddress(null);
          }
        }}
        currentState={{ nodes, edges: connections, zoom: 1, pan: { x: 0, y: 0 }, hidePassThrough: false }}
        onLoadWorkspace={handleLoadWorkspaceFromManager}
        currentWorkspaceId={workspaceId || undefined}
        currentVersionId={currentVersionId}
        onWorkspaceCreated={handleWorkspaceCreated}
        onStartNewInvestigation={handleStartNewInvestigation}
        isSaveAndNewMode={pendingStartNewGraphAfterSave}
      />

      {/* Search Confirmation Dialog */}
      <SearchConfirmationDialog
        open={searchConfirmationOpen}
        onOpenChange={setSearchConfirmationOpen}
        newAddress={pendingAddress || ''}
        existingNodeCount={nodes.length}
        existingConnectionCount={connections.length}
        onAddToGraph={handleAddToGraph}
        onSaveAndNew={handleSaveAndNew}
        onDiscardAndNew={handleDiscardAndNew}
        onCancel={handleCancelSearch}
      />

      {/* Duplicate Node Dialog */}
      <DuplicateNodeDialog
        open={duplicateNodeDialogOpen}
        onOpenChange={setDuplicateNodeDialogOpen}
        duplicateAddress={duplicateAddress || ''}
        existingNodeLabel={findDuplicateNode(duplicateAddress || '')?.label}
        onViewExisting={handleViewExisting}
        onStartNewGraph={handleStartNewGraph}
        onCancel={handleCancelDuplicate}
      />

      {/* Start New Graph Confirmation Dialog */}
      <StartNewGraphConfirmationDialog
        open={startNewGraphConfirmationOpen}
        onOpenChange={setStartNewGraphConfirmationOpen}
        newAddress={pendingNewGraphAddress || ''}
        existingNodeCount={nodes.length}
        existingConnectionCount={connections.length}
        onSaveAndNew={handleSaveAndStartNewGraph}
        onDiscardAndNew={handleDiscardAndStartNewGraph}
        onCancel={handleCancelStartNewGraph}
      />

      {/* Save and New Dialog */}
      <SaveAndNewDialog
        open={saveAndNewDialogOpen}
        onOpenChange={setSaveAndNewDialogOpen}
        onSaveToExisting={handleSaveToExisting}
        onCreateNew={handleCreateNewWorkspace}
        onCancel={handleCancelSaveAndNew}
      />

      {/* Custom Node Dialog */}
      <CustomNodeDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        existingNodes={nodes}
        onCreate={({ label, currencyCode: _currencyCode, logo, notes, edges }) => {
          const nodeId = `custom-${Date.now()}`;
          const newNode: FTNode = {
            id: nodeId,
            label,
            x: 300,
            y: 240,
            type: 'custom',
            logoUrl: logo, // This should be the currency logo path
            notes: notes ? [{ id: `note-${Date.now()}`, userId: 'current_user', userName: 'Current User', content: notes, timestamp: new Date().toISOString() }] : undefined,
          };
          console.log('🎯 Creating custom node with logoUrl:', logo, 'for node:', nodeId);
          setNodes(prev => [...prev, newNode]);
          if (edges && edges.length) {
            const newEdges: FTConnection[] = edges.map((e, idx) => ({
              from: e.direction === 'out' ? nodeId : e.targetId,
              to: e.direction === 'out' ? e.targetId : nodeId,
              amount: e.amount,
              currency: e.currency,
              date: e.date,
              txHash: `cn-${Date.now()}-${idx}`,
              type: e.direction,
            } as FTConnection));
            console.log('🔗 Creating edges for custom node:', { nodeId, edges: newEdges });
            setConnections(prev => {
              const merged = mergeEdges(prev, newEdges);
              console.log('🔗 Merged connections:', { before: prev.length, after: merged.length, newEdges: newEdges.length });
              return merged;
            });
          }
        }}
      />

      {/* Custom Node Expand Dialog */}
      {expandSourceNode && (
        <CustomNodeExpandDialog
          open={customExpandOpen}
          onOpenChange={setCustomExpandOpen}
          sourceNode={expandSourceNode}
          existingNodes={nodes}
          onCreateEdges={(edges) => {
            const newEdges: FTConnection[] = edges.map((e, idx) => {
              const from = e.direction === 'out' ? expandSourceNode.id : e.targetId;
              const to = e.direction === 'out' ? e.targetId : expandSourceNode.id;
              const txHash = `ce-${Date.now()}-${idx}`;
              
              // Generate utxoKey for the new connection
              let utxoKey: string | undefined;
              try {
                utxoKey = generateUTXOKey({
                  txid: txHash,
                  sourceAddress: from, // Source address
                  destinationAddress: to, // Destination address
                  amount: e.amount
                });
              } catch (error) {
                console.warn('Failed to generate UTXO key for new connection:', error);
              }
              
              const connection: FTConnection = {
                from,
                to,
                amount: e.amount,
                currency: e.currency,
                date: e.date,
                txHash,
                type: e.direction,
                utxoKey
              };
              
              // Generate connection key
              connection.connectionKey = generateConnectionKey(connection);
              
              return connection;
            });
            setConnections(prev => mergeEdges(prev, newEdges));
          }}
                existingConnections={(() => {
                  // Ensure all connections have connectionKey
                  const connectionsWithKeys = ensureConnectionKeys(connections);
                  
                  // Find connections that involve the source node using connection key approach
                  const filtered = findConnectionsForAddress(connectionsWithKeys, expandSourceNode.id);
                  
                  console.log('🔍 CONNECTION FILTERING (Connection Key Approach):');
                  console.log('Source node:', expandSourceNode.id);
                  console.log('Found connections:', filtered.length);
                  console.log('Connection keys:', filtered.map(c => c.connectionKey));
                  
                  return filtered;
                })()}
          onEditEdges={(edges)=>{
            setConnections(prev => {
              const targetsKept = new Set(edges.map(e=>e.targetId))
              // Remove edges between custom node and nodes that are now unchecked
              const filtered = prev.filter(c => {
                const isCustomEdge = connectionInvolvesAddress(c, expandSourceNode.id)
                if (!isCustomEdge) return true
                // For custom edges, we need to check if the other node is still in targetsKept
                // This is a bit tricky with utxoKey, so we'll use the from/to fallback for this specific case
                const otherId = c.from === expandSourceNode.id ? c.to : c.from
                return targetsKept.has(otherId)
              })

              const updated = [...filtered]
              edges.forEach((e, idx) => {
                const from = e.direction==='out'? expandSourceNode.id : e.targetId
                const to = e.direction==='out'? e.targetId : expandSourceNode.id
                const txHash = `edit-${Date.now()}-${idx}`;
                
                // Generate utxoKey for the edited connection
                let utxoKey: string | undefined;
                try {
                  utxoKey = generateUTXOKey({
                    txid: txHash,
                    sourceAddress: from, // Source address
                    destinationAddress: to, // Destination address
                    amount: e.amount
                  });
                } catch (error) {
                  console.warn('Failed to generate UTXO key for edited connection:', error);
                }
                
                const connection: FTConnection = {
                  from,
                  to,
                  amount: e.amount,
                  currency: e.currency,
                  date: e.date,
                  txHash,
                  type: e.direction,
                  utxoKey
                };
                
                // Generate connection key
                connection.connectionKey = generateConnectionKey(connection);
                
                updated.push(connection);
              })
              return updated
            })
          }}
        />
      )}

      <WalletClusterPanel
        open={walletPanelOpen}
        onOpenChange={setWalletPanelOpen}
        nodes={nodes}
        connections={connections}
        consolidatedEntities={consolidatedEntities}
        onConfirmSelection={async (entityKey, _utxos) => {
          const memberIdsArr = nodes.filter(n => n.entityId === entityKey).map(n => n.id)
          if (!memberIdsArr.length) return

          const { aggregateEntity } = await import('./utils/aggregateEntity')
          const { newState, undo } = aggregateEntity(
            { nodes, edges: connections },
            entityKey,
            memberIdsArr,
          )

          setNodes(newState.nodes as any)
          setConnections(newState.edges as any)

          aggregationMap.current[entityKey] = { 
            nodes: undo.nodes as any, 
            connections: undo.edges as any, 
            allMemberConnections: undo.allMemberConnections as any,
            addresses: memberIdsArr 
          }

          if (!consolidatedEntities.includes(entityKey))
            setConsolidatedEntities([...consolidatedEntities, entityKey])
        }}
        onUndoAggregation={(entityKey) => {
          const saved = aggregationMap.current[entityKey]
          if (!saved) return

          setNodes((prev) => {
            // Remove aggregate node and restore originals
            const aggId = `agg:${entityKey.replace(/\s+/g, '_')}`;
            // Filter out aggregate node and add back original member nodes
            const withoutAgg = prev.filter(n => n.id !== aggId)
            return [...withoutAgg, ...saved.nodes]
          })

          setConnections(prev => {
            // Remove edges touching aggregate node and restore originals
            const aggId = `agg:${entityKey.replace(/\s+/g, '_')}`;
            const withoutAggEdges = prev.filter(c => c.from !== aggId && c.to !== aggId)
            return [...withoutAggEdges, ...saved.connections]
          })

          // Update consolidated list
          setConsolidatedEntities(prev => prev.filter(e => e !== entityKey))
        }}
      />

      {/* Aggregated Node Dialog */}
      <AggregatedNodeDialog
        open={aggregatedNodeDialogOpen}
        onOpenChange={setAggregatedNodeDialogOpen}
        aggregatedNode={selectedAggregatedNode}
        originalNodes={selectedAggregatedNode ? 
          aggregationMap.current[selectedAggregatedNode.id]?.nodes || [] : []
        }
        originalConnections={selectedAggregatedNode ? 
          aggregationMap.current[selectedAggregatedNode.id]?.connections || [] : []
        }
        allMemberConnections={selectedAggregatedNode ? 
          aggregationMap.current[selectedAggregatedNode.id]?.allMemberConnections || [] : []
        }
        allConnections={connections}
      />

    </ViewWrapper>
  );
};

export default FlowTracePage;