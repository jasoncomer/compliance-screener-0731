/**
 * Utility functions for grouping transactions by TXID with visual styling
 * For blockscout-app project
 */

/**
 * Generates a consistent color index from a transaction hash
 * @param txId - The transaction ID/hash
 * @param colorCount - Number of available colors (default: 4)
 * @returns A number between 0 and colorCount-1
 */
export const getTransactionColorIndex = (txId: string, colorCount: number = 4): number => {
  if (!txId) return 0;
  
  // Improved hash function for better distribution
  let hash = 0;
  for (let i = 0; i < txId.length; i++) {
    const char = txId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use a different approach for better distribution
  // Take the first 8 characters and last 8 characters for more variation
  const firstPart = txId.substring(0, 8);
  const lastPart = txId.substring(txId.length - 8);
  let firstHash = 0;
  let lastHash = 0;
  
  for (let i = 0; i < firstPart.length; i++) {
    firstHash = ((firstHash << 5) - firstHash) + firstPart.charCodeAt(i);
    firstHash = firstHash & firstHash;
  }
  
  for (let i = 0; i < lastPart.length; i++) {
    lastHash = ((lastHash << 5) - lastHash) + lastPart.charCodeAt(i);
    lastHash = lastHash & lastHash;
  }
  
  // Combine both hashes for better distribution
  const combinedHash = Math.abs(firstHash + lastHash + hash);
  
  // Return positive number within range
  return combinedHash % colorCount;
};

/**
 * Gets the CSS class name for a transaction group
 * @param txId - The transaction ID/hash
 * @returns CSS class name for the transaction group
 */
export const getTransactionGroupClass = (txId: string): string => {
  const colorIndex = getTransactionColorIndex(txId);
  return `tx-group-${colorIndex}`;
};

/**
 * Gets the CSS class name for a transaction group with hover effects
 * @param txId - The transaction ID/hash
 * @returns CSS class name for the transaction group with hover
 */
export const getTransactionGroupClassWithHover = (txId: string): string => {
  const colorIndex = getTransactionColorIndex(txId);
  return `tx-group-${colorIndex} tx-group-hover`;
};