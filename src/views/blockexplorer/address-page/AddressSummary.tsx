import React from 'react';

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bitcoin,
  CheckCircle,
  Clock,
  Copy,
  Hash,
  Shield,
  Wallet,
  XCircle
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { colors } from '@/design-system/tokens'
import { cn } from '@/lib/utils';

import { SimpleLogo } from '../../../components/common/Logo';
import { SOT } from '../../../typings/interfaces';
import { IAttributionMap } from '../../../typings/ReferenceAttribution';
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
  attributions: IAttributionMap;
  getEntityTags: (entityId: string) => string[];
  getTagColor: (tag: string) => string;
  itemsMap: Record<string, SOT>;
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
      {/* Main Cards - Modern Minimalistic Design */}
      <div className="flex flex-wrap gap-4 justify-start">
        {/* Address Card */}
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[280px] text-gray-900 dark:text-gray-100 relative border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="absolute top-4 right-4">
            <Wallet className="w-5 h-5 text-gray-300 dark:text-gray-700" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            {address && attributions[address]?.entity ? (
              <SimpleLogo
                entityId={attributions[address].entity}
                entityType={getEntityType()}
                size="small"
                shape="circle"
              />
            ) : (
              <div className="p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                <Bitcoin className="w-5 h-5 text-orange-500" />
              </div>
            )}
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Address</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{truncateAddress(address || '')}</span>
                <button
                  onClick={onCopyClick}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Copy full address"
                >
                  {copySuccess ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>
          <div className="text-xl font-semibold mb-3">{getDisplayName()}</div>

          {/* Entity Type */}
          {address && attributions[address]?.entity && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Entity Type</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getEntityType()}
              </div>
            </div>
          )}

          {/* Tags section */}
          <div className="flex items-start gap-2 mt-auto">
            <div className="flex gap-2 flex-wrap">
              {address && attributions[address] && getEntityTags(attributions[address]?.entity || '').slice(0, 5).map(tag => {
                const tagColor = getTagColor(tag.toLowerCase());
                return (
                  <Badge
                    key={tag}
                    className={cn(
                      "text-xs px-2.5 py-0.5 font-medium",
                      tagColor === 'red' && "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
                      tagColor === 'orange' && "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800",
                      tagColor === 'yellow' && "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
                      tagColor === 'green' && "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
                      tagColor === 'blue' && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                      tagColor === 'purple' && "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800",
                      !tagColor && "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
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
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[280px] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</div>
                <div className="text-2xl font-bold">{satsToBTC(summary?.balance || 0)} <span className="text-sm font-normal text-gray-500">BTC</span></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-auto">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Received</span>
              </div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">{satsToBTC(summary?.total_received || 0)} BTC</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Spent</span>
              </div>
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">{satsToBTC(summary?.total_spent || 0)} BTC</span>
            </div>
          </div>
        </div>

        {/* Activity Timeline Card */}
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[280px] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activity Timeline</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">First Block</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{blockStats.firstBlock ? blockStats.firstBlock.blockNumber.toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Block</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{blockStats.lastBlock ? blockStats.lastBlock.blockNumber.toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Script Type</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{addrData?.script_type || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Risk Score Card */}
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[240px] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
              <Shield className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk Assessment</div>
          </div>
          <div className="flex flex-col items-center justify-center flex-1">
            {isLoadingRiskScore ? (
              <div className="text-gray-400 font-medium text-sm animate-pulse">Analyzing...</div>
            ) : riskScore ? (
              <div className="flex flex-col items-center cursor-pointer group" onClick={onRiskScoreClick}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800">
                    {getRiskIcon(riskScore.overallRisk * 100)}
                  </div>
                  <span className="text-3xl font-bold" style={{ color: getRiskColor(riskScore.overallRisk * 100) }}>{Math.round(riskScore.overallRisk * 100)}%</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">View Details →</span>

                {/* BO Override Information */}
                {riskScore.boInfo?.isBeneficialOwnerOverride && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center w-full">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Risk from Beneficial Owner
                    </div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {riskScore.boInfo.entityName}
                    </div>
                    {riskScore.boInfo.ofac && (
                      <div className="mt-2">
                        <Badge variant="destructive" className="text-xs px-2 py-0.5">OFAC SANCTIONED</Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-800 mb-2">
                  <Shield className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                </div>
                <div className="text-gray-400 font-medium text-sm">Not Available</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attribution Section - sticky */}
      {address && attributions[address] && (
        <div className="sticky top-[60px] z-10 my-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <AddressAttributionEntities address={address} />
        </div>
      )}
    </>
  );
};

export default AddressSummary; 