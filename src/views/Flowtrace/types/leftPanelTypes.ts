/**
 * Type definitions for LeftPanel data structures
 * Supports three selection types: node, edge, and aggregated node
 */

import { FTConnection, FTNode } from '../components/NetworkGraph';

// Base entity information
export interface EntityInfo {
  label?: string;
  address?: string;
  entityId?: string;
  logoUrl?: string | null;
  type?: string;
  riskScore?: number;
  bo?: string;
  custodian?: string;
  ofac?: boolean;
  entityTags?: string[];
}

// Node selection data (existing structure)
export interface NodePanelData {
  selectionType: 'node';
  address: string;
  network?: string;
  balance?: number | string;
  usdValue?: number | string;
  txCount?: number;
  riskScore?: number;
  selectedEntity?: EntityInfo;
}

// Edge/Connection selection data
export interface EdgePanelData {
  selectionType: 'edge';
  connection: FTConnection;
  fromEntity?: EntityInfo;
  toEntity?: EntityInfo;
  fromNode?: FTNode;
  toNode?: FTNode;
  network?: string;
}

// Aggregated node selection data
export interface AggregatedNodePanelData {
  selectionType: 'aggregated';
  aggregatedNode: FTNode;
  memberNodes: FTNode[];
  memberAddresses: string[];
  totalBalance?: number | string;
  totalUsdValue?: number | string;
  totalTxCount?: number;
  aggregatedRiskScore?: number;
  internalConnections: FTConnection[];
  externalConnections: FTConnection[];
  selectedEntity?: EntityInfo;
  network?: string;
}

// Union type for all panel data types
export type LeftPanelData = NodePanelData | EdgePanelData | AggregatedNodePanelData;

// Type guards
export const isNodePanelData = (data: LeftPanelData): data is NodePanelData => {
  return data.selectionType === 'node';
};

export const isEdgePanelData = (data: LeftPanelData): data is EdgePanelData => {
  return data.selectionType === 'edge';
};

export const isAggregatedNodePanelData = (data: LeftPanelData): data is AggregatedNodePanelData => {
  return data.selectionType === 'aggregated';
};
