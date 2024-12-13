import { EEntityType } from "../typings/SOT";

/**
 * Converts an entity type to a properly formatted display label
 * Handles capitalization, acronyms, and special formatting cases
 */
export function getEntityTypeLabel(type: EEntityType): string {
    // Special cases for acronyms and specific terms
    const acronyms = new Set(['AMM', 'ATM', 'BRC', 'DAO', 'DEX', 'ETF', 'ICO', 'MEV', 'NFT', 'P2P', 'VPN', 'SMS', 'OTC']);
    const specialCases: Record<string, string> = {
      'CSAM': 'CSAM',
      'DEFI': 'DeFi',
      'OPENSEA': 'OpenSea',
      'BITCOIN': 'Bitcoin',
      'TELEGRAM': 'Telegram',
      'TWITTER': 'Twitter',
      'REDDIT': 'Reddit'
    };
  
    return type
      .toString()
      .split(' ')
      .map(word => {
        // Check if word is an acronym
        const upperWord = word.toUpperCase();
        if (acronyms.has(upperWord)) {
          return upperWord;
        }
  
        // Check for special cases
        for (const [key, value] of Object.entries(specialCases)) {
          if (word.toUpperCase() === key) {
            return value;
          }
        }
  
        // Handle hyphenated words
        if (word.includes('-')) {
          return word
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('-');
        }
  
        // Default case: capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }