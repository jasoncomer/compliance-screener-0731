export const truncateStringMiddle = (str: string, maxLength: number) => {
  if (str.length <= maxLength) {
    return str;
  }

  const start = str.slice(0, maxLength / 2 - 1);
  const end = str.slice(-maxLength / 2 + 1);

  return `${start}...${end}`;
}

/**
 * Detects if a string is a blockchain address and truncates it appropriately
 * @param str The string to check and potentially truncate
 * @param maxLength Maximum length for the truncated string
 * @returns Truncated string if it's an address, original string otherwise
 */
export const truncateAddressIfNeeded = (str: string, maxLength: number = 20): string => {
  if (!str || str.length <= maxLength) {
    return str;
  }

  // Check if it looks like a Bitcoin address (starts with 1, 3, or bc1)
  const isBitcoinAddress = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(str) || /^bc1[a-z0-9]{39,59}$/.test(str);
  
  // Check if it looks like an Ethereum address (starts with 0x and is 42 characters)
  const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(str);

  if (isBitcoinAddress || isEthereumAddress) {
    return truncateStringMiddle(str, maxLength);
  }

  // For other strings, only truncate if they're very long
  if (str.length > maxLength * 2) {
    return truncateStringMiddle(str, maxLength);
  }

  return str;
}