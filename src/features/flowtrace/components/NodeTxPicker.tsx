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

const NodeTxPicker: React.FC<Props> = ({ open, address, onOpenChange, onAdd, nodeLabel }) => {
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date_desc' | 'date_asc'>('date_desc');

  useEffect(() => {
    const run = async () => {
      if (!open || !address) return;
      setLoading(true);
      try {
        const resp = await flowtraceService.fetchTransactions(address, page, pageSize).catch(() => ({ txs: [], pagination: { totalTxs: 0 } } as any));
        setTxs((resp as any)?.txs || []);
        setTotal((resp as any)?.pagination?.totalTxs ?? (resp as any)?.total ?? ((resp as any)?.txs?.length || 0));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, address, page, pageSize]);

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
  }, [txs, search, sort]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSelected(new Set()); onOpenChange(o); }}>
      <DialogContent className="w-full max-w-6xl h-[80vh] flex flex-col">
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
            <div>Showing {filteredTxs.length} of {total} inputs</div>
          </div>
        </div>
        <div className="flex-1 min-h-0 border rounded overflow-hidden">
          <div className="h-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <th className="text-left p-2 w-8"><input type="checkbox" onChange={toggleAll} checked={allOnPageIds.length>0 && allOnPageIds.every(id => selected.has(id))} /></th>
                  <th className="text-left p-2 w-[260px]">Tx Hash</th>
                  <th className="text-left p-2 w-[260px]">Inputs</th>
                  <th className="text-left p-2 w-[260px]">Outputs</th>
                  <th className="text-left p-2 w-[100px]">Value</th>
                  <th className="text-left p-2 w-[140px]">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="p-8 text-center" colSpan={6}>Loading…</td></tr>
                ) : filteredTxs.length === 0 ? (
                  <tr><td className="p-4 text-gray-500" colSpan={6}>No transactions</td></tr>
                ) : (
                  filteredTxs.map((t) => (
                    <tr key={t.txid} className="border-t">
                      <td className="p-2"><input type="checkbox" checked={selected.has(t.txid)} onChange={() => toggle(t.txid)} /></td>
                      <td className="p-2 truncate max-w-[260px]" title={t.txid}>{t.txid}</td>
                      <td className="p-2 truncate max-w-[260px]">{(t.inputs||[]).map((i:any)=>i.addr).filter(Boolean).slice(0,2).join(', ')}</td>
                      <td className="p-2 truncate max-w-[260px]">{(t.outputs||[]).map((o:any)=>o.addr).filter(Boolean).slice(0,2).join(', ')}</td>
                      <td className="p-2">{t.value ?? '—'}</td>
                      <td className="p-2">{t.time ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 text-sm">
          <button className="px-3 py-2 border rounded" onClick={()=> onOpenChange(false)}>Cancel</button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Total: {total}</span>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 border rounded" onClick={()=> setPage((p)=> Math.max(1,p-1))} disabled={page===1}>Prev</button>
              <span>Page {page}</span>
              <button className="px-2 py-1 border rounded" onClick={()=> setPage((p)=> p+1)} disabled={txs.length < pageSize}>Next</button>
            </div>
            <button className="px-4 py-2 bg-orange-600 text-white rounded disabled:opacity-50" disabled={!selected.size} onClick={confirm}>Confirm Expansion ({selected.size})</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NodeTxPicker;


