import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { flowtraceService } from '../../services/flowtraceService';
import { getBlockchainType } from '../../utils/addressValidation';
import { NetworkGraph, FTConnection, FTNode, NetworkGraphHandle } from './components/NetworkGraph';
import { Toolbar } from './components/Toolbar';
import { DrawingToolbar, DrawingTool } from './components/DrawingToolbar';
import LeftPanel from './components/LeftPanel';
import NodeTxPicker from './components/NodeTxPicker';

import { LogoService } from '../../services/logoService';

const FlowTracePage: React.FC = () => {
  const { theme } = useTheme();
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
  const graphRef = React.useRef<NetworkGraphHandle | null>(null);

  // Function to fetch and set left panel data for an address
  const fetchAndSetLeftPanelData = async (address: string) => {
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

      // Update left panel data
      setLeftPanelData({
        address,
        network: getBlockchainType(address) === 'bitcoin' ? 'Bitcoin' : 'Ethereum',
        balance: summary.balance,
        txCount: summary.txCount || 0,
        riskScore: profile.riskScore,
        usdValue: summary.usdValue,
        selectedEntity: {
          label: profile.label || address,
          address,
          logoUrl: profile.logoUrl,
          type: profile.type || 'wallet',
          riskScore: profile.riskScore,
          bo: profile.bo,
          custodian: profile.custodian
        }
      });
    } catch (error) {
      console.error('Error fetching left panel data:', error);
    }
  };

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

  // Prefetch attribution profile and logos for a list of addresses
  const prefetchProfilesAndLogos = async (addresses: string[]) => {
    const unique = Array.from(new Set(addresses.filter(Boolean)));
    if (!unique.length) return;
    await Promise.allSettled(
      unique.map(async (addr) => {
        try {
          const profile = await flowtraceService.fetchEntityProfile(addr).catch(() => ({} as any));
          let logoUrl: string | null = null;
          if ((profile as any)?.entityId) {
            logoUrl = await LogoService.getLogoUrlWithFallback((profile as any).entityId, (profile as any).entityType).catch(() => null);
          }
          setNodes((prev) => prev.map((n) => (n.id === addr ? {
            ...n,
            label: (profile as any)?.label ?? n.label,
            risk: (profile as any)?.riskScore ?? n.risk,
            logoUrl: logoUrl ?? n.logoUrl,
            bo: (profile as any)?.bo ?? n.bo,
            custodian: (profile as any)?.custodian ?? n.custodian,
          } : n)));
        } catch {}
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

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <input
            className={`text-sm px-3 py-2 rounded border w-96 transition-colors ${
              theme === 'dark'
                ? 'bg-gray-900 text-white placeholder-gray-400 border-gray-700 focus:border-orange-500'
                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300 focus:border-orange-500'
            }`}
            placeholder="Enter address or transaction hash"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button
            className="px-3 py-2 bg-orange-600 text-white rounded"
            onClick={async () => {
              if (!address) return;
              try {
                // Only add the node, don't open picker
                setCenterNodeId(address);
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
              }
            }}
          >
            Trace
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
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

        {/* Drawing Toolbar */}
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

        <div className="absolute top-12 left-0 right-0 bottom-0">
          <NetworkGraph
            ref={graphRef}
            nodes={nodes}
            connections={connections}
            onNodeClick={(node) => {
              // Node click selects the node and fetches its data for the left panel
              setCurrentAddress(node.id);
              fetchAndSetLeftPanelData(node.id);
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
          />

          {/* Left Panel - positioned absolutely */}
          <div className="absolute top-0 left-0 h-full z-20">
            <LeftPanel
              address={currentAddress || centerNodeId || undefined}
              network={leftPanelData?.network}
              balance={leftPanelData?.balance}
              usdValue={leftPanelData?.usdValue}
              txCount={leftPanelData?.txCount}
              riskScore={leftPanelData?.riskScore}
              selectedEntity={leftPanelData?.selectedEntity}
              isExpanded={isExpanded}
              onToggle={() => setIsExpanded(!isExpanded)}
            />
          </div>
        </div>
      </div>

      <NodeTxPicker
        open={nodeTxPickerOpen}
        onOpenChange={setNodeTxPickerOpen}
        address={currentAddress || ''}
        nodeLabel={nodes.find(n => n.id === currentAddress)?.label}
        onAdd={onAdd}
      />
    </div>
  );
};

export default FlowTracePage;


