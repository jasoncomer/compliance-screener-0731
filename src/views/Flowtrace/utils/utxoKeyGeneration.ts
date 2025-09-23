/**
 * Simplified UTXO key generation utilities
 * Single source of truth for connection matching
 * 
 * Format: {txHash}::{index}::{sourceAddress}::{destAddress}::{amount}
 * - txHash: Transaction hash
 * - index: Input/output index
 * - sourceAddress: Source address (normalized)
 * - destAddress: Destination address (normalized)
 * - amount: Normalized to 8 decimal places
 */

export interface UTXOKeyGenerationInput {
  originalTxHash?: string;
  txid: string;
  direction?: 'in' | 'out';
  originalInputIndex?: number;
  originalOutputIndex?: number;
  inputs?: Array<{ intxid_n?: number; addr?: string; amt?: number }>;
  outputs?: Array<{ n?: number; addr?: string; amt?: number }>;
  address?: string; // Legacy: single address
  sourceAddress?: string; // New: source address
  destinationAddress?: string; // New: destination address
  amount?: string | number;
}

/**
 * Generates a consistent UTXO key for a transaction
 * 
 * @param input - UTXO key generation parameters
 * @returns Normalized UTXO key in format: {txHash}::{index}::{sourceAddress}::{destAddress}::{amount}
 */
export function generateUTXOKey(input: UTXOKeyGenerationInput): string {
  const { 
    originalTxHash, 
    txid, 
    originalInputIndex, 
    originalOutputIndex, 
    inputs, 
    outputs, 
    address,
    sourceAddress,
    destinationAddress,
    amount 
  } = input;
  
  const txHash = originalTxHash || txid;
  if (!txHash) {
    throw new Error('Transaction hash is required for UTXO key generation');
  }
  
  // Determine index (input or output)
  const index = originalInputIndex ?? originalOutputIndex ?? 0;
  
  // Determine source and destination addresses
  let normalizedSourceAddress: string;
  let normalizedDestinationAddress: string;
  
  if (sourceAddress && destinationAddress) {
    // New format: explicit source and destination
    normalizedSourceAddress = normalizeAddress(sourceAddress, inputs, outputs, txHash);
    normalizedDestinationAddress = normalizeAddress(destinationAddress, inputs, outputs, txHash);
  } else if (address) {
    // Legacy format: single address (use as both source and destination)
    const normalizedAddress = normalizeAddress(address, inputs, outputs, txHash);
    normalizedSourceAddress = normalizedAddress;
    normalizedDestinationAddress = normalizedAddress;
  } else {
    throw new Error('Either address (legacy) or both sourceAddress and destinationAddress are required');
  }
  
  // Normalize amount
  const normalizedAmount = normalizeAmount(amount, inputs, outputs);
  
  return `${txHash}::${index}::${normalizedSourceAddress}::${normalizedDestinationAddress}::${normalizedAmount}`;
}

/**
 * Normalizes Bitcoin address for UTXO key generation
 */
function normalizeAddress(
  address?: string, 
  inputs?: Array<{ addr?: string }>, 
  outputs?: Array<{ addr?: string }>,
  txHash?: string
): string {
  if (address) {
    return address.toLowerCase();
  }
  
  const inputAddress = inputs?.[0]?.addr;
  const outputAddress = outputs?.[0]?.addr;
  const utxoAddress = inputAddress || outputAddress;
  
  if (utxoAddress) {
    return utxoAddress.toLowerCase();
  }
  
  // Handle coinbase transactions (mining rewards)
  if (txHash && txHash.includes('coinbase')) {
    return 'coinbase';
  }
  
  return 'unknown';
}

/**
 * Normalizes amount for UTXO key generation
 */
function normalizeAmount(
  amount?: string | number, 
  inputs?: Array<{ amt?: number }>, 
  outputs?: Array<{ amt?: number }>
): string {
  if (amount !== undefined && amount !== null) {
    return Number(amount).toFixed(8);
  }
  
  const inputAmount = inputs?.[0]?.amt;
  const outputAmount = outputs?.[0]?.amt;
  const utxoAmount = inputAmount || outputAmount;
  
  if (utxoAmount !== undefined) {
    return Number(utxoAmount).toFixed(8);
  }
  
  return '0.00000000';
}

/**
 * Extracts addresses from UTXO key
 * 
 * @param utxoKey - UTXO key to extract addresses from
 * @returns object with source and destination addresses, or null if invalid format
 */
export function extractAddressesFromUtxoKey(utxoKey: string): { source: string; destination: string } | null {
  if (!utxoKey || !utxoKey.includes('::')) {
    return null;
  }
  
  const parts = utxoKey.split('::');
  
  // New format: {txHash}::{index}::{sourceAddress}::{destAddress}::{amount}
  if (parts.length >= 5) {
    return {
      source: parts[2],
      destination: parts[3]
    };
  }
  
  // Legacy format: {txHash}::{index}::{address}::{amount}
  if (parts.length >= 3) {
    const address = parts[2];
    return {
      source: address,
      destination: address
    };
  }
  
  return null;
}

/**
 * Generates a connection key in format: source:destination:utxo:amount
 * 
 * @param connection - Connection object
 * @returns connection key string
 */
export function generateConnectionKey(connection: { from?: string; to?: string; utxoKey?: string; amount?: string | number }): string {
  const from = connection.from || '';
  const to = connection.to || '';
  const utxo = connection.utxoKey || '';
  const amount = connection.amount || '0';
  
  return `${from}:${to}:${utxo}:${amount}`;
}

/**
 * SIMPLIFIED: Checks if a connection involves a specific address
 * 
 * Strategy:
 * 1. PRIMARY: Use from/to fields (most reliable for bidirectional matching)
 * 2. FALLBACK: Use utxoKey when from/to are not available
 * 
 * @param connection - Connection object
 * @param address - Address to check for
 * @returns true if connection involves the address
 */
export function connectionInvolvesAddress(connection: { from?: string; to?: string; utxoKey?: string }, address: string): boolean {
  // PRIMARY: Use from/to fields (most reliable for bidirectional matching)
  if (connection.from && connection.to) {
    return connection.from === address || connection.to === address;
  }
  
  // FALLBACK: Use utxoKey when from/to are not available
  if (connection.utxoKey) {
    const addresses = extractAddressesFromUtxoKey(connection.utxoKey);
    if (addresses) {
      return addresses.source === address || addresses.destination === address;
    }
  }
  
  return false;
}

/**
 * Checks if two connections are the same using connection key
 * 
 * @param conn1 - First connection
 * @param conn2 - Second connection
 * @returns true if connections are the same, false otherwise
 */
export function connectionsAreSame(conn1: { from?: string; to?: string; utxoKey?: string; amount?: string | number }, conn2: { from?: string; to?: string; utxoKey?: string; amount?: string | number }): boolean {
  const key1 = generateConnectionKey(conn1);
  const key2 = generateConnectionKey(conn2);
  return key1 === key2;
}

/**
 * Ensures all connections have a connectionKey
 * 
 * @param connections - Array of connections
 * @returns Array of connections with connectionKey populated
 */
export function ensureConnectionKeys(connections: Array<{ from?: string; to?: string; utxoKey?: string; amount?: string | number; connectionKey?: string }>): Array<{ from?: string; to?: string; utxoKey?: string; amount?: string | number; connectionKey: string }> {
  return connections.map(conn => ({
    ...conn,
    connectionKey: conn.connectionKey || generateConnectionKey(conn)
  }));
}

/**
 * SIMPLIFIED: Finds connections that involve a specific address
 * 
 * @param connections - Array of connections to search
 * @param address - Address to find connections for
 * @returns Array of connections that involve the address
 */
export function findConnectionsForAddress<T extends { from?: string; to?: string; utxoKey?: string; connectionKey?: string }>(connections: T[], address: string): T[] {
  return connections.filter(conn => connectionInvolvesAddress(conn, address));
}

/**
 * Validates UTXO key format
 * 
 * @param utxoKey - UTXO key to validate
 * @returns true if valid format, false otherwise
 */
export function validateUTXOKey(utxoKey: string): boolean {
  if (!utxoKey || typeof utxoKey !== 'string') {
    return false;
  }
  
  const parts = utxoKey.split('::');
  
  // New format: {txHash}::{index}::{sourceAddress}::{destAddress}::{amount}
  if (parts.length === 5) {
    const [txHash, index, sourceAddress, destAddress, amount] = parts;
    
    // Validate transaction hash (should be hex characters, typically 64 chars)
    if (!/^[a-fA-F0-9]+$/.test(txHash)) {
      return false;
    }
    
    // Validate index (should be a number)
    if (isNaN(parseInt(index))) {
      return false;
    }
    
    // Validate addresses (should not be empty)
    if (!sourceAddress || !destAddress) {
      return false;
    }
    
    // Validate amount (should be a valid number)
    if (isNaN(parseFloat(amount))) {
      return false;
    }
    
    return true;
  }
  
  // Legacy format: {txHash}::{index}::{address}::{amount}
  if (parts.length === 4) {
    const [txHash, index, address, amount] = parts;
    
    // Validate transaction hash
    if (!/^[a-fA-F0-9]+$/.test(txHash)) {
      return false;
    }
    
    // Validate index
    if (isNaN(parseInt(index))) {
      return false;
    }
    
    // Validate address
    if (!address) {
      return false;
    }
    
    // Validate amount
    if (isNaN(parseFloat(amount))) {
      return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Matches two UTXO keys for equality
 * 
 * @param key1 - First UTXO key
 * @param key2 - Second UTXO key
 * @returns true if keys match, false otherwise
 */
export function matchUTXOKey(key1: string, key2: string): boolean {
  // Exact match
  if (key1 === key2) return true;
  
  // Handle backward compatibility between old and new formats
  if (key1.includes('::') && key2.includes('::')) {
    const parts1 = key1.split('::');
    const parts2 = key2.split('::');
    
    // Both new format: {txHash}::{index}::{sourceAddress}::{destAddress}::{amount}
    if (parts1.length === 5 && parts2.length === 5) {
      return parts1[0] === parts2[0] && // txHash
             parts1[1] === parts2[1] && // index
             parts1[4] === parts2[4];   // amount
    }
    
    // Both legacy format: {txHash}::{index}::{address}::{amount}
    if (parts1.length === 4 && parts2.length === 4) {
      return parts1[0] === parts2[0] && // txHash
             parts1[1] === parts2[1] && // index
             parts1[3] === parts2[3];   // amount
    }
    
    // Mixed formats - compare core transaction data
    if (parts1.length >= 3 && parts2.length >= 3) {
      return parts1[0] === parts2[0] && // txHash
             parts1[1] === parts2[1];   // index
    }
  }
  
  return false;
}

/**
 * Generates UTXO key from raw transaction data
 * 
 * @param txHash - Transaction hash
 * @param index - Input/output index
 * @param sourceAddress - Source address
 * @param destAddress - Destination address
 * @param amount - Amount
 * @returns UTXO key string
 */
export function generateUTXOKeyFromRaw(
  txHash: string,
  index: number,
  sourceAddress: string,
  destAddress: string,
  amount: string | number
): string {
  const normalizedSourceAddress = sourceAddress.toLowerCase();
  const normalizedDestAddress = destAddress.toLowerCase();
  const normalizedAmount = Number(amount).toFixed(8);
  
  return `${txHash}::${index}::${normalizedSourceAddress}::${normalizedDestAddress}::${normalizedAmount}`;
}
