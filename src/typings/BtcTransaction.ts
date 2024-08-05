export interface BtcTransaction {
  txid: string;
  block: number;
  inamt: number;
  outamt: number;
  input_cnt: number;
  output_cnt: number;
  txfee: number;
  block_date: Date;
  coinjoin: boolean;
  coinbase: boolean;
  timestamp: number;
  cpin: {
    addr: string;
    amt: number;
  }[];
  cpout: {
    intxid: string;
    addr: string;
    amt: number;
  }[];
}
