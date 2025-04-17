export interface BtcTransaction {
  _id: string;
  txid: string;
  block: number;
  input_amt: number;
  output_amt: number;
  input_cnt: number;
  output_cnt: number;
  fee_amt: number;

  is_coinjoin: boolean;
  coinbase: boolean;
  timestamp: number;
  inputs: {
    addr: string;
    amt: number;
    intxid: string;
    intxid_n: number;
    n: number;
  }[];
  outputs: {
    intxid: string;
    addr: string;
    amt: number;
    n: number;
  }[];
}
