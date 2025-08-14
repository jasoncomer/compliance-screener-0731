import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { flowtraceService } from '../../services/flowtraceService';
import NetworkGraph, { FTConnection, FTNode } from './components/NetworkGraph';
import Toolbar from './components/Toolbar';
import LeftPanel from './components/LeftPanel';
import EdgeDialog from './components/EdgeDialog';
import { getBlockchainType } from '../../utils/addressValidation';
import NodeDialog from './components/NodeDialog';
import NodeTxPicker from './components/NodeTxPicker';
import { LogoService } from '../../services/logoService';

const FlowTracePage: React.FC = () => {
  const [address, setAddress] = useState<string>('');
  const [nodes, setNodes] = useState<FTNode[]>([]);
  const [connections, setConnections] = useState<FTConnection[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<{ from: string; to: string; txHash?: string; amount?: number | string; currency?: string } | null>(null);
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [activeEdgeColor, setActiveEdgeColor] = useState<string>('#9ca3af');
  const [networkLabel, setNetworkLabel] = useState<string | undefined>(undefined);
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  // No mock mode; render only searched address and user-selected edges
  const [summary, setSummary] = useState<{ balance?: string | number; usdValue?: string | number; txCount?: number } | undefined>();
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [txPickerOpen, setTxPickerOpen] = useState(false);
  const { theme } = useTheme();

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
            entityId: (profile as any)?.entityId ?? n.entityId,
            entityType: (profile as any)?.entityType ?? n.entityType,
            risk: (profile as any)?.riskScore ?? n.risk,
            logoUrl: logoUrl ?? n.logoUrl,
          } : n)));
        } catch {}
      })
    );
  };

  useEffect(() => {
    // initial mount: empty graph
  }, []);

  const graph = useMemo(() => ({ nodes, connections }), [nodes, connections]);

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
                // Open picker immediately for fast UX
                setCenterNodeId(address);
                setTxPickerOpen(true);
                // Fetch background data and hydrate once available
                (async () => {
                  const [data, txs] = await Promise.all([
                    flowtraceService.fetchAddress(address).catch(() => ({} as any)),
                    flowtraceService.fetchTransactions(address, 1, 50).catch(() => ({ txs: [] } as any)),
                  ]);
                  setNetworkLabel(getBlockchainType(address) === 'bitcoin' ? 'Bitcoin' : getBlockchainType(address) === 'ethereum' ? 'Ethereum' : undefined);
                  setSummary({
                    balance: (data as any)?.balance ?? (data as any)?.data?.balance,
                    usdValue: (data as any)?.usdValue ?? (data as any)?.data?.usdValue,
                    txCount: (txs as any)?.pagination?.totalTxs ?? (txs as any)?.total ?? ((txs as any)?.txs?.length || 0),
                  });
                  setNodes((prev) => {
                    const exists = prev.some((n) => n.id === address);
                    if (exists) return prev;
                    return [
                      ...prev,
                      { id: address, label: address, x: 300, y: 240, type: 'wallet', risk: (data as any)?.riskScore, balance: (data as any)?.balance ?? (data as any)?.data?.balance, usdValue: (data as any)?.usdValue ?? (data as any)?.data?.usdValue, txCount: ((txs as any)?.pagination?.totalTxs ?? (txs as any)?.total ?? 0) },
                    ];
                  });
                  prefetchProfilesAndLogos([address]);
                })();
            } catch (e) {
              // no-op for now
            }
          }}
        >
          Trace
        </button>
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
          address={(centerNodeId || address || nodes[0]?.id)}
          network={networkLabel}
          balance={(nodes.find(n => n.id === centerNodeId)?.balance ?? summary?.balance)}
          usdValue={(nodes.find(n => n.id === centerNodeId)?.usdValue ?? summary?.usdValue)}
          txCount={(nodes.find(n => n.id === centerNodeId)?.txCount ?? summary?.txCount)}
          riskScore={(nodes.find(n => n.id === centerNodeId)?.risk)}
          selectedEntity={{
            label: nodes.find(n => n.id === centerNodeId)?.label,
            address: centerNodeId || undefined,
            logoUrl: nodes.find(n => n.id === centerNodeId)?.logoUrl,
            type: nodes.find(n => n.id === centerNodeId)?.type,
            riskScore: nodes.find(n => n.id === centerNodeId)?.risk,
          }}
        />
        <div className="flex-1 h-[calc(100vh-140px)] min-h-[600px]">
          <NetworkGraph 
            nodes={nodes}
            setNodes={setNodes}
            connections={connections}
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
            onNodeClick={async ({ id }) => {
              // Open picker instantly; hydrate in background
              setCenterNodeId(id);
              setTxPickerOpen(true);
              (async () => {
                try {
                  const [addrData, txs, risk, profile] = await Promise.all([
                    flowtraceService.fetchAddress(id).catch(() => ({} as any)),
                    flowtraceService.fetchTransactions(id, 1, 1).catch(() => ({ txs: [], pagination: { totalTxs: 0 } } as any)),
                    flowtraceService.fetchRiskScore(id, 'address').catch(() => ({ score: undefined } as any)),
                    flowtraceService.fetchEntityProfile(id).catch(() => ({} as any)),
                  ]);
                  let logoUrl: string | null = null;
                  if ((profile as any)?.entityId) {
                    logoUrl = await LogoService.getLogoUrlWithFallback((profile as any).entityId, (profile as any).entityType).catch(() => null);
                  }
                  setNodes(prev => prev.map(n => n.id === id ? {
                    ...n,
                    risk: (risk as any)?.score ?? (profile as any)?.riskScore ?? n.risk,
                    balance: (addrData as any)?.balance ?? n.balance,
                    usdValue: (addrData as any)?.usdValue ?? n.usdValue,
                    txCount: (txs as any)?.pagination?.totalTxs ?? (txs as any)?.total ?? n.txCount,
                    entityId: (profile as any)?.entityId ?? n.entityId,
                    entityType: (profile as any)?.entityType ?? n.entityType,
                    label: (profile as any)?.label ?? n.label,
                    logoUrl: logoUrl ?? n.logoUrl,
                  } : n));
                  setSummary({
                    balance: (addrData as any)?.balance,
                    usdValue: (addrData as any)?.usdValue,
                    txCount: (txs as any)?.pagination?.totalTxs ?? (txs as any)?.total ?? 0,
                  });
                } catch {}
              })();
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
      <NodeDialog
        open={nodeDialogOpen}
        onOpenChange={setNodeDialogOpen}
        address={centerNodeId}
        riskScore={nodes.find(n => n.id === centerNodeId)?.risk}
        entityId={nodes.find(n => n.id === centerNodeId)?.entityId}
        entityType={nodes.find(n => n.id === centerNodeId)?.entityType}
        label={nodes.find(n => n.id === centerNodeId)?.label}
      />
      <NodeTxPicker
        open={txPickerOpen}
        onOpenChange={setTxPickerOpen}
        address={centerNodeId}
        nodeLabel={nodes.find(n => n.id === centerNodeId)?.label}
        onAdd={({ address, selectedTxs }) => {
          // Transform picked txs into connections: for each tx, connect first input to first output
          const newConnections: FTConnection[] = [];
          const addressesToPrefetch: Set<string> = new Set([address || '']);
          selectedTxs.forEach((tx: any) => {
            const from = tx?.inputs?.[0]?.addr;
            const to = tx?.outputs?.[0]?.addr;
            if (from && to) {
              newConnections.push({ from, to, txHash: tx.txid, amount: tx.value });
              // ensure endpoint nodes exist
              setNodes(prev => {
                const add: FTNode[] = [];
                if (!prev.some(n => n.id === from)) add.push({ id: from, label: from, x: 200 + Math.random()*200, y: 160 + Math.random()*220 });
                if (!prev.some(n => n.id === to)) add.push({ id: to, label: to, x: 420 + Math.random()*220, y: 260 + Math.random()*220 });
                return add.length ? [...prev, ...add] : prev;
              });
              addressesToPrefetch.add(from);
              addressesToPrefetch.add(to);
            }
          });
          if (newConnections.length) setConnections(prev => [...prev, ...newConnections]);
          setNodeDialogOpen(true);
          // Fetch entity profiles and logos for all involved endpoints so logos appear on nodes
          prefetchProfilesAndLogos(Array.from(addressesToPrefetch).filter(Boolean));
        }}
      />
    </div>
  );
};

export default FlowTracePage;


