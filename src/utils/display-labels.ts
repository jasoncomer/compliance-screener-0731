import { IUser } from "../typings/interfaces";
import { IOrganizationMember } from "../typings/organization";
import { EEntityType } from "../typings/SOT";

/**
 * Capitalizes the first letter of a string
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

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

export const getUserDisplayName = (user: IUser | IOrganizationMember) => {
  if (!user) return 'Unknown User';
  
  const firstName = user.name || '';
  const lastName = user.surname || '';
  
  const formattedFirstName = firstName.length > 0 
    ? `${firstName[0].toUpperCase()}${firstName.slice(1)}` 
    : '';
    
  const formattedLastName = lastName.length > 0 
    ? `${lastName[0].toUpperCase()}${lastName.slice(1)}` 
    : '';
  
  return `${formattedFirstName} ${formattedLastName}`.trim() || 'Unknown User';
}

export const getBlockchainLabel = (blockchain: string) => {
  if (!blockchain || typeof blockchain !== 'string') return blockchain;

  switch (blockchain) {
    case 'bitcoin':
      return 'Bitcoin';
    case 'ethereum':
      return 'Ethereum';
    case 'solana':
      return 'Solana';
    case 'tron':
      return 'Tron';
    case 'litecoin':
      return 'Litecoin';
    case 'binance':
      return 'Binance';
    case 'polkadot':
      return 'Polkadot';
    case 'avalanche':
      return 'Avalanche';
    case 'optimism':
      return 'Optimism';
    case 'base':
      return 'Base';
    case 'polygon':
      return 'Polygon';
    default:
      return `${blockchain[0].toUpperCase()}${blockchain.slice(1)}`;
  }
}