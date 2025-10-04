/**
 * Node expansion logic for FlowTrace
 * Handles processing of selected transactions and creation of nodes/connections
 */

import { FTConnection, FTNode } from '../components/NetworkGraph';
import { generateUTXOKey } from '../utils/utxoKeyGeneration';

import { utxoExists } from './connectionUtils';
import { positionNodesFromExpansion } from './nodePositioning';

export interface EnhancedTransaction {
  direction: 'in' | 'out';
  counterpartyAddress?: string;
  originalTxHash?: string;
  txid: string;
  originalInputIndex?: number;
  originalOutputIndex?: number;
  inputs?: Array<{ intxid_n?: number; addr?: string; amt?: number }>;
  outputs?: Array<{ n?: number; addr?: string; amt?: number }>;
  amount?: string;
  currency?: string;
  time?: number;
  usdValue?: string;
  entityName?: string;
  entityId?: string;
  entityType?: string;
  logo?: string;
}

export interface NodeExpansionPayload {
  address: string;
  selectedTxs: EnhancedTransaction[];
}

export interface NodeExpansionResult {
  newNodes: FTNode[];
  newConnections: FTConnection[];
  addressesToPrefetch: Set<string>;
}

/**
 * Extracts entity data from a transaction
 *
 * @param tx - Enhanced transaction
 * @returns Entity data object
 */
const extractEntityData = (tx: EnhancedTransaction) => {
  return {
    entityName: tx.entityName,
    entityId: tx.entityId,
    entityType: tx.entityType,
    logoUrl: tx.logo,
  };
};

/**
 * Creates a connection from an input transaction
 *
 * @param tx - Enhanced transaction with direction 'in'
 * @param address - Current address being expanded
 * @param existingConnections - Existing connections to check for duplicates
 * @returns Connection or null if duplicate/invalid
 */
const createInputConnection = (
  tx: EnhancedTransaction,
  address: string,
  existingConnections: FTConnection[]
): FTConnection | null => {
  const inputAddress = tx.counterpartyAddress || tx.inputs?.[0]?.addr;
  if (!inputAddress) return null;

  const utxoKey = generateUTXOKey({
    originalTxHash: tx.originalTxHash,
    txid: tx.txid,
    originalInputIndex: tx.originalInputIndex,
    originalOutputIndex: tx.originalOutputIndex,
    inputs: tx.inputs,
    outputs: tx.outputs,
    sourceAddress: inputAddress,
    destinationAddress: address,
    amount: tx.amount,
  });

  // Check if this UTXO already exists
  if (utxoExists(existingConnections, utxoKey)) {
    return null;
  }

  return {
    from: inputAddress,
    to: address,
    amount: tx.amount || '0',
    currency: tx.currency || 'BTC',
    date: tx.time ? new Date(tx.time * 1000).toISOString() : new Date().toISOString(),
    txHash: tx.originalTxHash || tx.txid,
    txid: tx.txid,
    utxoKey,
    type: 'in',
    usdValue: tx.usdValue,
    locked: true, // Mark as locked to prevent any future modifications
  };
};

/**
 * Creates a connection from an output transaction
 *
 * @param tx - Enhanced transaction with direction 'out'
 * @param address - Current address being expanded
 * @param existingConnections - Existing connections to check for duplicates
 * @returns Connection or null if duplicate/invalid
 */
const createOutputConnection = (
  tx: EnhancedTransaction,
  address: string,
  existingConnections: FTConnection[]
): FTConnection | null => {
  const outputAddress = tx.counterpartyAddress || tx.outputs?.[0]?.addr;
  if (!outputAddress) return null;

  const utxoKey = generateUTXOKey({
    originalTxHash: tx.originalTxHash,
    txid: tx.txid,
    originalInputIndex: tx.originalInputIndex,
    originalOutputIndex: tx.originalOutputIndex,
    inputs: tx.inputs,
    outputs: tx.outputs,
    sourceAddress: address,
    destinationAddress: outputAddress,
    amount: tx.amount,
  });

  // Check if this UTXO already exists
  if (utxoExists(existingConnections, utxoKey)) {
    return null;
  }

  return {
    from: address,
    to: outputAddress,
    amount: tx.amount || '0',
    currency: tx.currency || 'BTC',
    date: tx.time ? new Date(tx.time * 1000).toISOString() : new Date().toISOString(),
    txHash: tx.originalTxHash || tx.txid,
    txid: tx.txid,
    utxoKey,
    type: 'out',
    usdValue: tx.usdValue,
    locked: true, // Mark as locked to prevent any future modifications
  };
};

/**
 * Processes transactions and creates connections with entity data
 *
 * @param selectedTxs - Selected transactions to process
 * @param address - Address being expanded
 * @param existingConnections - Existing connections to check for duplicates
 * @returns Object with new connections, address connections map, and entity data
 */
const processTransactions = (
  selectedTxs: EnhancedTransaction[],
  address: string,
  existingConnections: FTConnection[]
): {
  newConnections: FTConnection[];
  addressConnections: Map<string, FTConnection[]>;
  addressEntityData: Map<string, ReturnType<typeof extractEntityData>>;
} => {
  const newConnections: FTConnection[] = [];
  const addressConnections = new Map<string, FTConnection[]>();
  const addressEntityData = new Map<string, ReturnType<typeof extractEntityData>>();

  selectedTxs.forEach((tx: EnhancedTransaction) => {
    let connection: FTConnection | null = null;
    let counterparty: string | null = null;

    if (tx.direction === 'in') {
      connection = createInputConnection(tx, address, existingConnections);
      counterparty = tx.counterpartyAddress || tx.inputs?.[0]?.addr || null;
    } else if (tx.direction === 'out') {
      connection = createOutputConnection(tx, address, existingConnections);
      counterparty = tx.counterpartyAddress || tx.outputs?.[0]?.addr || null;
    }

    if (!connection || !counterparty) return;

    // Store entity data for the counterparty - prioritize transaction-level attribution
    if (tx.entityName || tx.entityId || tx.entityType || tx.logo) {
      const existing = addressEntityData.get(counterparty);
      // Only set if we don't already have data, or if the new data is more specific
      if (!existing || (tx.entityId && !existing.entityId)) {
        addressEntityData.set(counterparty, extractEntityData(tx));
      }
    }

    // Group connections by counterparty address
    if (!addressConnections.has(counterparty)) {
      addressConnections.set(counterparty, []);
    }
    addressConnections.get(counterparty)!.push(connection);
    newConnections.push(connection);
  });

  return { newConnections, addressConnections, addressEntityData };
};

/**
 * Main function to process node expansion
 * Converts selected transactions into new nodes and connections
 *
 * @param payload - Expansion payload with address and selected transactions
 * @param existingNodes - Current nodes in the graph
 * @param existingConnections - Current connections in the graph
 * @returns Result with new nodes, connections, and addresses to prefetch
 */
export const processNodeExpansion = (
  payload: NodeExpansionPayload,
  existingNodes: FTNode[],
  existingConnections: FTConnection[]
): NodeExpansionResult => {
  const { selectedTxs, address } = payload;

  // Process transactions to create connections
  const { newConnections, addressConnections, addressEntityData } = processTransactions(
    selectedTxs,
    address,
    existingConnections
  );

  // Create positioned nodes for new addresses
  const newNodes = positionNodesFromExpansion(
    address,
    existingNodes,
    addressConnections,
    addressEntityData
  );

  // Collect addresses to prefetch profiles and risk scores for
  const addressesToPrefetch = new Set<string>(addressConnections.keys());

  return {
    newNodes,
    newConnections,
    addressesToPrefetch,
  };
};

/**
 * Validates transaction selection for expansion
 *
 * @param selectedTxs - Transactions to validate
 * @returns True if selection is valid
 */
export const validateTransactionSelection = (selectedTxs: EnhancedTransaction[]): boolean => {
  if (!selectedTxs || selectedTxs.length === 0) {
    return false;
  }

  // Check that all transactions have required fields
  return selectedTxs.every(tx =>
    tx.direction &&
    tx.txid &&
    (tx.counterpartyAddress || tx.inputs?.[0]?.addr || tx.outputs?.[0]?.addr)
  );
};