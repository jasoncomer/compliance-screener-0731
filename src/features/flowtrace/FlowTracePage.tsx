import React, { useEffect, useMemo, useState } from 'react';
import { flowtraceService } from '../../services/flowtraceService';
import NetworkGraph, { FTConnection, FTNode } from './components/NetworkGraph';
import Toolbar from './components/Toolbar';
import LeftPanel from './components/LeftPanel';
import EdgeDialog from './components/EdgeDialog';
import { getBlockchainType } from '../../utils/addressValidation';
import { mockConnections, mockLeftPanel, mockNodes } from '../flowtrace/mock/mockGraph';

const FlowTracePage: React.FC = () => {
  const [address, setAddress] = useState<string>('');
  const [nodes, setNodes] = useState<FTNode[]>([]);
  const [connections, setConnections] = useState<FTConnection[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<{ from: string; to: string; txHash?: string; amount?: number | string; currency?: string } | null>(null);
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [activeEdgeColor, setActiveEdgeColor] = useState<string>('#9ca3af');
  const [networkLabel, setNetworkLabel] = useState<string | undefined>(undefined);
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [useMock, setUseMock] = useState<boolean>(true);

  useEffect(() => {
    // Initialize mock scene on first load when mock mode is enabled
    if (useMock) {
      setNodes(mockNodes);
      setConnections(mockConnections);
      setNetworkLabel(mockLeftPanel.network);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Toggle between mock/live scenes
    if (useMock) {
      setNodes(mockNodes);
      setConnections(mockConnections);
      setNetworkLabel(mockLeftPanel.network);
    } else {
      setNodes([]);
      setConnections([]);
      setNetworkLabel(undefined);
    }
  }, [useMock]);

  const graph = useMemo(() => ({ nodes, connections }), [nodes, connections]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
        <input
          className="bg-gray-900 text-sm px-3 py-2 rounded border border-gray-700 w-96"
          placeholder="Enter address or transaction hash"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button
          className="px-3 py-2 bg-orange-600 text-white rounded"
          onClick={async () => {
            if (!address) return;
            try {
                const [data, txs] = await Promise.all([
                  flowtraceService.fetchAddress(address).catch(() => ({} as any)),
                  flowtraceService.fetchTransactions(address, 1, 50).catch(() => ({ txs: [] } as any)),
                ]);
                setNetworkLabel(getBlockchainType(address) === 'bitcoin' ? 'Bitcoin' : getBlockchainType(address) === 'ethereum' ? 'Ethereum' : undefined);
              setNodes((prev) => {
                const exists = prev.some((n) => n.id === address);
                if (exists) return prev;
                return [
                  ...prev,
                  { id: address, label: address, x: 300, y: 240, type: 'wallet', risk: data?.riskScore },
                ];
              });
                // Map a few connections for preview (simple heuristic: first input -> first output)
                const mapped: FTConnection[] = [];
                (txs?.txs || []).slice(0, 25).forEach((tx: any) => {
                  const from = tx?.inputs?.[0]?.addr;
                  const to = tx?.outputs?.[0]?.addr;
                  if (from && to) {
                    // seed nodes for endpoints
                    if (!nodes.find(n => n.id === from)) {
                      mapped.push({ from, to, txHash: tx.txid, amount: tx?.outputs?.reduce((s: number, o: any) => s + (o.value || 0), 0) });
                    }
                  }
                });
                if (mapped.length) {
                  setNodes(prev => {
                    const add: FTNode[] = [];
                    mapped.forEach(m => {
                      if (!prev.some(n => n.id === m.from)) add.push({ id: m.from, label: m.from, x: 220 + Math.random()*200, y: 160 + Math.random()*220 });
                      if (!prev.some(n => n.id === m.to)) add.push({ id: m.to, label: m.to, x: 420 + Math.random()*220, y: 260 + Math.random()*220 });
                    });
                    return [...prev, ...add];
                  });
                  setConnections(prev => [...prev, ...mapped]);
                  setCenterNodeId(address);
                }
            } catch (e) {
              // no-op for now
            }
          }}
        >
          Trace
        </button>
          <label className="ml-4 flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={useMock} onChange={(e) => {
              const checked = e.target.checked;
              setUseMock(checked);
              if (checked) {
                setNodes(mockNodes);
                setConnections(mockConnections);
                setNetworkLabel(mockLeftPanel.network);
              } else {
                setNodes([]);
                setConnections([]);
                setNetworkLabel(undefined);
              }
            }} />
            Mock view
          </label>
        </div>
        <Toolbar
          onZoomIn={() => {
            const ev = new WheelEvent('wheel', { deltaY: -100 });
            document.querySelector('canvas')?.dispatchEvent(ev);
          }}
          onZoomOut={() => {
            const ev = new WheelEvent('wheel', { deltaY: 100 });
            document.querySelector('canvas')?.dispatchEvent(ev);
          }}
          onReset={() => window.location.reload()}
          onAddNode={() => {
            const id = `node-${Math.random().toString(36).slice(2, 7)}`;
            setNodes((prev) => [...prev, { id, label: id, x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 }]);
          }}
          onPickColor={(c) => setActiveEdgeColor(c)}
          activeColor={activeEdgeColor}
        />
      </div>
      <div className="flex-1 flex">
        <LeftPanel
          address={useMock ? mockLeftPanel.address : (address || nodes[0]?.id)}
          network={useMock ? mockLeftPanel.network : networkLabel}
          balance={useMock ? mockLeftPanel.balance : undefined}
          usdValue={useMock ? mockLeftPanel.usdValue : undefined}
          txCount={useMock ? mockLeftPanel.txCount : undefined}
          riskScore={useMock ? mockLeftPanel.riskScore : nodes[0]?.risk}
        />
        <div className="flex-1 h-[calc(100vh-140px)] min-h-[600px]">
          <NetworkGraph 
            nodes={useMock ? mockNodes : nodes}
            setNodes={setNodes}
            connections={useMock ? mockConnections : connections}
            setConnections={setConnections}
            onEdgeClick={({ index, connection }) => {
              setSelectedEdge({
                from: connection.from,
                to: connection.to,
                txHash: connection.txHash,
                amount: connection.amount,
                currency: connection.currency,
              });
              setEdgeDialogOpen(true);
            }}
            onNodeClick={({ id }) => {
              setCenterNodeId(id);
            }}
            centerNodeId={centerNodeId}
          />
        </div>
      </div>
      <EdgeDialog
        open={edgeDialogOpen}
        onOpenChange={setEdgeDialogOpen}
        data={selectedEdge}
        onSetColor={(c) => setActiveEdgeColor(c)}
      />
    </div>
  );
};

export default FlowTracePage;


