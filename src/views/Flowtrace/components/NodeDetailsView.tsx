import React, { useState } from 'react';

import { ArrowDownRight, ArrowUpRight, Copy, Info } from 'lucide-react';

import { useAddressTransactions } from '../../../hooks/useAddressTransactions';
import { useCryptoPrices } from '../../../hooks/useCryptoPrices';
import { flowtraceService } from '../../../services/flowtraceService';
import { logoService } from '../../../services/logoService';
import { useAppSelector } from '../../../store/hooks';
import { selectActiveOrganization } from '../../../store/slices/organizationsSlice';
import { RiskScoringResponse } from '../../../typings/riskScoring';
import { formatAddress } from '../../../utils/addressValidation';
import { transformBtcTransactions } from '../../../utils/transactionTransformers';
import RiskScoreModal from '../../../views/RiskDashboard/components/risk-analysis/RiskScoreModal';
import { NodePanelData } from '../types/leftPanelTypes';

import { AddressNotes } from './AddressNotes';
import { FTNode } from './NetworkGraph';

const formatCompact = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(num);
};

const formatBitcoin = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  const btcValue = num / 100000000;
  return btcValue.toFixed(8);
};

// Transaction History Component
const CustomTransactionHistory: React.FC<{ address: string }> = ({ address }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all');
  const { getPrice } = useCryptoPrices();
  const btcPrice = getPrice('BTC') || 35000;
  const { data: transactionData, isLoading, error } = useAddressTransactions(address, 1, 20);

  const transactions = React.useMemo(() => {
    if (!transactionData?.txs) return [];
    const transformed = transformBtcTransactions(transactionData.txs, address, btcPrice);

    switch (activeTab) {
      case 'in':
        return transformed.filter(tx => tx.type === 'in');
      case 'out':
        return transformed.filter(tx => tx.type === 'out');
      default:
        return transformed;
    }
  }, [transactionData?.txs, address, btcPrice, activeTab]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const tabs = [
    { id: 'all', label: 'All', count: transactionData?.txs?.length || 0 },
    { id: 'in', label: 'In', count: transactionData?.txs?.filter((tx: any) =>
      tx.outputs?.some((output: any) => output.addr === address)
    ).length || 0 },
    { id: 'out', label: 'Out', count: transactionData?.txs?.filter((tx: any) =>
      tx.inputs?.some((input: any) => input.addr === address)
    ).length || 0 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
        Error loading transactions: {error.message}
      </div>
    );
  }

  if (!address) {
    return (
      <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
        Enter an address to view transaction history
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'all' | 'in' | 'out')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/10'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>{tab.label}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">({tab.count})</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No {activeTab === 'all' ? '' : activeTab} transactions found
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {transactions.slice(0, 15).map((tx) => (
              <div
                key={`${tx.txid}-${tx.type}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => {
                  const explorerUrl = `/home/block-explorer/transaction/${tx.txid}`;
                  window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <div className={`p-1.5 rounded-full ${tx.type === 'in' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  {tx.type === 'in' ? (
                    <ArrowDownRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {tx.usd}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(tx.time)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {formatAddress(tx.txid)}
                  </div>
                </div>
              </div>
            ))}
            {transactions.length >= 15 && (
              <div className="text-center pt-2 pb-2">
                <button
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  onClick={() => {
                    const explorerUrl = `/home/block-explorer/address/${address}`;
                    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  View all transactions →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface NodeDetailsViewProps {
  data: NodePanelData;
  nodeData?: FTNode;
  isLoading?: boolean;
}

export const NodeDetailsView: React.FC<NodeDetailsViewProps> = ({
  data,
  nodeData,
  isLoading = false
}) => {
  const activeOrg = useAppSelector(selectActiveOrganization);
  const orgId = activeOrg?._id || localStorage.getItem('organizationId') || undefined;

  const [copied, setCopied] = useState(false);
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [riskModalData, setRiskModalData] = useState<RiskScoringResponse | null>(null);
  const [riskModalLoading, setRiskModalLoading] = useState(false);

  const { data: transactionData } = useAddressTransactions(data.address || '', 1, 1);
  const actualTxCount = transactionData?.pagination?.totalTxs || transactionData?.txs?.length || data.txCount || 0;

  const logoUrl = React.useMemo(() => {
    const entityId = data.selectedEntity?.entityId || nodeData?.entityId;
    const url = logoService.getLogoUrl(entityId, data.selectedEntity?.logoUrl);
    return url;
  }, [data.selectedEntity?.entityId, data.selectedEntity?.logoUrl, nodeData?.entityId]);

  const [loadedLogoUrl, setLoadedLogoUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (!logoUrl) {
      setLoadedLogoUrl(null);
      return;
    }

    let cancelled = false;
    logoService.loadImage(logoUrl).then((img) => {
      if (!cancelled && img) {
        setLoadedLogoUrl(img.src);
      } else if (!cancelled) {
        setLoadedLogoUrl(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.selectedEntity?.address || data.address || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const handleShowRiskDetails = async () => {
    if (!data.address) return;

    setRiskModalLoading(true);
    setRiskModalOpen(true);

    try {
      const riskData = await flowtraceService.fetchRiskScore(data.address, 'address');

      const normalizedRiskData = {
        overallRisk: riskData?.overallRisk || 0,
        entityRisk: riskData?.entityRisk || { factors: [], aggregateScore: 0 },
        transactionRisk: riskData?.transactionRisk || { factors: [], aggregateScore: 0 },
        jurisdictionRisk: riskData?.jurisdictionRisk || { factors: [], aggregateScore: 0 },
        analysisType: riskData?.analysisType || 'address',
        ...riskData
      };

      setRiskModalData(normalizedRiskData);
    } catch (error) {
      console.error('Error fetching detailed risk score:', error);
      setRiskModalData(null);
    } finally {
      setRiskModalLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
  };

  return (
    <>
      {/* Loading Indicator */}
      {isLoading && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading entity data...</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selected entity card */}
        {data.selectedEntity && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex items-center justify-center shadow-lg">
                  {loadedLogoUrl ? (
                    <img
                      src={loadedLogoUrl}
                      alt="logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-white font-semibold text-lg">
                      {(() => {
                        const entityName = nodeData?.label || data.selectedEntity?.label;
                        if (entityName && !entityName.startsWith('1') && !entityName.startsWith('3') && !entityName.startsWith('bc1')) {
                          return entityName.charAt(0).toUpperCase();
                        }
                        return 'B';
                      })()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight break-words">
                      {(() => {
                        const label = data.selectedEntity.label || 'Unknown Entity';
                        if (label.length > 20 && (label.startsWith('bc1') || label.startsWith('1') || label.startsWith('3'))) {
                          return formatAddress(label, 16);
                        }
                        return label;
                      })()}
                    </h3>
                  </div>
                  <div className="text-xs text-gray-500 font-mono break-all">{formatAddress(data.selectedEntity.address || '', 24)}</div>
                </div>
              </div>
              <button
                onClick={onCopy}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                title="Copy address"
              >
                <Copy className={`h-4 w-4 ${copied ? 'text-green-500' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {data.selectedEntity.type && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {data.selectedEntity.type}
                </span>
              )}
              {typeof (data.selectedEntity.riskScore ?? data.riskScore) === 'number' && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRiskBadgeColor((data.selectedEntity.riskScore ?? data.riskScore) as number)}`}>
                  {((data.selectedEntity.riskScore ?? data.riskScore) as number) >= 70 ? 'HIGH RISK' :
                   ((data.selectedEntity.riskScore ?? data.riskScore) as number) >= 40 ? 'MEDIUM RISK' : 'LOW RISK'}
                </span>
              )}
              {data.selectedEntity.ofac && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
                  OFAC SANCTIONED
                </span>
              )}
              {data.selectedEntity.entityTags?.includes('ofac sanctioned') && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
                  OFAC SANCTIONED
                </span>
              )}
            </div>

            {/* Bitcoin attribution information */}
            {(data.selectedEntity.bo || data.selectedEntity.custodian) && (
              <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                {data.selectedEntity.bo && (
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Beneficial Owner:</span>
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                      {data.selectedEntity.bo}
                    </div>
                  </div>
                )}
                {data.selectedEntity.custodian && (
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Custodian:</span>
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                      {data.selectedEntity.custodian}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Blockchain information */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Blockchain Data</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Network</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.network || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatBitcoin(data.balance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Transactions</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCompact(actualTxCount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score</span>
              <div className="flex items-center gap-2">
                {typeof data.riskScore === 'number' ? (
                  <>
                    <span className={`text-sm font-semibold ${getRiskColor(data.riskScore)}`}>{data.riskScore}/100</span>
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${data.riskScore >= 70 ? 'bg-red-500' : data.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${data.riskScore}%` }}
                      ></div>
                    </div>
                    <button
                      onClick={handleShowRiskDetails}
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="View detailed risk analysis"
                    >
                      <Info className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Transaction History</h3>
            </div>
          </div>
          <div className="h-80">
            <CustomTransactionHistory address={data.address || ''} />
          </div>
        </div>

        {/* Notes section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notes</h3>
          </div>
          <AddressNotes address={data.address || null} organizationId={orgId} />
        </div>
      </div>

      {/* Risk Score Modal */}
      <RiskScoreModal
        visible={riskModalOpen}
        onClose={() => setRiskModalOpen(false)}
        riskScores={riskModalData}
        address={data.address || ''}
        loading={riskModalLoading}
      />
    </>
  );
};
