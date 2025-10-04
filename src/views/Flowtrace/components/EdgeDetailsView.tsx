import React, { useState } from 'react';

import { ArrowRight, Calendar, Coins, Copy, ExternalLink, Hash, Palette } from 'lucide-react';

import { useCryptoPrices } from '../../../hooks/useCryptoPrices';
import { logoService } from '../../../services/logoService';
import { formatAddress } from '../../../utils/addressValidation';
import { EdgePanelData } from '../types/leftPanelTypes';

const formatBitcoin = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  const btcValue = num / 100000000;
  return btcValue.toFixed(8);
};

const formatUSD = (btcAmount: string | number, btcPrice: number) => {
  const btc = Number(btcAmount) / 100000000;
  const usd = btc * btcPrice;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(usd);
};

interface EdgeDetailsViewProps {
  data: EdgePanelData;
  onConnectionColorChange?: (txHash: string, color: string) => void;
}

export const EdgeDetailsView: React.FC<EdgeDetailsViewProps> = ({
  data,
  onConnectionColorChange
}) => {
  const { getPrice } = useCryptoPrices();
  const btcPrice = getPrice('BTC') || 35000;

  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [copiedFrom, setCopiedFrom] = useState(false);
  const [copiedTo, setCopiedTo] = useState(false);

  // Logo loading state for from entity
  const [fromLogoUrl, setFromLogoUrl] = useState<string | null>(null);
  React.useEffect(() => {
    if (!data.fromEntity?.entityId) {
      setFromLogoUrl(null);
      return;
    }
    let cancelled = false;
    const url = logoService.getLogoUrl(data.fromEntity.entityId, data.fromEntity.logoUrl);
    if (url) {
      logoService.loadImage(url).then((img) => {
        if (!cancelled && img) setFromLogoUrl(img.src);
      });
    }
    return () => { cancelled = true; };
  }, [data.fromEntity?.entityId, data.fromEntity?.logoUrl]);

  // Logo loading state for to entity
  const [toLogoUrl, setToLogoUrl] = useState<string | null>(null);
  React.useEffect(() => {
    if (!data.toEntity?.entityId) {
      setToLogoUrl(null);
      return;
    }
    let cancelled = false;
    const url = logoService.getLogoUrl(data.toEntity.entityId, data.toEntity.logoUrl);
    if (url) {
      logoService.loadImage(url).then((img) => {
        if (!cancelled && img) setToLogoUrl(img.src);
      });
    }
    return () => { cancelled = true; };
  }, [data.toEntity?.entityId, data.toEntity?.logoUrl]);

  const onCopy = async (text: string, setterFn: (val: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setterFn(true);
      setTimeout(() => setterFn(false), 1200);
    } catch {}
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Color options for edge customization
  const colorOptions = [
    { name: 'Orange', value: '#ff6b35' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gray', value: '#6b7280' },
  ];

  const getEntityInitial = (entity?: { label?: string }) => {
    if (!entity?.label) return 'B';
    const label = entity.label;
    if (label.startsWith('1') || label.startsWith('3') || label.startsWith('bc1')) {
      return 'B';
    }
    return label.charAt(0).toUpperCase();
  };

  const getEntityDisplayName = (entity?: { label?: string; address?: string }) => {
    if (!entity) return 'Unknown';
    const label = entity.label || entity.address || 'Unknown';
    if (label.length > 20 && (label.startsWith('bc1') || label.startsWith('1') || label.startsWith('3'))) {
      return formatAddress(label, 16);
    }
    return label;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Transaction Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Transaction Details</h3>
        </div>

        {/* Transaction Hash */}
        <div className="space-y-2 mb-4">
          <label className="text-sm text-gray-600 dark:text-gray-400">Transaction Hash</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 font-mono text-xs break-all">
              {data.connection.txHash || data.connection.txid || 'N/A'}
            </div>
            <button
              onClick={() => onCopy(data.connection.txHash || data.connection.txid || '', setCopiedTxHash)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              title="Copy transaction hash"
            >
              <Copy className={`h-4 w-4 ${copiedTxHash ? 'text-green-500' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={() => {
                const txHash = data.connection.txHash || data.connection.txid;
                if (txHash) {
                  window.open(`/home/block-explorer/transaction/${txHash}`, '_blank', 'noopener,noreferrer');
                }
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              title="View in block explorer"
            >
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-blue-500" />
              <label className="text-sm text-gray-600 dark:text-gray-400">Amount (BTC)</label>
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatBitcoin(data.connection.amount)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-green-500" />
              <label className="text-sm text-gray-600 dark:text-gray-400">USD Value</label>
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {data.connection.usdValue || formatUSD(data.connection.amount, btcPrice)}
            </div>
          </div>
        </div>

        {/* Date */}
        {data.connection.date && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm text-gray-600 dark:text-gray-400">Date</label>
            </div>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {formatDate(data.connection.date)}
            </div>
          </div>
        )}

        {/* Fee */}
        {data.connection.fee && (
          <div className="space-y-2 mt-4">
            <label className="text-sm text-gray-600 dark:text-gray-400">Transaction Fee</label>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {formatBitcoin(data.connection.fee)} BTC
            </div>
          </div>
        )}

        {/* Direction indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Direction:</span>
            <span className={`font-medium ${data.connection.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
              {data.connection.type === 'in' ? 'Incoming' : 'Outgoing'}
            </span>
          </div>
        </div>
      </div>

      {/* From Entity Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">From</h3>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 overflow-hidden flex items-center justify-center shadow-lg flex-shrink-0">
            {fromLogoUrl ? (
              <img src={fromLogoUrl} alt="from logo" className="h-full w-full object-cover" />
            ) : (
              <div className="text-white font-semibold text-sm">
                {getEntityInitial(data.fromEntity)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {getEntityDisplayName(data.fromEntity)}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 font-mono truncate">
                {formatAddress(data.connection.from, 24)}
              </div>
              <button
                onClick={() => onCopy(data.connection.from, setCopiedFrom)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                title="Copy address"
              >
                <Copy className={`h-3 w-3 ${copiedFrom ? 'text-green-500' : 'text-gray-400'}`} />
              </button>
            </div>
            {data.fromEntity?.type && (
              <div className="mt-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {data.fromEntity.type}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="flex justify-center">
        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
          <ArrowRight className="h-5 w-5 text-gray-500" />
        </div>
      </div>

      {/* To Entity Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">To</h3>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-600 overflow-hidden flex items-center justify-center shadow-lg flex-shrink-0">
            {toLogoUrl ? (
              <img src={toLogoUrl} alt="to logo" className="h-full w-full object-cover" />
            ) : (
              <div className="text-white font-semibold text-sm">
                {getEntityInitial(data.toEntity)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {getEntityDisplayName(data.toEntity)}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 font-mono truncate">
                {formatAddress(data.connection.to, 24)}
              </div>
              <button
                onClick={() => onCopy(data.connection.to, setCopiedTo)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                title="Copy address"
              >
                <Copy className={`h-3 w-3 ${copiedTo ? 'text-green-500' : 'text-gray-400'}`} />
              </button>
            </div>
            {data.toEntity?.type && (
              <div className="mt-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {data.toEntity.type}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edge Customization */}
      {onConnectionColorChange && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-purple-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Edge Color</h3>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  const txHash = data.connection.txHash || data.connection.txid;
                  if (txHash) {
                    onConnectionColorChange(txHash, color.value);
                  }
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  data.connection.customColor === color.value
                    ? 'border-purple-500 scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                <div className="text-white text-xs font-medium">{color.name.charAt(0)}</div>
              </button>
            ))}
          </div>

          {data.connection.customColor && (
            <button
              onClick={() => {
                const txHash = data.connection.txHash || data.connection.txid;
                if (txHash) {
                  onConnectionColorChange(txHash, '');
                }
              }}
              className="mt-2 w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Reset to default
            </button>
          )}
        </div>
      )}

      {/* Additional Metadata */}
      {(data.connection.note || data.connection.isAggregated) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Additional Information</h3>

          {data.connection.isAggregated && (
            <div className="mb-3">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                Aggregated ({data.connection.utxoCount} UTXOs)
              </span>
            </div>
          )}

          {data.connection.note && (
            <div className="space-y-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Note</label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                {data.connection.note}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
