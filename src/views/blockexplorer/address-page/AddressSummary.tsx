import React from 'react';

import { Tag } from 'antd';
import { 
  AlertTriangle,
  Bitcoin, 
  CheckCircle,
  Clock, 
  Copy,
  TrendingDown, 
  TrendingUp, 
  XCircle} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { colors } from '@/design-system/tokens'
import { cn } from '@/lib/utils';

import { SimpleLogo } from '../../../components/common/Logo';
import { RiskScoringResponse } from '../../../typings/riskScoring';
import { EEntityType } from '../../../typings/SOT';
import { satsToBTC } from '../../../utils/crypto';
import { getEntityTypeLabel } from '../../../utils/display-labels';

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
  itemsMap: Record<string, any>;
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
  getTagColor,
  itemsMap
}) => {
  const getRiskColor = (score: number) => {
    if (score > 70) return colors.semantic.danger;
    if (score > 40) return colors.semantic.warning;
    return colors.semantic.success;
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
      // Get entity display name from SOT data using proper_name
      const entity = Object.values(itemsMap).find(sot => sot.entity_id === attributions[address].entity);
      return entity?.proper_name || attributions[address].entity;
    }
    return truncateAddress(address || '');
  };

  const getEntityType = () => {
    if (address && attributions[address]?.entity) {
      const entity = Object.values(itemsMap).find(sot => sot.entity_id === attributions[address].entity);
      return entity?.entity_type ? getEntityTypeLabel(entity.entity_type as EEntityType) : 'Unknown';
    }
    return 'Unknown';
  };





  return (
    <>
      {/* Main Cards - scrollable */}
      <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-none">
        <div className="px-4 py-2">
          <div className="flex flex-wrap gap-3 justify-start">
            {/* Address Card */}
            <div className="flex flex-col bg-gradient-to-br from-slate-100 to-gray-200 dark:from-background dark:to-background shadow-md rounded-2xl p-2 flex-1 min-w-[250px] text-gray-900 dark:text-gray-100 relative border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
              <div className="absolute top-2 right-2 opacity-10 text-2xl select-none pointer-events-none">#</div>
              <div className="flex items-center gap-1 mb-1">
                {address && attributions[address]?.entity ? (
                  <SimpleLogo
                    entityId={attributions[address].entity}
                    entityType={getEntityType()}
                    size="small"
                    shape="circle"
                  />
                ) : (
                  <Bitcoin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                )}
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{truncateAddress(address || '')}</span>
                <button
                  onClick={onCopyClick}
                  className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Copy full address"
                >
                  {copySuccess ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
                </button>
              </div>
              <div className="text-lg font-bold break-all mb-1">{getDisplayName()}</div>
              
              {/* Entity Type */}
              {address && attributions[address]?.entity && (
                <div className="mb-1 p-1 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                  <div className="text-xs font-medium text-orange-700 dark:text-orange-300">Entity Type</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 truncate">
                    {getEntityType()}
                  </div>
                </div>
              )}
              
              {/* Tags section with proper overflow handling */}
              <div className="flex items-start gap-1 mt-auto">
                <div className="flex gap-1 flex-wrap overflow-hidden">
                  {address && attributions[address] && getEntityTags(attributions[address]?.entity || '').slice(0, 5).map(tag => {
                    const tagColor = getTagColor(tag.toLowerCase());
                    return (
                      <Badge
                        key={tag}
                        className={cn(
                          "text-xs px-2 py-0 flex-shrink-0",
                          tagColor === 'red' && "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
                          tagColor === 'orange' && "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
                          tagColor === 'yellow' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
                          tagColor === 'green' && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
                          tagColor === 'blue' && "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
                          tagColor === 'purple' && "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
                          !tagColor && "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                        )}
                      >
                        {tag.toUpperCase()}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Balance Flow Card */}
            <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-background dark:to-background shadow-md rounded-2xl p-5 flex-1 min-w-[250px] text-gray-900 dark:text-gray-100 border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium">Transaction Flows</span>
              </div>
              <div className="text-lg font-bold mb-1">{satsToBTC(summary?.balance || 0)} <span className="text-xs font-semibold">BTC</span></div>
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                  <span className="flex items-center gap-1 font-medium text-xs"><TrendingUp className="w-3 h-3" /> Received</span>
                  <span className="font-bold text-xs">{satsToBTC(summary?.total_received || 0)} BTC</span>
                </div>
                <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  <span className="flex items-center gap-1 font-medium text-xs"><TrendingDown className="w-3 h-3" /> Spent</span>
                  <span className="font-bold text-xs">{satsToBTC(summary?.total_spent || 0)} BTC</span>
                </div>
              </div>
            </div>

            {/* Activity Timeline Card */}
            <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-background dark:to-background shadow-md rounded-2xl p-6 flex-1 min-w-[250px] text-gray-900 dark:text-gray-100 border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
              <div className="flex items-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium">Blockchain Activity</span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-background rounded">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">First Block</span>
                  <span className="font-bold text-xs">{blockStats.firstBlock ? blockStats.firstBlock.blockNumber.toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-background rounded">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">Last Block</span>
                  <span className="font-bold text-xs">{blockStats.lastBlock ? blockStats.lastBlock.blockNumber.toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-background rounded">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">Script Type</span>
                  <span className="font-bold text-xs">{addrData?.script_type || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Risk Score Card */}
            <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-background dark:to-background shadow-md rounded-2xl p-5 flex-1 min-w-[200px] text-gray-900 dark:text-gray-100 items-center border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium">Risk Assessment</span>
              </div>
              <div className="flex flex-col items-center justify-center flex-1">
                {isLoadingRiskScore ? (
                  <div className="text-orange-500 font-semibold text-sm">Loading...</div>
                ) : riskScore ? (
                  <div className="flex flex-col items-center cursor-pointer" onClick={onRiskScoreClick}>
                    <div className="flex items-center gap-1 mb-1">
                      {getRiskIcon(riskScore.overallRisk * 100)}
                      <span className="text-xl font-extrabold" style={{ color: getRiskColor(riskScore.overallRisk * 100) }}>{Math.round(riskScore.overallRisk * 100)}%</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 underline cursor-pointer hover:text-orange-600 dark:hover:text-orange-400">View Details</span>
                    
                    {/* BO Override Information */}
                    {riskScore.boInfo?.isBeneficialOwnerOverride && (
                      <div className="mt-2 text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Risk from Beneficial Owner:
                        </div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {riskScore.boInfo.entityName}
                        </div>
                        {riskScore.boInfo.ofac && (
                          <div className="mt-1">
                            <Tag color="red" className="text-xs">OFAC SANCTIONED</Tag>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 font-semibold text-sm">N/A</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attribution Section - sticky */}
      {address && attributions[address] && (
        <div className="sticky top-[65px] w-full z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <AddressAttributionEntities address={address} />
        </div>
      )}
    </>
  );
};

export default AddressSummary; 