/**
 * FlowTrace data fetching hook (Refactored to use React Query)
 * Uses React Query for caching and the existing API endpoints
 */

import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useAttribution } from '@/context/AttributionContext';
import { flowtraceQueryKeys } from '@/hooks/useFlowtraceQueries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSOT } from '@/store/slices/sotSlice';
import { getBlockchainType } from '@/utils/addressValidation';
import { applyBeneficialOwnerOverride } from '@/utils/entityUtils';

import { FTNode } from '../components/NetworkGraph';

import { FlowTraceStateActions } from './useFlowTraceState';

interface UseFlowTraceDataParams {
  actions: FlowTraceStateActions;
}

export const useFlowTraceData = ({ actions }: UseFlowTraceDataParams) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { itemsMap } = useAppSelector((state) => state.sot);
  const { fetchAttributions, attributions } = useAttribution();

  /**
   * Fetches and sets left panel data for an address using React Query
   */
  const fetchAndSetLeftPanelData = useCallback(async (address: string) => {
    actions.setIsLeftPanelLoading(true);
    try {
      // Fetch data using React Query (will use cache if available)
      const nodeData = await queryClient.fetchQuery({
        queryKey: flowtraceQueryKeys.address(address),
        queryFn: async () => {
          // Trigger all queries in parallel using the composite hook pattern
          const [transactions, summary, riskScore, attribution] = await Promise.all([
            queryClient.fetchQuery({
              queryKey: flowtraceQueryKeys.transactions(address, 1, 50),
              queryFn: async () => {
                const { api } = await import('@/api/api');
                return api.blockchain.getAddressTransactions(address, { page: 1, limit: 50 });
              },
              staleTime: 3 * 60 * 1000,
            }),
            queryClient.fetchQuery({
              queryKey: flowtraceQueryKeys.summary(address),
              queryFn: async () => {
                const { api } = await import('@/api/api');
                return api.blockchain.getAddressSummary(address);
              },
              staleTime: 5 * 60 * 1000,
            }),
            queryClient.fetchQuery({
              queryKey: flowtraceQueryKeys.riskScore(address),
              queryFn: async () => {
                const { api } = await import('@/api/api');
                return api.riskScoring.calculateRiskScore(address, 'address');
              },
              staleTime: 5 * 60 * 1000,
            }).catch(() => null), // Risk score is optional
            queryClient.fetchQuery({
              queryKey: flowtraceQueryKeys.attribution(address),
              queryFn: async () => {
                const { api } = await import('@/api/api');
                return api.blockchain.getBitcoinAttribution(address);
              },
              staleTime: 10 * 60 * 1000,
            }).catch(() => null), // Attribution is optional
          ]);

          return {
            transactions,
            summary,
            riskScore,
            attribution,
          };
        },
        staleTime: 3 * 60 * 1000,
      });

      const { transactions, summary, riskScore, attribution: apiAttribution } = nodeData;

      const summary_data = {
        balance: summary?.balance?.toString() || '0',
        usdValue: summary?.balance || 0,
      };

      // Use client-side resolved entity data from AttributionContext (preferred)
      const attribution = attributions[address] || apiAttribution;
      let profile;

      if (attribution && Object.keys(itemsMap).length > 0) {
        // Use client-side resolution with O(1) hashmap lookup (same as VASP Explorer)
        const entitySOT = itemsMap[attribution.entity];
        const beneficialOwnerSOT = attribution.bo ? itemsMap[attribution.bo] : undefined;

        const override = applyBeneficialOwnerOverride(
          {
            entity: attribution.entity,
            bo: attribution.bo || '',
            custodian: attribution.custodian || '',
            script_type: attribution.script_type,
          },
          entitySOT,
          beneficialOwnerSOT,
          Object.values(itemsMap)
        );

        profile = {
          entityId: attribution.entity,
          entityType: override.entityType || 'wallet',
          properName: override.displayTitle || attribution.entity,
          riskScore: riskScore?.overallRisk ? Math.round(riskScore.overallRisk * 100) : undefined,
          logoUrl: override.logo || null,
          bo: attribution.bo,
          custodian: attribution.custodian,
        };
      } else {
        // Fallback to basic data
        profile = {
          entityId: apiAttribution?.entity,
          entityType: 'wallet',
          properName: apiAttribution?.entity,
          riskScore: riskScore?.overallRisk ? Math.round(riskScore.overallRisk * 100) : undefined,
          logoUrl: null,
          bo: apiAttribution?.bo,
          custodian: apiAttribution?.custodian,
        };
      }

      // Use actual transaction count from the response
      const actualTxCount = transactions?.pagination?.totalTxs || 0;

      // Update left panel data (new unified format with selectionType)
      const leftPanelData = {
        selectionType: 'node' as const,
        address,
        network: getBlockchainType(address) === 'bitcoin' ? 'Bitcoin' : 'Ethereum',
        balance: summary_data.balance,
        txCount: actualTxCount,
        riskScore: profile.riskScore,
        usdValue: summary_data.usdValue,
        selectedEntity: {
          label: profile.properName || profile.entityId || address,
          address,
          entityId: profile.entityId,
          logoUrl: profile.logoUrl,
          type: profile.entityType || 'wallet',
          riskScore: profile.riskScore,
          bo: profile.bo,
          custodian: profile.custodian,
        },
      };

      actions.setLeftPanelData(leftPanelData);

      // Also update the node with risk score data for visualization
      actions.setNodes((prev) =>
        prev.map((n) =>
          n.id === address
            ? {
                ...n,
                risk: profile.riskScore,
                balance: summary_data.balance,
                txCount: actualTxCount,
                usdValue: summary_data.usdValue,
              }
            : n
        )
      );

      return leftPanelData;
    } catch (error) {
      console.error('Error fetching left panel data:', error);
      throw error;
    } finally {
      actions.setIsLeftPanelLoading(false);
    }
  }, [attributions, itemsMap, actions, queryClient]);

  /**
   * Prefetches attribution profile and logos for a list of addresses (non-blocking)
   */
  const prefetchProfilesAndLogos = useCallback(
    async (addresses: string[]) => {
      const unique = Array.from(new Set(addresses.filter(Boolean)));
      if (!unique.length) return;

      // Ensure SOT data is loaded first (same as VASP Explorer pattern)
      if (Object.keys(itemsMap).length === 0) {
        try {
          await dispatch(fetchSOT()).unwrap();
        } catch (error) {
          console.error('Error fetching SOT data:', error);
          return;
        }
      }

      // Fetch attribution data for all addresses at once (uses AttributionContext)
      try {
        await fetchAttributions(unique);
      } catch (error) {
        console.error('Error fetching attributions:', error);
      }
    },
    [itemsMap, dispatch, fetchAttributions]
  );

  /**
   * Fetches risk scores for newly added nodes (non-blocking)
   * Uses React Query to avoid duplicate requests
   */
  const prefetchRiskScores = useCallback(
    async (addresses: string[]) => {
      const unique = Array.from(new Set(addresses.filter(Boolean)));
      if (!unique.length) return;

      // Fetch risk scores for all addresses in parallel using React Query
      const riskScorePromises = unique.map(async (address) => {
        try {
          const riskScore = await queryClient.fetchQuery({
            queryKey: flowtraceQueryKeys.riskScore(address),
            queryFn: async () => {
              const { api } = await import('@/api/api');
              return api.riskScoring.calculateRiskScore(address, 'address');
            },
            staleTime: 5 * 60 * 1000,
          });

          if (riskScore?.overallRisk !== undefined) {
            const normalizedRiskScore = Math.round(riskScore.overallRisk * 100);

            // Apply BO override logic for risk score
            let finalRiskScore = normalizedRiskScore;

            // Check if this address has attribution data and BO override
            const attribution = attributions[address];

            // Only apply BO override if we have attribution data and SOT data
            if (
              attribution &&
              attribution.bo &&
              attribution.bo !== attribution.entity &&
              Object.keys(itemsMap).length > 0
            ) {
              const entitySOT = itemsMap[attribution.entity];
              const beneficialOwnerSOT = itemsMap[attribution.bo];

              if (beneficialOwnerSOT) {
                // Apply BO override logic
                const override = applyBeneficialOwnerOverride(
                  {
                    entity: attribution.entity,
                    bo: attribution.bo || '',
                    custodian: attribution.custodian || '',
                    script_type: attribution.script_type,
                  },
                  entitySOT,
                  beneficialOwnerSOT,
                  { [address]: riskScore },
                  address
                );

                finalRiskScore = override.riskScore || normalizedRiskScore;
              }
            }

            // Update the node with the risk score (BO override applied)
            actions.setNodes((prev: FTNode[]) =>
              prev.map((node) =>
                node.id === address ? { ...node, risk: finalRiskScore } : node
              )
            );

            return { address, riskScore: finalRiskScore };
          }
        } catch (error) {
          console.error(`Error fetching risk score for ${address}:`, error);
        }
        return null;
      });

      try {
        await Promise.all(riskScorePromises);
      } catch (error) {
        console.error('Error fetching risk scores:', error);
      }
    },
    [attributions, itemsMap, actions, queryClient]
  );

  /**
   * Fetches aggregated node data for display in LeftPanel
   * Aggregates data from multiple member addresses
   */
  const fetchAggregatedNodeData = useCallback(async (
    aggregatedNode: FTNode,
    memberNodes: FTNode[],
    internalConnections: any[],
    externalConnections: any[]
  ) => {
    try {
      // Calculate aggregated metrics
      const memberAddresses = memberNodes.map(n => n.id);

      // Aggregate balance
      const totalBalance = memberNodes.reduce((sum, node) => {
        const balance = typeof node.balance === 'string' ? parseFloat(node.balance) : (node.balance || 0);
        return sum + balance;
      }, 0);

      // Aggregate transaction count
      const totalTxCount = memberNodes.reduce((sum, node) => sum + (node.txCount || 0), 0);

      // Calculate weighted average risk score
      let totalRisk = 0;
      let riskCount = 0;
      memberNodes.forEach(node => {
        if (typeof node.risk === 'number') {
          totalRisk += node.risk;
          riskCount++;
        }
      });
      const aggregatedRiskScore = riskCount > 0 ? Math.round(totalRisk / riskCount) : undefined;

      // Get entity information from aggregated node
      const entityId = aggregatedNode.entityId;
      const entitySOT = entityId ? itemsMap[entityId] : undefined;

      // Check for OFAC sanctioning - handle both SOT and SOTV2
      const isOfac = entitySOT && 'entity_tags' in entitySOT && Array.isArray(entitySOT.entity_tags)
        ? entitySOT.entity_tags.includes('ofac sanctioned')
        : false;
      const entityTags = entitySOT && 'entity_tags' in entitySOT && Array.isArray(entitySOT.entity_tags)
        ? entitySOT.entity_tags
        : undefined;

      return {
        selectionType: 'aggregated' as const,
        aggregatedNode,
        memberNodes,
        memberAddresses,
        totalBalance: totalBalance.toString(),
        totalTxCount,
        aggregatedRiskScore,
        internalConnections,
        externalConnections,
        selectedEntity: {
          label: aggregatedNode.label || 'Aggregated Entity',
          entityId: aggregatedNode.entityId,
          logoUrl: aggregatedNode.logoUrl,
          type: aggregatedNode.entityType || 'cluster',
          riskScore: aggregatedRiskScore,
          ofac: isOfac,
          entityTags
        },
        network: 'Bitcoin'
      };
    } catch (error) {
      console.error('Error fetching aggregated node data:', error);
      return null;
    }
  }, [itemsMap]);

  return {
    fetchAndSetLeftPanelData,
    fetchAggregatedNodeData,
    prefetchProfilesAndLogos,
    prefetchRiskScores,
    attributions,
    itemsMap,
  };
};
