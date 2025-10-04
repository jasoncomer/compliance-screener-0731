/**
 * Node positioning utilities for FlowTrace graph layout
 * Handles spatial arrangement of nodes when expanding the graph
 */

import { FTConnection, FTNode } from '../components/NetworkGraph';

export interface PositioningConfig {
  horizontalSpacing: number;
  verticalSpacing: number;
  defaultX: number;
  defaultY: number;
}

const DEFAULT_CONFIG: PositioningConfig = {
  horizontalSpacing: 220,
  verticalSpacing: 80,
  defaultX: 300,
  defaultY: 240,
};

/**
 * Categorizes addresses by their relationship to a base node
 *
 * @param addresses - Unique addresses to categorize
 * @param connections - All connections involving these addresses
 * @param baseNodeId - ID of the base node
 * @returns Object with input and output address arrays
 */
export const categorizeAddressesByDirection = (
  addresses: string[],
  connections: Map<string, FTConnection[]>,
  baseNodeId: string
): { inputAddresses: string[]; outputAddresses: string[] } => {
  const inputAddresses: string[] = [];
  const outputAddresses: string[] = [];

  addresses.forEach(addr => {
    const addrConnections = connections.get(addr) || [];
    const hasIncoming = addrConnections.some(conn => conn.to === baseNodeId);
    const hasOutgoing = addrConnections.some(conn => conn.from === baseNodeId);

    if (hasIncoming && !inputAddresses.includes(addr)) {
      inputAddresses.push(addr);
    }
    if (hasOutgoing && !outputAddresses.includes(addr)) {
      outputAddresses.push(addr);
    }
  });

  return { inputAddresses, outputAddresses };
};

/**
 * Calculates position for a node relative to a base node
 *
 * @param index - Index in the array of nodes to position
 * @param totalNodes - Total number of nodes to position
 * @param baseX - X coordinate of base node
 * @param baseY - Y coordinate of base node
 * @param isInput - True if positioning input nodes (left), false for output (right)
 * @param config - Positioning configuration
 * @returns Object with x and y coordinates
 */
export const calculateRelativePosition = (
  index: number,
  totalNodes: number,
  baseX: number,
  baseY: number,
  isInput: boolean,
  config: PositioningConfig = DEFAULT_CONFIG
): { x: number; y: number } => {
  // Center vertically around the base node
  const y = baseY + (index - (totalNodes - 1) / 2) * config.verticalSpacing;

  // Position on left (input) or right (output)
  const x = isInput
    ? baseX - config.horizontalSpacing
    : baseX + config.horizontalSpacing;

  return { x, y };
};

/**
 * Creates new nodes positioned relative to a base node
 *
 * @param addresses - Addresses to create nodes for
 * @param baseNode - Base node to position relative to
 * @param existingNodeIds - Set of existing node IDs to avoid duplicates
 * @param entityDataMap - Map of address to entity data
 * @param isInput - True for input nodes (left), false for output (right)
 * @param config - Positioning configuration
 * @returns Array of new FTNodes
 */
export const createPositionedNodes = (
  addresses: string[],
  baseNode: FTNode | undefined,
  existingNodeIds: Set<string>,
  entityDataMap: Map<string, {
    entityName?: string;
    entityId?: string;
    entityType?: string;
    logoUrl?: string;
  }>,
  isInput: boolean,
  config: PositioningConfig = DEFAULT_CONFIG
): FTNode[] => {
  const baseX = baseNode?.x ?? config.defaultX;
  const baseY = baseNode?.y ?? config.defaultY;
  const newNodes: FTNode[] = [];

  addresses.forEach((addr, i) => {
    if (!existingNodeIds.has(addr)) {
      const { x, y } = calculateRelativePosition(
        i,
        addresses.length,
        baseX,
        baseY,
        isInput,
        config
      );

      const entityData = entityDataMap.get(addr);
      const resolvedLabel = entityData?.entityName || addr;
      const resolvedEntityType = entityData?.entityType || 'wallet';

      newNodes.push({
        id: addr,
        label: resolvedLabel,
        x,
        y,
        type: resolvedEntityType,
        entityId: entityData?.entityId,
        entityType: entityData?.entityType,
        logoUrl: entityData?.logoUrl,
        risk: 0, // Initialize with 0, will be updated when profile is fetched
      });
    }
  });

  return newNodes;
};

/**
 * Positions all new nodes from connection expansion
 *
 * @param baseNodeId - ID of node being expanded
 * @param existingNodes - Current nodes in the graph
 * @param addressConnections - Map of address to their connections
 * @param entityDataMap - Map of address to entity data
 * @param config - Positioning configuration
 * @returns Array of new positioned nodes
 */
export const positionNodesFromExpansion = (
  baseNodeId: string,
  existingNodes: FTNode[],
  addressConnections: Map<string, FTConnection[]>,
  entityDataMap: Map<string, {
    entityName?: string;
    entityId?: string;
    entityType?: string;
    logoUrl?: string;
  }>,
  config: PositioningConfig = DEFAULT_CONFIG
): FTNode[] => {
  const existingIds = new Set(existingNodes.map(n => n.id));
  const baseNode = existingNodes.find(n => n.id === baseNodeId);

  // Get unique addresses from the addressConnections map
  const uniqueAddresses = Array.from(addressConnections.keys());

  // Categorize by direction
  const { inputAddresses, outputAddresses } = categorizeAddressesByDirection(
    uniqueAddresses,
    addressConnections,
    baseNodeId
  );

  // Create positioned nodes for inputs (left side)
  const inputNodes = createPositionedNodes(
    inputAddresses,
    baseNode,
    existingIds,
    entityDataMap,
    true, // isInput
    config
  );

  // Create positioned nodes for outputs (right side)
  const outputNodes = createPositionedNodes(
    outputAddresses,
    baseNode,
    existingIds,
    entityDataMap,
    false, // isInput
    config
  );

  return [...inputNodes, ...outputNodes];
};

/**
 * Calculates optimal spacing based on number of nodes
 *
 * @param nodeCount - Number of nodes to space
 * @param minSpacing - Minimum spacing between nodes
 * @param maxSpacing - Maximum spacing between nodes
 * @returns Calculated spacing value
 */
export const calculateOptimalSpacing = (
  nodeCount: number,
  minSpacing: number = 60,
  maxSpacing: number = 100
): number => {
  // More nodes = tighter spacing
  if (nodeCount <= 3) return maxSpacing;
  if (nodeCount <= 6) return 80;
  if (nodeCount <= 10) return 70;
  return minSpacing;
};