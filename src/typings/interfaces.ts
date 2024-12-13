import { ECaseStatus } from "./enums";

export interface IUser {
  name: string;
  surname: string;
  email: string;
  password: string;
  plan: 'free' | 'premium';
  isVerified: boolean;
  isDeleted: boolean;
  status: 'active' | 'inactive';

  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICaseCreate {
  clientName: string;
  clientEmail: string;
  addresses: string[];
  status: ECaseStatus;
  notes?: string;
}

export interface ICase extends ICaseCreate {
  _id: string;
  caseId: string;
  userId: string;
  blockchain?: 'bitcoin' | 'ethereum';
  key?: string;
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

export interface IBSApiResponse<T> {
  success: boolean;
  error: boolean;
  message: string;
  data: T;
  status: number;  
}

export interface SOT {
  _id: string;
  date_updated: string;
  user: string;
  revisit_site: boolean;
  kyc_req: boolean;
  entity_id: string;
  url: string;
  proper_name: string;
  entity_type: string;
  dead: boolean;
  legal_info_url: string;
  contact_email: string;
  contact_telegram: string;
  contact_twitter: string;
  logo: string;
  centralized: boolean;
  year_founded: string;
  social_media_profile: string;
  social_media_profile_2: string;
  social_media_profile_3: string;
  description_merged: string;
  associate_country_1: string;

  // new fields
  parent_id: string;
  contact_phone: string;
  contact_address: string;
  social_media_profile_4: string;
  ticker: string; // can be an array (parse use comma as separator)
  note: string;
  entity_tag1: string;
  entity_tag2: string;
  entity_tag3: string;
  entity_tag4: string;
  entity_tag5: string;
  entity_tag6: string;
  entity_tag7: string;
  associate_country_2: string;
  associate_country_3: string;
  associate_country_4: string;
  associate_country_5: string;
  associate_country_6: string;
  ens_address: string;
  key_personnel: string; // can be an array (parse use comma as separator)
  ceo: string;
}
