import { BtcTransaction } from '../typings/BtcTransaction';

export interface TransformedTransaction {
  time: string;
  from: string;
  to: string;
  value: number;
  token: string;
  usd: string;
  type: 'in' | 'out';
  txid: string;
  direction: 'inflow' | 'outflow';
  description: string;
}

export const transformBtcTransactions = (
  transactions: BtcTransaction[], 
  targetAddress: string,
  btcPrice: number = 35000 // Default BTC price, should be fetched from price API
): TransformedTransaction[] => {
  const transformedTransactions: TransformedTransaction[] = [];
  
  transactions.forEach(tx => {
    const timestamp = new Date(tx.timestamp * 1000);
    const timeString = timestamp.toLocaleString();
    
    // Calculate total input and output amounts for this address
    const addressInputs = tx.inputs.filter(input => input.addr === targetAddress);
    const addressOutputs = tx.outputs.filter(output => output.addr === targetAddress);
    
    const totalInput = addressInputs.reduce((sum, input) => sum + input.amt, 0);
    const totalOutput = addressOutputs.reduce((sum, output) => sum + output.amt, 0);
    
    // Find counterparty addresses (addresses that are not the target address)
    const otherInputs = tx.inputs.filter(input => input.addr !== targetAddress);
    const otherOutputs = tx.outputs.filter(output => output.addr !== targetAddress);
    
    // Get the most significant counterparty address for inputs (where money came from)
    const fromAddress = otherInputs.length > 0 
      ? otherInputs.reduce((prev, current) => prev.amt > current.amt ? prev : current).addr
      : 'Unknown';
    
    // Get the most significant counterparty address for outputs (where money went to)
    const toAddress = otherOutputs.length > 0 
      ? otherOutputs.reduce((prev, current) => prev.amt > current.amt ? prev : current).addr
      : 'Unknown';
    
    // Create separate entries for inputs (outflows) and outputs (inflows)
    
    // If this address has inputs (spending), create an outflow entry
    if (totalInput > 0) {
      const inputValue = totalInput / 100000000; // Convert satoshis to BTC
      const usdValue = inputValue * btcPrice;
      
      transformedTransactions.push({
        time: timeString,
        from: targetAddress,
        to: toAddress,
        value: inputValue,
        token: 'BTC',
        usd: `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        type: 'out',
        txid: tx.txid,
        direction: 'outflow',
        description: `${inputValue.toFixed(8)} BTC`
      });
    }
    
    // If this address has outputs (receiving), create an inflow entry
    if (totalOutput > 0) {
      const outputValue = totalOutput / 100000000; // Convert satoshis to BTC
      const usdValue = outputValue * btcPrice;
      
      transformedTransactions.push({
        time: timeString,
        from: fromAddress,
        to: targetAddress,
        value: outputValue,
        token: 'BTC',
        usd: `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        type: 'in',
        txid: tx.txid,
        direction: 'inflow',
        description: `${outputValue.toFixed(8)} BTC`
      });
    }
  });
  
  // Sort by timestamp (newest first)
  return transformedTransactions.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}; 