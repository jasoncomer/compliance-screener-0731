import React from 'react';

type Props = {
  address?: string;
  network?: string;
  balance?: number | string;
  usdValue?: number | string;
  txCount?: number;
  riskScore?: number;
};

const LeftPanel: React.FC<Props> = ({ address, network, balance, usdValue, txCount, riskScore }) => {
  return (
    <div className="w-80 h-full border-r border-gray-200 dark:border-gray-800 p-3 space-y-3">
      <div className="text-xs text-gray-400">BlockScout Research</div>
      <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
        <div className="font-semibold mb-2">Blockchain</div>
        <div className="text-sm flex justify-between"><span>Network</span><span>{network || '—'}</span></div>
        <div className="text-sm flex justify-between"><span>Balance</span><span>{balance ?? '-'}</span></div>
        <div className="text-sm flex justify-between"><span>USD Value</span><span>{usdValue ?? '-'}</span></div>
        <div className="text-sm flex justify-between"><span>Transactions</span><span>{txCount ?? '-'}</span></div>
        <div className="text-sm flex justify-between items-center"><span>Risk Score</span>
          <span className="flex items-center gap-2">
            {typeof riskScore === 'number' ? (
              <span className="text-gray-300">{riskScore}/100</span>
            ) : '-'}
          </span>
        </div>
      </div>
      <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
        <div className="font-semibold mb-2">Notes</div>
        <div className="text-sm text-gray-500">No notes yet.</div>
      </div>
      <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
        <div className="font-semibold mb-2">Transaction History</div>
        <div className="text-sm text-gray-500">Coming soon</div>
      </div>
    </div>
  );
};

export default LeftPanel;


