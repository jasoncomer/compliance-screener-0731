import { BtcTransaction } from './BtcTransaction';

export interface IBtcBlock {
  number: number;
  hash: string;
  size: number;
  stripped_size: number;
  weight: number;
  version: number;
  merkle_root: string;
  timestamp: string;
  timestamp_month: string;
  nonce: string | number;
  bits: string;
  coinbase_param?: string;
  transaction_count: number;
  transactions: BtcTransaction[];
} 