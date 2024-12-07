export interface BtcTransaction {
  _id: string;
  txid: string;
  block: number;
  inamt: number;
  outamt: number;
  input_cnt: number;
  output_cnt: number;
  txfee: number;

  coinjoin: boolean;
  coinbase: boolean;
  timestamp: number;
  inputs: {
    addr: string;
    amt: number;
  }[];
  outputs: {
    intxid: string;
    addr: string;
    amt: number;
  }[];
}
