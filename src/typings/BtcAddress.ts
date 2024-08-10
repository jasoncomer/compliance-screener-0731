export interface IBtcAddress {
  addr: string;
  balance: number;
  first_block: number;
  last_block: number;
  multisig: number;
  script_type: string;
}

export interface IBtcAddressSummary {
  address: string;
  totalReceived: number;
  totalSent: number;
  balance: number;
  txCount: number;
}