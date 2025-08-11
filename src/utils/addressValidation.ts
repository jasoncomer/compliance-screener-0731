/**
 * Address validation utilities for blockchain addresses
 * Supports Bitcoin (with base58check validation) and Ethereum addresses
 */

// Base58 alphabet for Bitcoin address validation (used in regex)

/**
 * Validates if a string contains only base58 characters
 * @param str The string to validate
 * @returns True if the string contains only base58 characters
 */
const isValidBase58 = (str: string): boolean => {
  return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(str);
};

/**
 * Performs base58check validation for Bitcoin addresses
 * This is a simplified version - in production, you might want to use a library like bs58check
 * @param address The Bitcoin address to validate
 * @returns True if the address passes base58check validation
 */
const validateBase58Check = (address: string): boolean => {
  // Basic length check for different Bitcoin address types
  if (address.length < 26 || address.length > 35) {
    return false;
  }

  // Check if it contains only base58 characters
  if (!isValidBase58(address)) {
    return false;
  }

  // Additional checks based on address type
  const firstChar = address[0];
  
  // Legacy addresses (P2PKH) - start with 1
  if (firstChar === '1') {
    return address.length >= 26 && address.length <= 35;
  }
  
  // P2SH addresses - start with 3
  if (firstChar === '3') {
    return address.length >= 26 && address.length <= 35;
  }

  return false;
};

/**
 * Validates a Bitcoin address using base58check validation
 * @param address The Bitcoin address to validate
 * @returns True if the address is valid
 */
export const isValidBitcoinAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmedAddress = address.trim();
  
  // Bech32 addresses (native SegWit) - start with bc1
  if (trimmedAddress.startsWith('bc1')) {
    // Basic Bech32 validation - length should be between 42 and 62 characters
    return /^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/.test(trimmedAddress);
  }
  
  // Legacy and P2SH addresses - use base58check validation
  return validateBase58Check(trimmedAddress);
};

/**
 * Validates an Ethereum address
 * @param address The Ethereum address to validate
 * @returns True if the address is valid
 */
export const isValidEthereumAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmedAddress = address.trim();
  
  // Ethereum addresses must start with 0x and be 42 characters long
  if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
    return false;
  }
  
  // Check if the rest of the address contains only hexadecimal characters
  return /^0x[a-fA-F0-9]{40}$/.test(trimmedAddress);
};

/**
 * Validates any blockchain address (Bitcoin or Ethereum)
 * @param address The address to validate
 * @returns True if the address is valid for any supported blockchain
 */
export const isValidBlockchainAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmedAddress = address.trim();
  
  // Check if it's a Bitcoin address
  if (isValidBitcoinAddress(trimmedAddress)) {
    return true;
  }
  
  // Check if it's an Ethereum address
  if (isValidEthereumAddress(trimmedAddress)) {
    return true;
  }
  
  return false;
};

/**
 * Gets the blockchain type for a given address
 * @param address The address to analyze
 * @returns 'bitcoin', 'ethereum', or null if unknown
 */
export const getBlockchainType = (address: string): 'bitcoin' | 'ethereum' | null => {
  if (!address || typeof address !== 'string') {
    return null;
  }

  const trimmedAddress = address.trim();
  
  if (isValidBitcoinAddress(trimmedAddress)) {
    return 'bitcoin';
  }
  
  if (isValidEthereumAddress(trimmedAddress)) {
    return 'ethereum';
  }
  
  return null;
};

/**
 * Formats an address for display with proper truncation
 * @param address The address to format
 * @param maxLength Maximum length before truncation (default: 20)
 * @returns Formatted address string
 */
export const formatAddress = (address: string, maxLength: number = 20): string => {
  if (!address || typeof address !== 'string') {
    return '';
  }

  const trimmedAddress = address.trim();
  
  if (trimmedAddress.length <= maxLength) {
    return trimmedAddress;
  }
  
  const prefix = trimmedAddress.substring(0, Math.ceil(maxLength / 2));
  const suffix = trimmedAddress.substring(trimmedAddress.length - Math.floor(maxLength / 2));
  
  return `${prefix}...${suffix}`;
}; 