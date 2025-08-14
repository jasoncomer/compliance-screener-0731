import React, { useState } from 'react';
import TransactionHistory from '../../../views/RiskDashboard/components/transaction-analysis/TransactionHistory';
import { formatAddress } from '../../../utils/addressValidation';
import { Copy, Pencil } from 'lucide-react';

const formatCompact = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(num);
};

type Props = {
  address?: string;
  network?: string;
  balance?: number | string;
  usdValue?: number | string;
  txCount?: number;
  riskScore?: number;
  selectedEntity?: {
    label?: string;
    address?: string;
    logoUrl?: string | null;
    type?: string;
    riskScore?: number;
  };
};

const LeftPanel: React.FC<Props> = ({ address, network, balance, usdValue, txCount, riskScore, selectedEntity }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedEntity?.address || address || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <div className="w-80 h-full border-r border-gray-200 dark:border-gray-800 p-3 space-y-3">
      {/* Selected entity header card */}
      {selectedEntity && (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-500 overflow-hidden flex items-center justify-center">
                {selectedEntity.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedEntity.logoUrl} alt="logo" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{selectedEntity.label || 'Entity'}</div>
                  <Pencil className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500 font-mono mt-1">{formatAddress(selectedEntity.address || '')}</div>
              </div>
            </div>
            <button onClick={onCopy} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {selectedEntity.type && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                {selectedEntity.type}
              </span>
            )}
            {typeof (selectedEntity.riskScore ?? riskScore) === 'number' && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${((selectedEntity.riskScore ?? riskScore) as number) >= 70 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                {((selectedEntity.riskScore ?? riskScore) as number) >= 70 ? 'HIGH RISK' : 'MEDIUM RISK'}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="text-xs text-gray-400">BlockScout Research</div>
      <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
        <div className="font-semibold mb-2">Blockchain</div>
        <div className="text-sm flex justify-between"><span>Network</span><span>{network || '—'}</span></div>
        <div className="text-sm flex justify-between"><span>Balance</span><span>{formatCompact(balance)}</span></div>
        <div className="text-sm flex justify-between"><span>USD Value</span><span>{formatCompact(usdValue)}</span></div>
        <div className="text-sm flex justify-between"><span>Transactions</span><span>{formatCompact(txCount)}</span></div>
        <div className="text-sm flex justify-between items-center"><span>Risk Score</span>
          <span className="flex items-center gap-2">
            {typeof riskScore === 'number' ? (
              <span className="text-gray-300">{riskScore}/100</span>
            ) : '—'}
          </span>
        </div>
      </div>
      <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
        <div className="font-semibold mb-2">Notes</div>
        <div className="text-sm text-gray-500">No notes yet.</div>
      </div>
      <div className="rounded-md border border-gray-200 dark:border-gray-800 p-0 overflow-hidden">
        <TransactionHistory address={address || ''} />
      </div>
    </div>
  );
};

export default LeftPanel;


