import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { flowtraceService } from '../../../services/flowtraceService';

type TxRow = {
  txid: string;
  value?: number;
  time?: string | number;
  inputs?: any[];
  outputs?: any[];
};

type Props = {
  open: boolean;
  address: string | null;
  onOpenChange: (open: boolean) => void;
  riskScore?: number;
  entityId?: string;
  entityType?: string;
  label?: string;
};

const NodeDialog: React.FC<Props> = ({ open, address, onOpenChange, riskScore, entityId, entityType, label }) => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string | number | undefined>();
  const [usdValue, setUsdValue] = useState<string | number | undefined>();
  const [txCount, setTxCount] = useState<number | undefined>();
  const [txs, setTxs] = useState<TxRow[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!open || !address) return;
      setLoading(true);
      try {
        const [addrData, txResp] = await Promise.all([
          flowtraceService.fetchAddress(address).catch(() => ({} as any)),
          flowtraceService.fetchTransactions(address, 1, 10).catch(() => ({ txs: [], pagination: { totalTxs: 0 } } as any)),
        ]);
        setBalance((addrData as any)?.balance);
        setUsdValue((addrData as any)?.usdValue);
        setTxCount((txResp as any)?.pagination?.totalTxs ?? (txResp as any)?.total ?? ((txResp as any)?.txs?.length || 0));
        setTxs(((txResp as any)?.txs || []).map((t: any) => ({ txid: t.txid, value: t.value, time: t.time, inputs: t.inputs, outputs: t.outputs })));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, address]);

  const title = useMemo(() => (address ? address : 'Address'), [address]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate flex items-center gap-3">
            {label || title}
            {entityType && <span className="text-xs text-gray-400">{entityType}</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-xs text-gray-500">Balance</div>
              <div className="font-medium">{balance ?? '—'}</div>
            </div>
            <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-xs text-gray-500">USD Value</div>
              <div className="font-medium">{usdValue ?? '—'}</div>
            </div>
            <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-xs text-gray-500">Transactions</div>
              <div className="font-medium">{txCount ?? '—'}</div>
            </div>
            <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-xs text-gray-500">Risk Score</div>
              <div className="font-medium">{riskScore ?? '—'}</div>
            </div>
          </div>
          <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
            <div className="font-semibold mb-2">Recent Transactions</div>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left py-1 pr-2">Tx Hash</th>
                    <th className="text-left py-1 pr-2">Value</th>
                    <th className="text-left py-1 pr-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t) => (
                    <tr key={t.txid} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-1 pr-2 truncate max-w-[260px]">{t.txid}</td>
                      <td className="py-1 pr-2">{t.value ?? '—'}</td>
                      <td className="py-1 pr-2">{t.time ?? '—'}</td>
                    </tr>
                  ))}
                  {!txs.length && (
                    <tr>
                      <td className="py-2 text-gray-500" colSpan={3}>{loading ? 'Loading...' : 'No transactions found'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NodeDialog;


