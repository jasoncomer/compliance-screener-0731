import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { flowtraceService } from '../../../services/flowtraceService';
import { MessageSquarePlus } from 'lucide-react';

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

const NodeDialog: React.FC<Props> = ({ open, address, onOpenChange, riskScore, entityType, label }) => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string | number | undefined>();
  const [usdValue, setUsdValue] = useState<string | number | undefined>();
  const [txCount, setTxCount] = useState<number | undefined>();
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!open || !address) return;
      setLoading(true);
      try {
        // Use optimized endpoint instead of multiple individual calls
        const optimizedResponse = await flowtraceService.expandNodeOptimized(address, {
          includeRiskScores: true,
          includeTransactions: true
        });
        
        // Extract data from optimized response
        const { transactions, summary } = optimizedResponse.data;
        
        // Set balance (placeholder - could be calculated from transactions)
        setBalance('0');
        setUsdValue(0);
        
        // Set transaction count and data
        setTxCount(summary.totalTransactions);
        setTxs((transactions || []).slice(0, 10).map((t: any) => ({ 
          txid: t.txid, 
          value: t.value, 
          time: t.time, 
          inputs: t.inputs, 
          outputs: t.outputs 
        })));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, address]);

  const title = useMemo(() => (address ? address : 'Address'), [address]);

  const handleAddNote = (field: string) => {
    if (showNoteInput === field) {
      // Save note logic here - you can integrate with your notes API
      console.log(`Adding note for ${field}:`, noteText);
      setShowNoteInput(null);
      setNoteText('');
    } else {
      setShowNoteInput(field);
      setNoteText('');
    }
  };

  const handleCancelNote = () => {
    setShowNoteInput(null);
    setNoteText('');
  };

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
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Balance</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddNote('balance')}
                  className="h-6 w-6 p-0"
                >
                  <MessageSquarePlus className="h-3 w-3" />
                </Button>
              </div>
              <div className="font-medium">{balance ?? '—'}</div>
              {showNoteInput === 'balance' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote('balance')}
                    onKeyDown={(e) => e.key === 'Escape' && handleCancelNote()}
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">USD Value</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddNote('usdValue')}
                  className="h-6 w-6 p-0"
                >
                  <MessageSquarePlus className="h-3 w-3" />
                </Button>
              </div>
              <div className="font-medium">{usdValue ?? '—'}</div>
              {showNoteInput === 'usdValue' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote('usdValue')}
                    onKeyDown={(e) => e.key === 'Escape' && handleCancelNote()}
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Transactions</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddNote('transactions')}
                  className="h-6 w-6 p-0"
                >
                  <MessageSquarePlus className="h-3 w-3" />
                </Button>
              </div>
              <div className="font-medium">{txCount ?? '—'}</div>
              {showNoteInput === 'transactions' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote('transactions')}
                    onKeyDown={(e) => e.key === 'Escape' && handleCancelNote()}
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Risk Score</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddNote('riskScore')}
                  className="h-6 w-6 p-0"
                >
                  <MessageSquarePlus className="h-3 w-3" />
                </Button>
              </div>
              <div className="font-medium">{riskScore ?? '—'}</div>
              {showNoteInput === 'riskScore' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote('riskScore')}
                    onKeyDown={(e) => e.key === 'Escape' && handleCancelNote()}
                    autoFocus
                  />
                </div>
              )}
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


