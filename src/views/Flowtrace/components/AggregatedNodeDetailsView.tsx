import React, { useState } from 'react';

import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronRight, Copy, Users } from 'lucide-react';

import { logoService } from '../../../services/logoService';
import { formatAddress } from '../../../utils/addressValidation';
import { AggregatedNodePanelData } from '../types/leftPanelTypes';

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

interface AggregatedNodeDetailsViewProps {
  data: AggregatedNodePanelData;
  isLoading?: boolean;
}

export const AggregatedNodeDetailsView: React.FC<AggregatedNodeDetailsViewProps> = ({
  data,
  isLoading = false
}) => {
  const [copied, setCopied] = useState(false);
  const [membersExpanded, setMembersExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'internal' | 'external'>('all');

  const logoUrl = React.useMemo(() => {
    const entityId = data.selectedEntity?.entityId || data.aggregatedNode.entityId;
    const url = logoService.getLogoUrl(entityId, data.selectedEntity?.logoUrl || data.aggregatedNode.logoUrl);
    return url;
  }, [data.selectedEntity?.entityId, data.selectedEntity?.logoUrl, data.aggregatedNode.entityId, data.aggregatedNode.logoUrl]);

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

  const onCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
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

  const getEntityInitial = () => {
    const label = data.aggregatedNode.label;
    if (!label) return 'A';
    if (label.startsWith('1') || label.startsWith('3') || label.startsWith('bc1')) {
      return 'A';
    }
    return label.charAt(0).toUpperCase();
  };

  // Get connections based on active tab
  const getDisplayedConnections = () => {
    switch (activeTab) {
      case 'internal':
        return data.internalConnections;
      case 'external':
        return data.externalConnections;
      default:
        return [...data.internalConnections, ...data.externalConnections];
    }
  };

  const displayedConnections = getDisplayedConnections();

  return (
    <>
      {/* Loading Indicator */}
      {isLoading && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading aggregated data...</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Aggregated Entity Header */}
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
                    {getEntityInitial()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight break-words">
                    {data.aggregatedNode.label || 'Aggregated Entity'}
                  </h3>
                </div>
                <div className="text-xs text-gray-500">
                  Cluster of {data.memberNodes.length} addresses
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              Aggregated
            </span>
            {data.selectedEntity?.type && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                {data.selectedEntity.type}
              </span>
            )}
            {typeof data.aggregatedRiskScore === 'number' && (
              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRiskBadgeColor(data.aggregatedRiskScore)}`}>
                {data.aggregatedRiskScore >= 70 ? 'HIGH RISK' :
                 data.aggregatedRiskScore >= 40 ? 'MEDIUM RISK' : 'LOW RISK'}
              </span>
            )}
            {data.selectedEntity?.ofac && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
                OFAC SANCTIONED
              </span>
            )}
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Members</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {data.memberNodes.length}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 rounded-full bg-purple-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Total Balance</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatBitcoin(data.totalBalance)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Transactions</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatCompact(data.totalTxCount)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 rounded-full bg-orange-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Risk Score</span>
            </div>
            <div className="text-xl font-bold">
              {typeof data.aggregatedRiskScore === 'number' ? (
                <span className={getRiskColor(data.aggregatedRiskScore)}>
                  {data.aggregatedRiskScore}/100
                </span>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Member Addresses */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setMembersExpanded(!membersExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Member Addresses ({data.memberNodes.length})
              </h3>
            </div>
            {membersExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {membersExpanded && (
            <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
              {data.memberNodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {node.label || formatAddress(node.id, 16)}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {formatAddress(node.id, 24)}
                    </div>
                  </div>
                  <button
                    onClick={() => onCopyAddress(node.id)}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                    title="Copy address"
                  >
                    <Copy className={`h-3 w-3 ${copied ? 'text-green-500' : 'text-gray-400'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connections Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Connections</h3>
            </div>
          </div>

          {/* Connection Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              All ({data.internalConnections.length + data.externalConnections.length})
            </button>
            <button
              onClick={() => setActiveTab('internal')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'internal'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Internal ({data.internalConnections.length})
            </button>
            <button
              onClick={() => setActiveTab('external')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'external'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              External ({data.externalConnections.length})
            </button>
          </div>

          {/* Connection List */}
          <div className="max-h-64 overflow-y-auto">
            {displayedConnections.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No {activeTab === 'all' ? '' : activeTab} connections found
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {displayedConnections.slice(0, 20).map((conn, idx) => (
                  <div
                    key={`${conn.from}-${conn.to}-${idx}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className={`p-1.5 rounded-full ${conn.type === 'in' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                      {conn.type === 'in' ? (
                        <ArrowDownRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {formatBitcoin(conn.amount)} BTC
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conn.date ? new Date(conn.date).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {formatAddress(conn.from, 8)} → {formatAddress(conn.to, 8)}
                      </div>
                    </div>
                  </div>
                ))}
                {displayedConnections.length > 20 && (
                  <div className="text-center pt-2 pb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Showing 20 of {displayedConnections.length} connections
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Network information */}
        {data.network && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Network</h3>
            </div>
            <div className="text-sm text-gray-900 dark:text-gray-100">{data.network}</div>
          </div>
        )}
      </div>
    </>
  );
};
