import React, { useState } from 'react';

import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Copy, Info,Pencil } from 'lucide-react';

import { useAddress } from '../../../hooks/useAddress';
import { useAddressTransactions } from '../../../hooks/useAddressTransactions';
import { useCryptoPrices } from '../../../hooks/useCryptoPrices';
import { flowtraceService } from '../../../services/flowtraceService';
import { useAppSelector } from '../../../store/hooks';
import { selectActiveOrganization } from '../../../store/slices/organizationsSlice';
import { RiskScoringResponse } from '../../../typings/riskScoring';
import { formatAddress } from '../../../utils/addressValidation';
import { transformBtcTransactions } from '../../../utils/transactionTransformers';
import RiskScoreModal from '../../../views/RiskDashboard/components/risk-analysis/RiskScoreModal';

import { AddressNotes } from './AddressNotes';

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
  // Convert from satoshis to BTC (1 BTC = 100,000,000 satoshis)
  const btcValue = num / 100000000;
  // Format Bitcoin with 8 decimal places, showing leading zeros
  return btcValue.toFixed(8);
};



// Custom Transaction History Component with Tabs
const CustomTransactionHistory: React.FC<{ address: string }> = ({ address }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all');
  const { getPrice } = useCryptoPrices();
  const btcPrice = getPrice('BTC') || 35000;
  const { data: transactionData, isLoading, error } = useAddressTransactions(address, 1, 20);

  const transactions = React.useMemo(() => {
    if (!transactionData?.txs) return [];
    const transformed = transformBtcTransactions(transactionData.txs, address, btcPrice);
    
    // Filter based on active tab
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

  // Removed org selector here; org is resolved in parent component scope

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
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

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No {activeTab === 'all' ? '' : activeTab} transactions found
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {transactions.slice(0, 15).map((tx) => (
              <div 
                key={tx.txid} 
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
    bo?: string;
    custodian?: string;
    ofac?: boolean;
    entityTags?: string[];
  };
  // Add node data to get logo directly from the same source as NetworkGraph
  nodeData?: {
    logoUrl?: string;
    entityId?: string;
    entityType?: string;
  };
  isExpanded?: boolean;
  onToggle?: () => void;
  isLoading?: boolean;
};

const LeftPanel: React.FC<Props> = ({ 
  address, 
  network, 
  balance, 
  txCount, 
  riskScore, 
  selectedEntity,
  nodeData,
  isExpanded = true,
  onToggle,
  isLoading = false
}) => {
  const activeOrg = useAppSelector(selectActiveOrganization as any) as any;
  const orgId = activeOrg?._id || localStorage.getItem('organizationId') || undefined;

  const [copied, setCopied] = useState(false);
  
  // Risk score modal state
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [riskModalData, setRiskModalData] = useState<RiskScoringResponse | null>(null);
  const [riskModalLoading, setRiskModalLoading] = useState(false);
  
  // Use the actual transaction data as a fallback for transaction count
  const { data: transactionData } = useAddressTransactions(address || '', 1, 1);
  const actualTxCount = transactionData?.pagination?.totalTxs || transactionData?.txs?.length || txCount || 0;
  
  // Get address data to access cospend_id
  const { data: addressData } = useAddress(address || '');
  const cospendId = addressData?.cospend_id;

  // Get logo URL from the same source as NetworkGraph (nodeData) with fallback to selectedEntity
  const logoUrl = nodeData?.logoUrl || selectedEntity?.logoUrl;
  
  // State to track the actual logo URL (with PNG fallback)
  const [actualLogoUrl, setActualLogoUrl] = useState<string | null>(null);
  
  // Implement PNG fallback logic (same as NetworkGraph)
  React.useEffect(() => {
    if (!logoUrl) {
      setActualLogoUrl(null);
      return;
    }
    
    // If it's already a PNG, use it directly
    if (logoUrl.endsWith('.png')) {
      setActualLogoUrl(logoUrl);
      return;
    }
    
    // If it's a JPG, test it first, then try PNG fallback
    if (logoUrl.endsWith('.jpg')) {
      const testImg = new Image();
      testImg.onload = () => {
        setActualLogoUrl(logoUrl);
      };
      testImg.onerror = () => {
        const pngUrl = logoUrl.replace('.jpg', '.png');
        const pngTestImg = new Image();
        pngTestImg.onload = () => {
          setActualLogoUrl(pngUrl);
        };
        pngTestImg.onerror = () => {
          setActualLogoUrl(null);
        };
        pngTestImg.src = pngUrl;
      };
      testImg.src = logoUrl;
    } else {
      // For other formats, use directly
      setActualLogoUrl(logoUrl);
    }
  }, [logoUrl]);
  
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedEntity?.address || address || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const handleShowRiskDetails = async () => {
    if (!address) return;
    
    setRiskModalLoading(true);
    setRiskModalOpen(true);
    
    try {
      const riskData = await flowtraceService.fetchRiskScore(address, 'address');
      
      // Ensure the data has the expected structure
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
    <div className={`relative h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? 'w-[28rem]' : 'w-12'}`}>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 h-6 w-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        title={isExpanded ? 'Collapse panel' : 'Expand panel'}
      >
        {isExpanded ? (
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Collapsed State */}
      {!isExpanded && (
        <div className="flex flex-col items-center py-4 space-y-4">
          {selectedEntity && (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex items-center justify-center shadow-lg">
              {selectedEntity.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedEntity.logoUrl} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <div className="text-white font-semibold text-xs">
                  {selectedEntity.label?.charAt(0)?.toUpperCase() || 'E'}
                </div>
              )}
            </div>
          )}
          <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
          <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
          <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Entity Details</h2>
            </div>
          </div>

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
            {selectedEntity && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex items-center justify-center shadow-lg">
                      {actualLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={actualLogoUrl} 
                          alt="logo" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-white font-semibold text-lg">
                          {selectedEntity?.label?.charAt(0)?.toUpperCase() || 'E'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight break-words">
                          {(() => {
                            const label = selectedEntity.label || 'Unknown Entity';
                            // If the label is a long address (no proper name), format it for better display
                            if (label.length > 20 && (label.startsWith('bc1') || label.startsWith('1') || label.startsWith('3'))) {
                              return formatAddress(label, 16);
                            }
                            return label;
                          })()}
                        </h3>
                        <Pencil className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="text-xs text-gray-500 font-mono break-all">{formatAddress(selectedEntity.address || '', 24)}</div>
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
                  {selectedEntity.type && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {selectedEntity.type}
                    </span>
                  )}
                  {typeof (selectedEntity.riskScore ?? riskScore) === 'number' && (
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRiskBadgeColor((selectedEntity.riskScore ?? riskScore) as number)}`}>
                      {((selectedEntity.riskScore ?? riskScore) as number) >= 70 ? 'HIGH RISK' : 
                       ((selectedEntity.riskScore ?? riskScore) as number) >= 40 ? 'MEDIUM RISK' : 'LOW RISK'}
                    </span>
                  )}
                  {selectedEntity.ofac && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
                      OFAC SANCTIONED
                    </span>
                  )}
                  {selectedEntity.entityTags?.includes('ofac sanctioned') && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
                      OFAC SANCTIONED
                    </span>
                  )}
                </div>

                {/* Bitcoin attribution information */}
                {(selectedEntity.bo || selectedEntity.custodian) && (
                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {selectedEntity.bo && (
                      <div className="space-y-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Beneficial Owner:</span>
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                          {selectedEntity.bo}
                        </div>
                      </div>
                    )}
                    {selectedEntity.custodian && (
                      <div className="space-y-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Custodian:</span>
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                          {selectedEntity.custodian}
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
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{network || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatBitcoin(balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Transactions</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCompact(actualTxCount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score</span>
                  <div className="flex items-center gap-2">
                    {typeof riskScore === 'number' ? (
                      <>
                        <span className={`text-sm font-semibold ${getRiskColor(riskScore)}`}>{riskScore}/100</span>
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${riskScore >= 70 ? 'bg-red-500' : riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${riskScore}%` }}
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

            {/* Notes section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notes</h3>
              </div>
              <AddressNotes address={address || null} cospendId={cospendId || null} organizationId={orgId} />
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
                <CustomTransactionHistory address={address || ''} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Risk Score Modal */}
      <RiskScoreModal
        visible={riskModalOpen}
        onClose={() => setRiskModalOpen(false)}
        riskScores={riskModalData}
        address={address || ''}
        loading={riskModalLoading}
      />
    </div>
  );
};

export { LeftPanel };


