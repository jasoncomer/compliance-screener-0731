import { ECaseStatus } from "./enums";

export interface IUser {
  name: string;
  email: string;
  password: string;
  plan: 'free' | 'premium';

  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICase {
  id: string;
  clientName: string;
  clientEmail: string;
  blockchainAddress: string;
  status: ECaseStatus;

  _id?: string;
  blockchain?: 'bitcoin' | 'ethereum';
  notes?: string;
}

export interface ITx {
  block_height: number;
  confirmations: number;
  confirmed: string;
  double_spend: boolean;
  ref_balance: number;
  tx_hash: string;
  tx_input_n: number;
  tx_output_n: number;
  value: number;
}

export interface IApiResponse {
  address: string;
  total_received: number;
  total_sent: number;
  balance: number;
  unconfirmed_balance: number;
  final_balance: number;
  n_tx: number;
  unconfirmed_n_tx: number;
  final_n_tx: number;
  hasMore: boolean;
  txs: Tx[];
}

export interface Tx {
  block_hash: string;
  block_height: number;
  block_index: number;
  hash: string;
  addresses: string[];
  total: number;
  fees: number;
  size: number;
  vsize: number;
  preference: string;
  relayed_by: string;
  confirmed: string;
  received: string;
  ver: number;
  double_spend: boolean;
  vin_sz: number;
  vout_sz: number;
  opt_in_rbf: boolean;
  confirmations: number;
  confidence: number;
  inputs: Input[];
  outputs: Output[];
  next_inputs: string;
}

export interface Input {
  prev_hash: string;
  output_index: number;
  script: string;
  output_value: number;
  sequence: number;
  addresses: string[];
  script_type: string;
  age: number;
  witness?: string[];
}

export interface Output {
  value: number;
  script: string;
  spent_by: string;
  addresses: string[];
  script_type: string;
}
