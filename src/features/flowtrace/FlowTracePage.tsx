import React, { useEffect, useState, useCallback } from 'react';
import { flowtraceService } from '../../services/flowtraceService';
import { Network } from 'lucide-react';

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
  const aggregationMap = React.useRef<Record<string, { nodes: FTNode[]; connections: FTConnection[]; addresses: string[] }>>({})
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
  const graphRef = React.useRef<NetworkGraphHandle | null>(null);

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
      const [data, summary, txs, profile] = await Promise.all([
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
        flowtraceService.fetchEntityProfile(address).catch((error) => {
          console.error('fetchEntityProfile error:', error);
          return {} as any;
        }),
      ]);
      
      console.log('API Debug:', {
        address,
        data,
        summary,
        txs,
        profile
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
    setIsLoading(true);
    try {
      // Set both center node and current address to ensure left panel shows correct data
      setCenterNodeId(address);
      setCurrentAddress(address);
      
      // Clear any existing left panel data to prevent showing stale information
      setLeftPanelData(null);
      
      // Fetch background data and hydrate once available
      await fetchAndSetLeftPanelData(address);

      // Add node to graph
      const newNode: FTNode = {
        id: address,
        label: address, // Will be updated by prefetchProfilesAndLogos
        x: 300,
        y: 240,
        type: 'wallet', // Will be updated by prefetchProfilesAndLogos
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

  // Prefetch attribution profile and logos for a list of addresses
  const prefetchProfilesAndLogos = async (addresses: string[]) => {
    console.log('prefetchProfilesAndLogos called with addresses:', addresses);
    const unique = Array.from(new Set(addresses.filter(Boolean)));
    if (!unique.length) return;
    await Promise.allSettled(
      unique.map(async (addr) => {
        try {
          const profile = await flowtraceService.fetchEntityProfile(addr).catch(() => ({} as any));
          
          // The logo URL should come directly from the SOT data in the profile
          const logoUrl = (profile as any)?.logoUrl || null;
          
          setNodes((prev) => prev.map((n) => (n.id === addr ? {
            ...n,
            label: (profile as any)?.label ?? n.label,
            risk: (profile as any)?.riskScore ?? n.risk,
            logoUrl: logoUrl ?? n.logoUrl,
            entityId: (profile as any)?.entityId ?? n.entityId,
            entityType: (profile as any)?.entityType ?? n.entityType,
            bo: (profile as any)?.bo ?? n.bo,
            custodian: (profile as any)?.custodian ?? n.custodian,
          } : n)));
          
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
          console.error('Error in prefetchProfilesAndLogos for', addr, ':', error);
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
        // Check if there are existing connections between the same nodes
        const existingConnections = updatedConnections.filter(conn => 
          conn.from === newConnection.from && conn.to === newConnection.to && !conn.isAggregated
        )
        
        if (utxoCollapseMode === 'aggregated' && existingConnections.length > 0) {
          // There are existing individual connections, create or update an aggregated connection
          const allConnections = [...existingConnections, newConnection]
          
          // Calculate totals
          const totalAmount = allConnections.reduce((sum, conn) => 
            sum + parseFloat(conn.amount || '0'), 0
          )
          
          // Create aggregated connection
          const aggregatedConnection: FTConnection = {
            ...newConnection,
            amount: totalAmount.toFixed(8),
            txHash: allConnections.map(c => c.txHash).join(","),
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
    const newConnections: FTConnection[] = []
    const addressesToPrefetch = new Set<string>()
    const addressEntityData = new Map<string, { entityName?: string; entityId?: string; entityType?: string; logoUrl?: string }>()

    // Group transactions by counterparty address to consolidate nodes
    const addressConnections = new Map<string, FTConnection[]>()
    
    selectedTxs.forEach((tx: any) => {
      // Each tx is an EnhancedTransaction representing a single UTXO
      // The direction tells us if this is an input or output UTXO
      if (tx.direction === 'in') {
        // This is an input UTXO - the address is receiving money
        // The connection goes from the input address to the current address
        const inputAddress = tx.inputs?.[0]?.addr
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
        
        const utxoKey = `${tx.originalTxHash || tx.txid}::${address}::in`
        
        const connection: FTConnection = {
          from: inputAddress,
          to: address,
          amount: tx.amount || '0',
          currency: tx.currency || 'BTC',
          date: tx.time ? new Date(tx.time * 1000).toISOString() : new Date().toISOString(),
          txHash: tx.originalTxHash || tx.txid,
          utxoKey,
          type: 'in',
          usdValue: tx.usdValue,
        }
        
        // Group connections by counterparty address
        if (!addressConnections.has(inputAddress)) {
          addressConnections.set(inputAddress, [])
        }
        addressConnections.get(inputAddress)!.push(connection)
        
        addressesToPrefetch.add(inputAddress)
      } else if (tx.direction === 'out') {
        // This is an output UTXO - the address is spending money
        // The connection goes from the current address to the output address
        const outputAddress = tx.outputs?.[0]?.addr
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
        
        const utxoKey = `${tx.originalTxHash || tx.txid}::${outputAddress}::out`
        
        const connection: FTConnection = {
          from: address,
          to: outputAddress,
          amount: tx.amount || '0',
          currency: tx.currency || 'BTC',
          date: tx.time ? new Date(tx.time * 1000).toISOString() : new Date().toISOString(),
          txHash: tx.originalTxHash || tx.txid,
          utxoKey,
          type: 'out',
          usdValue: tx.usdValue,
        }
        
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
            logoUrl: entityData?.logoUrl
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
            logoUrl: entityData?.logoUrl
          })
        }
      })

      return newNodes.length ? [...prev, ...newNodes] : prev
    })

    // Use the new aggregation logic
    handleAddConnections(newConnections)

    // Fetch entity profiles and logos for all involved addresses
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
        onOpenChange={setNodeTxPickerOpen}
        address={currentAddress || ''}
        nodeLabel={nodes.find(n => n.id === currentAddress)?.label}
        onAdd={onAdd}
        existingConnections={connections}
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
            const newEdges: FTConnection[] = edges.map((e, idx) => ({
              from: e.direction === 'out' ? expandSourceNode.id : e.targetId,
              to: e.direction === 'out' ? e.targetId : expandSourceNode.id,
              amount: e.amount,
              currency: e.currency,
              date: e.date,
              txHash: `ce-${Date.now()}-${idx}`,
              type: e.direction,
            } as FTConnection));
            setConnections(prev => mergeEdges(prev, newEdges));
          }}
          existingConnections={connections.filter(c => c.from===expandSourceNode.id || c.to===expandSourceNode.id)}
          onEditEdges={(edges)=>{
            setConnections(prev => {
              const targetsKept = new Set(edges.map(e=>e.targetId))
              // Remove edges between custom node and nodes that are now unchecked
              const filtered = prev.filter(c => {
                const isCustomEdge = c.from===expandSourceNode.id || c.to===expandSourceNode.id
                if (!isCustomEdge) return true
                const otherId = c.from===expandSourceNode.id ? c.to : c.from
                return targetsKept.has(otherId)
              })

              const updated = [...filtered]
              edges.forEach((e, idx) => {
                const from = e.direction==='out'? expandSourceNode.id : e.targetId
                const to = e.direction==='out'? e.targetId : expandSourceNode.id
                updated.push({
                  from,
                  to,
                  amount: e.amount,
                  currency: e.currency,
                  date: e.date,
                  txHash: `edit-${Date.now()}-${idx}`,
                  type: e.direction,
                } as FTConnection)
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

          aggregationMap.current[entityKey] = { nodes: undo.nodes as any, connections: undo.edges as any, addresses: memberIdsArr }

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
    </ViewWrapper>
  );
};

export default FlowTracePage;