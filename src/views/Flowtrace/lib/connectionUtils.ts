/**
 * Connection utility functions for FlowTrace
 * Handles connection merging, aggregation, and filtering
 */

import { FTConnection } from '../components/NetworkGraph';
import { generateConnectionKey } from '../utils/utxoKeyGeneration';

/**
 * Merges duplicate edges using connection keys
 * Locked connections take precedence over unlocked ones
 *
 * @param existing - Existing connections
 * @param incoming - New connections to merge
 * @returns Merged array with no duplicates
 */
export const mergeEdges = (existing: FTConnection[], incoming: FTConnection[]): FTConnection[] => {
  const map = new Map<string, FTConnection>();

  // Use the same key format as generateConnectionKey: from:to:utxo:amount
  const edgeKey = (e: FTConnection) => generateConnectionKey(e);

  const addEdge = (edge: FTConnection) => {
    const k = edgeKey(edge);
    if (map.has(k)) {
      const existingEdge = map.get(k)!;

      // If existing edge is locked, never replace it
      if (existingEdge.locked) {
        return;
      }

      // If incoming edge is locked, replace the existing one
      if (edge.locked) {
        map.set(k, { ...edge });
        return;
      }

      // Neither is locked, keep existing (should not happen with proper keys)
      return;
    } else {
      map.set(k, { ...edge });
    }
  };

  // Add existing connections first (they may be locked)
  existing.forEach(addEdge);
  // Then add incoming connections (they may override unlocked existing ones)
  incoming.forEach(addEdge);

  return Array.from(map.values());
};

/**
 * Groups connections by from-to pair
 *
 * @param connections - Connections to group
 * @returns Map of group key to connections array
 */
export const groupConnectionsByDirection = (
  connections: FTConnection[]
): Map<string, FTConnection[]> => {
  const groups = new Map<string, FTConnection[]>();

  connections.forEach(conn => {
    if (!conn.isAggregated) {
      const groupKey = `${conn.from}|${conn.to}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(conn);
    }
  });

  return groups;
};

/**
 * Creates an aggregated connection from multiple individual connections
 *
 * @param connections - Individual connections to aggregate
 * @param groupKey - Group identifier
 * @returns Aggregated connection
 */
export const createAggregatedConnection = (
  connections: FTConnection[],
  groupKey: string
): FTConnection => {
  if (connections.length === 0) {
    throw new Error('Cannot create aggregated connection from empty array');
  }

  const firstConn = connections[0];
  const totalAmount = connections.reduce((sum, conn) =>
    sum + parseFloat(conn.amount || '0'), 0
  );

  return {
    ...firstConn,
    amount: totalAmount.toFixed(8),
    txHash: connections.map(c => c.txHash).join(","),
    txid: connections.map(c => c.txid).filter(Boolean).join(","),
    isAggregated: true,
    utxoCount: connections.length,
    originalConnections: connections,
    groupId: groupKey,
    _aggregatedText: {
      amount: totalAmount.toFixed(8),
      count: connections.length,
      currency: firstConn.currency
    }
  };
};

/**
 * Expands aggregated connections back to individual ones
 *
 * @param connections - Connections that may include aggregated ones
 * @returns Array with all aggregated connections expanded
 */
export const expandAggregatedConnections = (connections: FTConnection[]): FTConnection[] => {
  const expandedConnections: FTConnection[] = [];

  connections.forEach(conn => {
    if (conn.isAggregated && conn.originalConnections) {
      // Add all original individual connections
      expandedConnections.push(...conn.originalConnections);
    } else {
      // Keep non-aggregated connections as-is
      expandedConnections.push(conn);
    }
  });

  return expandedConnections;
};

/**
 * Aggregates individual connections by from-to pairs
 *
 * @param connections - Connections to aggregate
 * @returns Array with individual connections aggregated where applicable
 */
export const aggregateConnections = (connections: FTConnection[]): FTConnection[] => {
  const connectionGroups = groupConnectionsByDirection(
    connections.filter(c => !c.isAggregated)
  );
  const alreadyAggregated = connections.filter(c => c.isAggregated);
  const processedConnections: FTConnection[] = [...alreadyAggregated];

  connectionGroups.forEach((groupConnections, groupKey) => {
    if (groupConnections.length > 1) {
      // Create aggregated connection
      processedConnections.push(createAggregatedConnection(groupConnections, groupKey));
    } else {
      // Keep single connections as-is
      processedConnections.push(...groupConnections);
    }
  });

  return processedConnections;
};

/**
 * Checks if a UTXO already exists in the connections
 *
 * @param connections - Existing connections to check
 * @param utxoKey - UTXO key to search for
 * @returns True if UTXO exists
 */
export const utxoExists = (connections: FTConnection[], utxoKey: string): boolean => {
  return connections.some(conn => {
    // Check direct match
    if (conn.utxoKey === utxoKey) return true;

    // Check if it's in an aggregated connection's originalConnections
    if (conn.isAggregated && conn.originalConnections) {
      return conn.originalConnections.some(origConn => origConn.utxoKey === utxoKey);
    }

    return false;
  });
};

/**
 * Filters connections by node involvement
 *
 * @param connections - All connections
 * @param nodeId - Node ID to filter by
 * @returns Connections involving the specified node
 */
export const filterConnectionsByNode = (
  connections: FTConnection[],
  nodeId: string
): FTConnection[] => {
  return connections.filter(conn => conn.from === nodeId || conn.to === nodeId);
};

/**
 * Removes connections involving a specific node
 *
 * @param connections - All connections
 * @param nodeId - Node ID to remove connections for
 * @returns Connections not involving the specified node
 */
export const removeConnectionsForNode = (
  connections: FTConnection[],
  nodeId: string
): FTConnection[] => {
  return connections.filter(conn => conn.from !== nodeId && conn.to !== nodeId);
};