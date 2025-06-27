import React from 'react';
import { 
  Bitcoin, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy
} from 'lucide-react';
import { Tag } from 'antd';
import { satsToBTC } from '../../../utils/crypto';
import { colors } from '../../../styles/variables';
import { RiskScoringResponse } from '../../../typings/riskScoring';
import AddressAttributionEntities from './AddressAttributionEntities';

interface AddressSummaryProps {
  address: string | undefined;
  summary: {
    balance: number;
    total_received: number;
    total_spent: number;
  };
  blockStats: {
    totalBlocks: number;
    firstBlock: {
      blockNumber: number;
      transactionCount: number;
      totalValue: number;
    } | null;
    lastBlock: {
      blockNumber: number;
      transactionCount: number;
      totalValue: number;
    } | null;
  };
  addrData?: {
    script_type?: string;
  };
  riskScore: RiskScoringResponse | null;
  isLoadingRiskScore: boolean;
  onRiskScoreClick: () => void;
  copySuccess: boolean;
  onCopyClick: (e: React.MouseEvent) => void;
  attributions: any;
  getEntityTags: (entityId: string) => string[];
  getTagColor: (tag: string) => string;
}

const AddressSummary: React.FC<AddressSummaryProps> = ({
  address,
  summary,
  blockStats,
  addrData,
  riskScore,
  isLoadingRiskScore,
  onRiskScoreClick,
  copySuccess,
  onCopyClick,
  attributions,
  getEntityTags,
  getTagColor
}) => {
  const getRiskColor = (score: number) => {
    if (score > 70) return colors.danger;
    if (score > 40) return colors.warning;
    return colors.success;
  };

  const getRiskIcon = (score: number) => {
    if (score > 70) return <XCircle className="w-4 h-4 text-red-500" />;
    if (score > 40) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getDisplayName = () => {
    if (address && attributions[address]?.entity) {
      // Get entity display name from itemsMap or use entity ID
      return attributions[address].entity;
    }
    return truncateAddress(address || '');
  };

  const getAttributionSummary = () => {
    if (!address || !attributions[address]) return null;
    
    const attrs = attributions[address];
    const summary = [];
    
    if (attrs.entity) summary.push(`Entity: ${attrs.entity}`);
    if (attrs.bo && attrs.bo !== attrs.entity) summary.push(`Owner: ${attrs.bo}`);
    if (attrs.custodian) summary.push(`Custodian: ${attrs.custodian}`);
    
    return summary;
  };

  return (
    <div className="sticky top-0 w-full z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="px-8 py-6">
        <div className="flex flex-wrap gap-6 justify-start">
          {/* Address Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-800 dark:to-gray-800 shadow-md rounded-2xl p-6 min-w-[280px] max-w-sm text-gray-900 dark:text-gray-100 relative border border-slate-200 dark:border-slate-700">
            <div className="absolute top-4 right-4 opacity-10 text-6xl select-none pointer-events-none">#</div>
            <div className="flex items-center gap-3 mb-3">
              <Bitcoin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <span className="text-base font-medium text-gray-700 dark:text-gray-300">Bitcoin Address</span>
            </div>
            <div className="text-xl font-bold break-all mb-3">{getDisplayName()}</div>
            
            {/* Attribution Information */}
            {getAttributionSummary() && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Attribution</div>
                {getAttributionSummary()?.map((attr, index) => (
                  <div key={index} className="text-xs text-blue-600 dark:text-blue-400 truncate">
                    {attr}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={onCopyClick}
                className="p-1.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="Copy full address"
              >
                {copySuccess ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              </button>
              <div className="flex gap-1 flex-wrap">
                {address && attributions[address] && getEntityTags(attributions[address]?.entity || '').map(tag => (
                  <Tag key={tag} color={getTagColor(tag.toLowerCase())} className="text-xs">
                    {tag.toUpperCase()}
                  </Tag>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">CURRENT BALANCE</div>
            <div className="text-2xl font-bold tracking-tight leading-tight text-gray-900 dark:text-gray-100">{satsToBTC(summary?.balance || 0)}</div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">BTC</div>
          </div>

          {/* Balance Flow Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-800 shadow-md rounded-2xl p-6 min-w-[260px] max-w-xs text-gray-900 dark:text-gray-100 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-base font-medium">Transaction Flows</span>
            </div>
            <div className="text-2xl font-bold mb-2">{satsToBTC(summary?.balance || 0)} <span className="text-base font-semibold">BTC</span></div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-1 text-green-700 dark:text-green-300 text-sm border border-green-200 dark:border-green-800">
                <span className="flex items-center gap-1 font-medium"><TrendingUp className="w-4 h-4" /> Received</span>
                <span className="font-bold">{satsToBTC(summary?.total_received || 0)} BTC</span>
              </div>
              <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-1 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
                <span className="flex items-center gap-1 font-medium"><TrendingDown className="w-4 h-4" /> Spent</span>
                <span className="font-bold">{satsToBTC(summary?.total_spent || 0)} BTC</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-800 shadow-md rounded-2xl p-6 min-w-[260px] max-w-xs text-gray-900 dark:text-gray-100 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span className="text-base font-medium">Blockchain Activity</span>
            </div>
            <div className="flex flex-col gap-3 mt-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">First Block</span>
                <span className="font-bold">{blockStats.firstBlock ? blockStats.firstBlock.blockNumber.toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Last Block</span>
                <span className="font-bold">{blockStats.lastBlock ? blockStats.lastBlock.blockNumber.toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Script Type</span>
                <span className="font-bold">{addrData?.script_type || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Risk Score Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-800 shadow-md rounded-2xl p-6 min-w-[200px] max-w-xs text-gray-900 dark:text-gray-100 items-center border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <span className="text-base font-medium">Risk Assessment</span>
            </div>
            <div className="flex flex-col items-center justify-center flex-1">
              {isLoadingRiskScore ? (
                <div className="text-orange-500 font-semibold text-lg">Loading...</div>
              ) : riskScore ? (
                <div className="flex flex-col items-center cursor-pointer" onClick={onRiskScoreClick}>
                  <div className="flex items-center gap-2 mb-1">
                    {getRiskIcon(riskScore.overallRisk * 100)}
                    <span className="text-3xl font-extrabold" style={{ color: getRiskColor(riskScore.overallRisk * 100) }}>{Math.round(riskScore.overallRisk * 100)}%</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 underline mt-1 cursor-pointer hover:text-orange-600 dark:hover:text-orange-400">View Details</span>
                </div>
              ) : (
                <div className="text-gray-500 font-semibold text-lg">N/A</div>
              )}
            </div>
          </div>
        </div>

        {/* Attribution Section */}
        {address && attributions[address] && (
          <div className="mt-6">
            <AddressAttributionEntities address={address} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSummary; 