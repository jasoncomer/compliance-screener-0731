import React, { useEffect, useState, useCallback } from 'react';
import { flowtraceService } from '../../services/flowtraceService';
import { Network } from 'lucide-react';
import { generateUTXOKey, connectionInvolvesAddress, generateConnectionKey, findConnectionsForAddress, ensureConnectionKeys } from './utils/utxoKeyGeneration';

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
import { loadVersion, type Workspace } from '@/lib/workspace-utils'
import { GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CustomNodeDialog from './components/CustomNodeDialog'
import CustomNodeExpandDialog from './components/CustomNodeExpandDialog'
import { WalletClusterPanel } from './components/WalletClusterPanel'
import { AggregatedNodeDialog } from './components/AggregatedNodeDialog'
import { Wallet } from 'lucide-react'

// helper to merge duplicate edges (same from,to,currency,type)
const mergeEdges = (existing: FTConnection[], incoming: FTConnection[]) => {
  const map = new Map<string, FTConnection>()

  const edgeKey = (e: FTConnection) => `${e.from}|${e.to}|${e.currency}|${e.type || 'out'}`

  const addEdge = (edge: FTConnection) => {
    const k = edgeKey(edge)
    if (map.has(k)) {
      const cur = map.get(k)!
      // sum amounts numerically if possible
      const total = (parseFloat(cur.amount) || 0) + (parseFloat(edge.amount) || 0)
      cur.amount = String(total)
      // concat txHash
      cur.txHash = `${cur.txHash},${edge.txHash}`
      cur.date = `${cur.date},${edge.date}`
    } else {
      map.set(k, { ...edge })
    }
  }

  existing.forEach(addEdge)
  incoming.forEach(addEdge)

  return Array.from(map.values())
}

const FlowTracePage: React.FC = () => {
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

  // Handles loading a workspace/version chosen in the manager
  const handleLoadWorkspaceFromManager = useCallback(async (ws: Workspace, versionId?: string) => {
    const version = await loadVersion(ws.id, versionId || 'master');
    if (version) {
      setNodes(version.graphState.nodes as any);
      setConnections(version.graphState.edges as any);
      setWorkspaceId(ws.id);
      setCurrentVersionId(version.id);
    }
  }, [setNodes, setConnections]);

  // Function to fetch and set left panel data for an address
  const fetchAndSetLeftPanelData = async (address: string) => {
    setIsLeftPanelLoading(true);
    try {
      // Fetch core data first (fast)
      const [data, summary, txs] = await Promise.all([
        flowtraceService.fetchAddress(address).catch((error) => {
          console.error('fetchAddress error:', error);
          return {} as any;
        }),
        flowtraceService.fetchAddressSummary(address).catch((error) => {
          console.error('fetchAddressSummary error:', error);
          return {} as any;
        }),
        flowtraceService.fetchTransactions(address, 1, 50).catch((error) => {
          console.error('fetchTransactions error:', error);
          return { txs: [] } as any;
        }),
      ]);

      // Fetch entity profile with timeout (this includes risk score)
      let profile = {} as any;
      try {
        const profilePromise = flowtraceService.fetchEntityProfile(address);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
        );
        profile = await Promise.race([profilePromise, timeoutPromise]);
      } catch (error) {
        console.warn('fetchEntityProfile error (continuing without profile):', error);
      }
      
      console.log('API Debug:', {
        address,
        data,
        summary,
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

      // Use actual transaction count from the transactions API instead of summary
      const actualTxCount = txs?.pagination?.totalTxs || txs?.txs?.length || 0;

      // Update left panel data
      const leftPanelData = {
        address,
        network: getBlockchainType(address) === 'bitcoin' ? 'Bitcoin' : 'Ethereum',
        balance: summary.balance,
        txCount: actualTxCount, // Use actual transaction count
        riskScore: profile.riskScore,
        usdValue: summary.usdValue,
        selectedEntity: {
          label: profile.properName || profile.label || address,
          address,
          logoUrl: profile.logoUrl,
          type: profile.type || 'wallet',
          riskScore: profile.riskScore,
          bo: profile.bo,
          custodian: profile.custodian
        }
      };
      
      setLeftPanelData(leftPanelData);
    } catch (error) {
      console.error('Error fetching left panel data:', error);
    } finally {
      setIsLeftPanelLoading(false);
    }
  };

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

  const handleLoadSampleData = () => {
    const sampleNodes: FTNode[] = [
      {
        id: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
        label: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
        x: 200,
        y: 200,
        type: 'wallet',
        risk: 0.2
      },
      {
        id: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',
        label: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',
        x: 400,
        y: 200,
        type: 'wallet',
        risk: 0.1
      },
      {
        id: 'bc1qdef456789012345678901234567890123456789',
        label: 'bc1qdef456789012345678901234567890123456789',
        x: 300,
        y: 350,
        type: 'wallet',
        risk: 0.3
      }
    ];

    const sampleConnections: FTConnection[] = [
      {
        from: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
        to: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',
        amount: '1000000',
        currency: 'BTC',
        date: '2024-01-15',
        txHash: 'tx123',
        utxoKey: 'tx123::0::bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w::1000000',
        connectionKey: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s:bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w:tx123::0::bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w::1000000:1000000'
      },
      {
        from: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',
        to: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
        amount: '500000',
        currency: 'BTC',
        date: '2024-01-16',
        txHash: 'tx456',
        utxoKey: 'tx456::0::bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s::500000',
        connectionKey: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w:bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s:tx456::0::bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s::500000:500000'
      },
      {
        from: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
        to: 'bc1qdef456789012345678901234567890123456789',
        amount: '2000000',
        currency: 'BTC',
        date: '2024-01-17',
        txHash: 'tx789',
        utxoKey: 'tx789::0::bc1qdef456789012345678901234567890123456789::2000000',
        connectionKey: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s:bc1qdef456789012345678901234567890123456789:tx789::0::bc1qdef456789012345678901234567890123456789::2000000:2000000'
      }
    ];

    setNodes(sampleNodes);
    setConnections(sampleConnections);
    setCurrentAddress('bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s');
    setCenterNodeId('bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s');
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
    setIsLoading(true);
    try {
      // Set both center node and current address to ensure left panel shows correct data
      setCenterNodeId(address);
      setCurrentAddress(address);
      
      // Clear any existing left panel data to prevent showing stale information
      setLeftPanelData(null);
      
      // Fetch background data and hydrate once available (includes risk score)
      await fetchAndSetLeftPanelData(address);

      // Add node to graph
      const newNode: FTNode = {
        id: address,
        label: address, // Will be updated by prefetchProfilesAndLogos
        x: 300,
        y: 240,
        type: 'wallet', // Will be updated by prefetchProfilesAndLogos
        risk: 0, // Initialize with 0, will be updated by prefetchProfilesAndLogos
      };

      setNodes(prev => {
        const exists = prev.find(n => n.id === address);
        if (exists) return prev;
        return [...prev, newNode];
      });

      // Fetch entity profile and logo for the new node
      prefetchProfilesAndLogos([address]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    // initial mount: empty graph
  }, []);



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
        
        // Store entity data for the input address
        if (tx.entityName || tx.entityId || tx.entityType || tx.logo) {
          addressEntityData.set(inputAddress, {
            entityName: tx.entityName,
            entityId: tx.entityId,
            entityType: tx.entityType,
            logoUrl: tx.logo
          })
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
        
        // Store entity data for the output address
        if (tx.entityName || tx.entityId || tx.entityType || tx.logo) {
          addressEntityData.set(outputAddress, {
            entityName: tx.entityName,
            entityId: tx.entityId,
            entityType: tx.entityType,
            logoUrl: tx.logo
          })
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
          newNodes.push({
            id: addr,
            label: entityData?.entityName || addr,
            x: baseX - 220, // Left side for inputs
            y,
            type: 'wallet',
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
          newNodes.push({
            id: addr,
            label: entityData?.entityName || addr,
            x: baseX + 220, // Right side for outputs
            y,
            type: 'wallet',
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
          <div className="flex-1 max-w-2xl">
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
          <div className="flex items-center gap-2">
            <HelpSystem />
            <Button variant="outline" size="sm" className="flex gap-1 items-center" onClick={() => setWalletPanelOpen(true)}>
              <Wallet className="h-4 w-4" />
              Wallet Clusters
            </Button>
            <SaveWorkspaceButton
              workspaceId={workspaceId}
              graphState={{ nodes, edges: connections, zoom: 1, pan: { x: 0, y: 0 }, hidePassThrough: false }}
            />
            <Button variant="ghost" size="icon" aria-label="Manage workspaces" onClick={() => setWorkspaceMgrOpen(true)}>
              <GitBranch className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isEmptyState ? (
        <FlowTraceEmptyState onLoadSampleData={handleLoadSampleData} />
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
              onToggleUtxoMode={() => setUtxoCollapseMode(prev => prev === "aggregated" ? "individual" : "aggregated")}
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
        onOpenChange={setWorkspaceMgrOpen}
        currentState={{ nodes, edges: connections, zoom: 1, pan: { x: 0, y: 0 }, hidePassThrough: false }}
        onLoadWorkspace={handleLoadWorkspaceFromManager}
        currentWorkspaceId={workspaceId || undefined}
        currentVersionId={currentVersionId}
        onWorkspaceCreated={setWorkspaceId}
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