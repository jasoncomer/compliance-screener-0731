/**
 * Connection management hook for FlowTrace
 * Handles connection aggregation, expansion, and UTXO mode changes
 */

import { useCallback } from 'react';

import { FTConnection } from '../components/NetworkGraph';
import {
  aggregateConnections,
  expandAggregatedConnections,
  utxoExists,
} from '../lib/connectionUtils';
import { NodeExpansionPayload,processNodeExpansion } from '../lib/nodeExpansionLogic';

import { FlowTraceState, FlowTraceStateActions } from './useFlowTraceState';

interface UseConnectionManagementParams {
  state: FlowTraceState;
  actions: FlowTraceStateActions;
  prefetchProfilesAndLogos: (addresses: string[]) => Promise<void>;
  prefetchRiskScores: (addresses: string[]) => Promise<void>;
}

export const useConnectionManagement = ({
  state,
  actions,
  prefetchProfilesAndLogos,
  prefetchRiskScores,
}: UseConnectionManagementParams) => {

  /**
   * Adds new connections with proper aggregation based on UTXO mode
   */
  const handleAddConnections = useCallback((newConnections: FTConnection[]) => {
    actions.setConnections(prev => {
      let updatedConnections = [...prev];

      newConnections.forEach(newConnection => {
        // First check if this exact UTXO already exists (by utxoKey)
        if (newConnection.utxoKey && utxoExists(updatedConnections, newConnection.utxoKey)) {
          return; // Skip if this UTXO already exists
        }

        // Check if there are existing connections between the same nodes
        const existingIndividualConnections = updatedConnections.filter(conn =>
          conn.from === newConnection.from && conn.to === newConnection.to && !conn.isAggregated
        );

        const existingAggregatedConnection = updatedConnections.find(conn =>
          conn.from === newConnection.from && conn.to === newConnection.to && conn.isAggregated
        );

        if (state.utxoCollapseMode === 'aggregated' && (existingIndividualConnections.length > 0 || existingAggregatedConnection)) {
          // There are existing connections, create or update an aggregated connection
          let allConnections = [...existingIndividualConnections, newConnection];

          // If there's already an aggregated connection, include its original connections
          if (existingAggregatedConnection && existingAggregatedConnection.originalConnections) {
            allConnections = [...existingAggregatedConnection.originalConnections, newConnection];
          }

          // Calculate totals
          const totalAmount = allConnections.reduce((sum, conn) =>
            sum + parseFloat(conn.amount || '0'), 0
          );

          // Create aggregated connection
          const aggregatedConnection: FTConnection = {
            ...newConnection,
            amount: totalAmount.toFixed(8),
            txHash: allConnections.map(c => c.txHash).join(","),
            txid: allConnections.map(c => c.txid).filter(Boolean).join(","),
            isAggregated: true,
            utxoCount: allConnections.length,
            originalConnections: allConnections,
            groupId: `${newConnection.from}-${newConnection.to}`,
            _aggregatedText: {
              amount: totalAmount.toFixed(8),
              count: allConnections.length,
              currency: newConnection.currency
            }
          };

          // Remove individual connections and add aggregated one
          updatedConnections = updatedConnections.filter(conn =>
            !(conn.from === newConnection.from && conn.to === newConnection.to)
          ).concat([aggregatedConnection]);
        } else {
          // If in individual mode or no existing, just add
          updatedConnections.push(newConnection);
        }
      });

      return updatedConnections;
    });
  }, [state.utxoCollapseMode, actions]);

  /**
   * Processes existing connections when UTXO mode changes
   */
  const processConnectionsForMode = useCallback((mode: "aggregated" | "individual") => {
    actions.setConnections(prev => {
      if (mode === "individual") {
        return expandAggregatedConnections(prev);
      } else {
        return aggregateConnections(prev);
      }
    });
  }, [actions]);

  /**
   * Handles node expansion - main callback for adding transactions
   */
  const onAdd = useCallback((payload: NodeExpansionPayload) => {
    // Process the expansion using extracted logic
    const { newNodes, newConnections, addressesToPrefetch } = processNodeExpansion(
      payload,
      state.nodes,
      state.connections
    );

    // Add new nodes to the graph
    if (newNodes.length > 0) {
      actions.setNodes(prev => [...prev, ...newNodes]);
    }

    // Add new connections using aggregation logic
    handleAddConnections(newConnections);

    // Fetch entity profiles and logos for all involved addresses (non-blocking)
    if (addressesToPrefetch.size > 0) {
      prefetchProfilesAndLogos(Array.from(addressesToPrefetch).filter(Boolean));
      prefetchRiskScores(Array.from(addressesToPrefetch).filter(Boolean));
    }
  }, [state.nodes, state.connections, actions, handleAddConnections, prefetchProfilesAndLogos, prefetchRiskScores]);

  return {
    handleAddConnections,
    processConnectionsForMode,
    onAdd,
  };
};