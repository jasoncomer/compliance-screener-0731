import { api } from "../api/api";
import { BtcTransaction } from "../typings/BtcTransaction";

const satsToBTC = (sats: number) => sats / 100000000;

const truncateAddress = (address: string) => {
  const digits = 4;
  return `${address.slice(0, digits)}...${address.slice(-digits)}`;
};

const determineInputType = (input: string | null) => {
  if (!input) return null;

  // btc tx hash
  if (isValidBitcoinTransactionHash(input)) return 'transaction';

  // block number
  if (isValidBitcoinBlockNumber(Number(input))) return 'block';

  // btc address
  if (isValidBitcoinAddress(input)) return 'address';

  // invalid input
  return null;
};

const fetchBlockchainData = async (input: string, type: string) => {
  try {
    // Fetch blockchain data from API
    switch (type) {
      case 'transaction': return api.blockchain.getTransaction(input);
      case 'block': return api.blockchain.getBlock(Number(input));
      case 'address': return api.blockchain.getAddress(input);
      default: throw new Error('Invalid input type');
    }
  } catch (error) {
    throw new Error('Failed to fetch blockchain data');
  }
}

/**
 * Checks if a given string is a valid Bitcoin address.
 * Supports P2PKH, P2SH, and Bech32 address formats.
 * @param address The Bitcoin address to validate
 * @returns True if the address is valid, false otherwise
 */
const isValidBitcoinAddress = (address: string): boolean => {
  // Regular expressions for different Bitcoin address formats
  const p2pkhRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const p2shRegex = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Regex = /^(bc1)[a-zA-HJ-NP-Z0-9]{39,59}$/;

  return p2pkhRegex.test(address) || p2shRegex.test(address) || bech32Regex.test(address);
}

/**
 * Checks if a given string is a valid Bitcoin transaction hash.
 * @param txHash The transaction hash to validate
 * @returns True if the transaction hash is valid, false otherwise
 */
const isValidBitcoinTransactionHash = (txHash: string): boolean => {
  const txHashRegex = /^[a-fA-F0-9]{64}$/;
  return txHashRegex.test(txHash);
}

/**
 * Checks if a given number is a valid Bitcoin block number.
 * @param blockNumber The block number to validate
 * @returns True if the block number is valid, false otherwise
 */
const isValidBitcoinBlockNumber = (blockNumber: number): boolean => {
  // Bitcoin block numbers are non-negative integers
  return Number.isInteger(blockNumber) && blockNumber >= 0;
}

/**
 * Checks if a given string is a valid Bitcoin block hash.
 * @param blockHash The block hash to validate
 * @returns True if the block hash is valid, false otherwise
 */
const isValidBitcoinBlockHash = (blockHash: string): boolean => {
  const blockHashRegex = /^[a-fA-F0-9]{64}$/;
  return blockHashRegex.test(blockHash);
}

const getSumOfInputs = (tx: BtcTransaction, address: string) => {
  return tx.cpin.reduce((acc: number, input) => {
    return input.addr === address ? acc + input.amt : acc;
  }, 0);
}

const getSumOfOutputs = (tx: BtcTransaction, address: string) => {
  return tx.cpout.reduce((acc: number, output) => {
    return output.addr === address ? acc + output.amt : acc;
  }, 0);
}
const getTransactionAmountOfAddress = (tx: BtcTransaction, address: string) => {
  return getSumOfOutputs(tx, address) - getSumOfInputs(tx, address);
}

export {
  satsToBTC,
  truncateAddress,
  determineInputType,
  fetchBlockchainData,
  isValidBitcoinAddress,
  isValidBitcoinTransactionHash,
  isValidBitcoinBlockNumber,
  isValidBitcoinBlockHash,
  getTransactionAmountOfAddress,
};