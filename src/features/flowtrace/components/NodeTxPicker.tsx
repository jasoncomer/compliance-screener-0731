import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { flowtraceService } from '../../../services/flowtraceService';

type Props = {
  open: boolean;
  address: string | null;
  onOpenChange: (open: boolean) => void;
  onAdd: (payload: { address: string; selectedTxs: any[] }) => void;
  nodeLabel?: string;
};

interface EntityProfile {
  entityId?: string;
  entityType?: string;
  label?: string;
  bo?: string;
  custodian?: string;
  riskScore?: number;
  logoUrl?: string | null;
}

const NodeTxPicker: React.FC<Props> = ({ open, address, onOpenChange, onAdd, nodeLabel }) => {
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date_desc' | 'date_asc'>('date_desc');
  const [entityProfiles, setEntityProfiles] = useState<Record<string, EntityProfile>>({});

  // Fetch entity profiles for addresses
  const fetchEntityProfiles = async (addresses: string[]) => {
    const uniqueAddresses = Array.from(new Set(addresses.filter(addr => addr && addr !== 'Unknown')));
    const profiles: Record<string, EntityProfile> = {};
    
    await Promise.allSettled(
      uniqueAddresses.map(async (addr) => {
        try {
          const profile = await flowtraceService.fetchEntityProfile(addr);
          profiles[addr] = profile;
        } catch (error) {
          console.error(`Error fetching profile for ${addr}:`, error);
        }
      })
    );
    
    setEntityProfiles(prev => ({ ...prev, ...profiles }));
  };

  useEffect(() => {
    const run = async () => {
      if (!open || !address) return;
      setLoading(true);
      try {
        // Use fetchAllTransactions to get all transactions for the address
        const resp = await flowtraceService.fetchAllTransactions(address, 100).catch(() => ({ txs: [], pagination: { totalTxs: 0 } } as any));
        
        // Show both UTXOs (address in outputs) and spending transactions (address in inputs)
        const allTransactions = (resp as any)?.txs || [];
        
        setTxs(allTransactions);
        setTotal(allTransactions.length);
        
        console.log(`NodeTxPicker: Found ${allTransactions.length} transactions for address ${address}`);
        
        // Extract all unique addresses from transactions to fetch their profiles
        const allAddresses = new Set<string>();
        allTransactions.forEach((tx: any) => {
          (tx.inputs || []).forEach((input: any) => {
            if (input.addr && input.addr !== address) allAddresses.add(input.addr);
          });
          (tx.outputs || []).forEach((output: any) => {
            if (output.addr && output.addr !== address) allAddresses.add(output.addr);
          });
        });
        
        // Fetch entity profiles for all counterparty addresses
        await fetchEntityProfiles(Array.from(allAddresses));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, address]);

  const toggle = (txid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(txid)) next.delete(txid); else next.add(txid);
      return next;
    });
  };

  const allOnPageIds = useMemo(() => txs.map((t) => t.txid).filter(Boolean), [txs]);

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = allOnPageIds.every((id) => next.has(id));
      if (allSelected) {
        allOnPageIds.forEach((id) => next.delete(id));
      } else {
        allOnPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const confirm = () => {
    if (!address) return;
    const rows = txs.filter((t) => selected.has(t.txid));
    onAdd({ address, selectedTxs: rows });
    onOpenChange(false);
    setSelected(new Set());
  };

  const filteredTxs = useMemo(() => {
    // Show all transactions (both UTXOs and spending transactions)
    const list = [...txs];
    const q = search.trim().toLowerCase();
    let res = q
      ? list.filter((t) =>
          (t.txid || '').toLowerCase().includes(q) ||
          ((t.inputs || []).some((i: any) => (i.addr || '').toLowerCase().includes(q))) ||
          ((t.outputs || []).some((o: any) => (o.addr || '').toLowerCase().includes(q)))
        )
      : list;
    if (sort === 'date_asc') res = res.sort((a: any, b: any) => (a.time || 0) - (b.time || 0));
    else res = res.sort((a: any, b: any) => (b.time || 0) - (a.time || 0));
    return res;
  }, [txs, search, sort, address]);

  // Helper function to get counterparty address and its profile
  const getCounterpartyInfo = (tx: any, currentAddress: string) => {
    const isInInputs = (tx.inputs || []).some((i: any) => i.addr === currentAddress);
    
    if (isInInputs) {
      // Current address is spending - counterparty is the first output address
      const outputAddress = (tx.outputs || [])[0]?.addr;
      if (outputAddress && outputAddress !== currentAddress) {
        return {
          address: outputAddress,
          profile: entityProfiles[outputAddress],
          type: 'recipient'
        };
      }
    } else {
      // Current address is receiving - counterparty is the first input address
      const inputAddress = (tx.inputs || [])[0]?.addr;
      if (inputAddress && inputAddress !== currentAddress) {
        return {
          address: inputAddress,
          profile: entityProfiles[inputAddress],
          type: 'sender'
        };
      }
    }
    
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSelected(new Set()); onOpenChange(o); }}>
      <DialogContent className="w-full max-w-7xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Expand Node:</span>
                <span className="truncate max-w-[360px]">{nodeLabel || address || 'Address'}</span>
                {loading ? (
                  <span className="ml-2 text-xs text-orange-500">Loading…</span>
                ) : (
                  <span className="ml-2 text-xs text-emerald-500">Ready</span>
                )}
              </div>
              <div className="text-xs text-gray-500">Processing</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="mb-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                placeholder="Search by address, entity name, or entity ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="text-sm px-2 py-1 border rounded"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="date_asc">Date (Oldest First)</option>
            </select>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              <button className="px-2 py-1 border rounded mr-2" onClick={() => setSelected(new Set())}>Deselect All</button>
              <span>{selected.size} of {filteredTxs.length} selected</span>
            </div>
            <div>Showing {filteredTxs.length} of {total} transactions for {address}</div>
          </div>
        </div>
        <div className="flex-1 min-h-0 border rounded overflow-hidden">
          <div className="h-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <th className="text-left p-2 w-8"><input type="checkbox" onChange={toggleAll} checked={allOnPageIds.length>0 && allOnPageIds.every(id => selected.has(id))} /></th>
                  <th className="text-left p-2 w-[150px]">Input Address</th>
                  <th className="text-left p-2 w-[150px]">Output Address</th>
                  <th className="text-left p-2 w-[200px]">Counterparty</th>
                  <th className="text-left p-2 w-[120px]">Amount</th>
                  <th className="text-left p-2 w-[80px]">Direction</th>
                  <th className="text-left p-2 w-[120px]">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="p-8 text-center" colSpan={7}>Loading…</td></tr>
                ) : filteredTxs.length === 0 ? (
                  <tr><td className="p-4 text-gray-500" colSpan={7}>No transactions</td></tr>
                ) : (
                  filteredTxs.map((t) => {
                    // Check if address is in inputs (spending) or outputs (receiving)
                    const isInInputs = (t.inputs || []).some((i: any) => i.addr === address);
                    const isInOutputs = (t.outputs || []).some((o: any) => o.addr === address);
                    
                    // Determine direction
                    const direction = isInInputs ? 'out' : 'in';
                    
                    // Find the relevant amount
                    let amountInSatoshis = 0;
                    let inputAddress = 'Unknown';
                    let outputAddress = 'Unknown';
                    
                    if (isInInputs) {
                      // Address is spending - find the input amount
                      const input = (t.inputs || []).find((i: any) => i.addr === address);
                      amountInSatoshis = input?.amt || 0;
                      inputAddress = address || 'Unknown';
                      // Find the first output address
                      outputAddress = (t.outputs || [])[0]?.addr || 'Unknown';
                    } else if (isInOutputs) {
                      // Address is receiving - find the output amount
                      const output = (t.outputs || []).find((o: any) => o.addr === address);
                      amountInSatoshis = output?.amt || 0;
                      // Find the first input address
                      inputAddress = (t.inputs || [])[0]?.addr || 'Unknown';
                      outputAddress = address || 'Unknown';
                    }
                    
                    // Convert from satoshis to BTC
                    const amountInBTC = amountInSatoshis / 100000000;
                    const amount = amountInBTC.toFixed(8);
                    
                    // Get counterparty information
                    const counterpartyInfo = getCounterpartyInfo(t, address || '');
                    
                    return (
                      <tr key={t.txid} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2"><input type="checkbox" checked={selected.has(t.txid)} onChange={() => toggle(t.txid)} /></td>
                        <td className="p-2">
                          <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                            {inputAddress.length > 12 ? `${inputAddress.slice(0, 6)}...${inputAddress.slice(-6)}` : inputAddress}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                            {outputAddress.length > 12 ? `${outputAddress.slice(0, 6)}...${outputAddress.slice(-6)}` : outputAddress}
                          </div>
                        </td>
                        <td className="p-2">
                          {counterpartyInfo ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {counterpartyInfo.profile?.logoUrl && (
                                  <img 
                                    src={counterpartyInfo.profile.logoUrl} 
                                    alt="Logo" 
                                    className="w-4 h-4 rounded-full"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                <span className="text-xs text-gray-500 capitalize">
                                  {counterpartyInfo.type}
                                </span>
                              </div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {counterpartyInfo.profile?.label || 'Unknown Entity'}
                              </div>
                              {counterpartyInfo.profile?.entityType && (
                                <div className="text-xs text-gray-500 capitalize">
                                  {counterpartyInfo.profile.entityType}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">No counterparty</div>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{amount} BTC</div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${direction === 'in' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-sm font-medium ${direction === 'in' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {direction.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]" title={t.txid}>
                            {t.txid.length > 12 ? `${t.txid.slice(0, 6)}...${t.txid.slice(-6)}` : t.txid}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 text-sm">
          <button className="px-3 py-2 border rounded" onClick={()=> onOpenChange(false)}>Cancel</button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Total transactions: {total}</span>
            <button className="px-4 py-2 bg-orange-600 text-white rounded disabled:opacity-50" disabled={!selected.size} onClick={confirm}>Confirm Expansion ({selected.size})</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NodeTxPicker;


