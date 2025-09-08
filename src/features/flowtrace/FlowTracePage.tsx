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
import FlowTraceEmptyState from './components/FlowTraceEmptyState';
import AddressSearchInput from '../../components/common/AddressSearchInput';
import ViewWrapper from '../../components/ViewWrapper';

const FlowTracePage: React.FC = () => {
  const [address, setAddress] = useState('');
  const [nodes, setNodes] = useState<FTNode[]>([]);
  const [connections, setConnections] = useState<FTConnection[]>([]);
  const [leftPanelData, setLeftPanelData] = useState<any>(null);
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [nodeTxPickerOpen, setNodeTxPickerOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [utxoCollapseMode, setUtxoCollapseMode] = useState<"aggregated" | "individual">("aggregated");
  
  // Drawing toolbar state
  const [drawingToolbarVisible, setDrawingToolbarVisible] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>('select');
  const [activeColor, setActiveColor] = useState('#ff6b35');
  const [drawingHistory, setDrawingHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLeftPanelLoading, setIsLeftPanelLoading] = useState(false);
  const graphRef = React.useRef<NetworkGraphHandle | null>(null);

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
    const newNode: FTNode = {
      id: `custom-${Date.now()}`,
      label: 'Custom Node',
      x: 300,
      y: 240,
      type: 'custom'
    };
    setNodes(prev => [...prev, newNode]);
  };

  const handleConnectionColorChange = (txHash: string, color: string) => {
    setConnections(prev => prev.map(conn => 
      conn.txHash === txHash ? { ...conn, customColor: color } : conn
    ));
  };

  const handleConnectionColorReset = (txHash: string) => {
    setConnections(prev => prev.map(conn => 
      conn.txHash === txHash ? { ...conn, customColor: undefined } : conn
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
        
        if (existingConnections.length > 0) {
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
          // No existing connections, just add the new one
          updatedConnections.push(newConnection)
        }
      })
      
      return updatedConnections
    })
  }, [])

  const onAdd = useCallback((payload: { address: string; selectedTxs: any[] }) => {
    const { selectedTxs, address } = payload
    const newConnections: FTConnection[] = []
    const addressesToPrefetch = new Set<string>()

    selectedTxs.forEach((tx: any) => {
      // Check if address is in inputs (spending) or outputs (receiving)
      const isInInputs = (tx.inputs || []).some((i: any) => i.addr === address)
      const isInOutputs = (tx.outputs || []).some((o: any) => o.addr === address)
      
      if (isInInputs) {
        // Address is spending - create connection from address to output addresses
        const input = (tx.inputs || []).find((i: any) => i.addr === address)
        const amountInSatoshis = input?.amt || 0
        const amountInBTC = (parseFloat(amountInSatoshis.toString()) / 100000000).toFixed(8)
        
        // Create connections to all output addresses
        ;(tx.outputs || []).forEach((output: any) => {
          const outputAddress = output.addr
          if (!outputAddress) return
          
          const utxoKey = `${tx.txid}::${outputAddress}::out`
          
          const connection: FTConnection = {
            from: address,
            to: outputAddress,
            amount: amountInBTC,
            currency: getBlockchainType(address) === 'bitcoin' ? 'BTC' : 'ETH',
            date: tx.time || new Date().toISOString(),
            txHash: tx.txid,
            utxoKey,
            type: 'out',
            usdValue: undefined,
          }
          
          console.log(`Creating spending connection:`, {
            from: address,
            to: outputAddress,
            amount: amountInBTC,
            txHash: tx.txid,
            utxoKey
          })
          
          newConnections.push(connection)
          addressesToPrefetch.add(outputAddress)
        })
      } else if (isInOutputs) {
        // Address is receiving - create connection from input addresses to address
        const output = (tx.outputs || []).find((o: any) => o.addr === address)
        const amountInSatoshis = output?.amt || 0
        const amountInBTC = (parseFloat(amountInSatoshis.toString()) / 100000000).toFixed(8)
        
        // Create connections from all input addresses
        ;(tx.inputs || []).forEach((input: any) => {
          const inputAddress = input.addr
          if (!inputAddress) return
          
          const utxoKey = `${tx.txid}::${address}::in`
          
          const connection: FTConnection = {
            from: inputAddress,
            to: address,
            amount: amountInBTC,
            currency: getBlockchainType(address) === 'bitcoin' ? 'BTC' : 'ETH',
            date: tx.time || new Date().toISOString(),
            txHash: tx.txid,
            utxoKey,
            type: 'in',
            usdValue: undefined,
          }
          
          console.log(`Creating receiving connection:`, {
            from: inputAddress,
            to: address,
            amount: amountInBTC,
            txHash: tx.txid,
            utxoKey
          })
          
          newConnections.push(connection)
          addressesToPrefetch.add(inputAddress)
        })
      }
    })

    // Ensure nodes exist for all counterparties and position them relative to current node
    setNodes(prev => {
      const existingIds = new Set(prev.map(n => n.id))
      const base = prev.find(n => n.id === address)
      const baseX = base?.x ?? 300
      const baseY = base?.y ?? 240
      const allAddresses = Array.from(addressesToPrefetch)

      const newNodes: FTNode[] = []
      const count = allAddresses.length
      allAddresses.forEach((addr, i) => {
        if (!existingIds.has(addr)) {
          const y = baseY + (i - (count - 1) / 2) * 80
          newNodes.push({
            id: addr,
            label: addr,
            x: baseX - 220,
            y,
            type: 'wallet'
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
              onAddNode={() => handleAddNode()}
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
          <div className="relative" style={{ height: 'calc(100vh - 280px)' }}>
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
                setCurrentAddress(node.id);
                setNodeTxPickerOpen(true);
              }}
              onNodeDrag={(nodeId, x, y) => {
                setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n));
              }}
              onEdgeClick={() => {
                // Handle edge click
              }}
              onNodeRemove={(nodeId) => {
                setNodes(prev => prev.filter(n => n.id !== nodeId));
                setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
              }}
              utxoCollapseMode={utxoCollapseMode}
              activeTool={activeDrawingTool}
              activeColor={activeColor}
              onDrawingAction={handleDrawingAction}
              drawingHistory={drawingHistory.slice(0, historyIndex + 1)}
              onConnectionColorChange={handleConnectionColorChange}
              onConnectionColorReset={handleConnectionColorReset}
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
      />
    </ViewWrapper>
  );
};

export default FlowTracePage;


