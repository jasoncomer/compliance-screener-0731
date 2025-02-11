export interface IBtcAddress {
  addr: string;
  balance: number;
  first_block: number;
  last_block: number;
  multisig: number;
  script_type: string;
}

export interface IBtcAddressSummary {
  total_received: number;
  total_spent: number;
  balance: number;
}