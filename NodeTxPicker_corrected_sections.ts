// CORRECTED SECTIONS FOR BIDIRECTIONAL KEY GENERATION

// Fix 1: Pre-selection logic (around line 281)
// BEFORE:
utxoKey = generateUTXOKey({
  originalTxHash: tx.originalTxHash,
  txid: tx.txid,
  originalInputIndex: tx.originalInputIndex,
  originalOutputIndex: tx.originalOutputIndex,
  inputs: tx.inputs,
  outputs: tx.outputs,
  address: counterparty || address,  // WRONG: Single address
  amount: tx.amount
});

// AFTER:
utxoKey = generateUTXOKey({
  originalTxHash: tx.originalTxHash,
  txid: tx.txid,
  originalInputIndex: tx.originalInputIndex,
  originalOutputIndex: tx.originalOutputIndex,
  inputs: tx.inputs,
  outputs: tx.outputs,
  sourceAddress: address,           // CORRECT: Current node
  destinationAddress: counterparty, // CORRECT: Other node
  amount: tx.amount
});

// Fix 2: Incoming transactions (around line 607)
// BEFORE:
const utxoKey = generateUTXOKey({
  originalTxHash: transaction.originalTxHash,
  txid: transaction.txid,
  originalInputIndex: transaction.originalInputIndex,
  originalOutputIndex: transaction.originalOutputIndex,
  inputs: transaction.inputs,
  outputs: transaction.outputs,
  address: transaction.counterpartyAddress,  // WRONG: Single address
  amount: transaction.amount
});

// AFTER:
const utxoKey = generateUTXOKey({
  originalTxHash: transaction.originalTxHash,
  txid: transaction.txid,
  originalInputIndex: transaction.originalInputIndex,
  originalOutputIndex: transaction.originalOutputIndex,
  inputs: transaction.inputs,
  outputs: transaction.outputs,
  sourceAddress: inputAddress,      // CORRECT: Where money came from
  destinationAddress: address,      // CORRECT: Where money went to
  amount: transaction.amount
});

// Fix 3: Outgoing transactions (around line 733)
// BEFORE:
const utxoKey = generateUTXOKey({
  originalTxHash: transaction.originalTxHash,
  txid: transaction.txid,
  originalInputIndex: transaction.originalInputIndex,
  originalOutputIndex: transaction.originalOutputIndex,
  inputs: transaction.inputs,
  outputs: transaction.outputs,
  address: transaction.counterpartyAddress,  // WRONG: Single address
  amount: transaction.amount
});

// AFTER:
const utxoKey = generateUTXOKey({
  originalTxHash: transaction.originalTxHash,
  txid: transaction.txid,
  originalInputIndex: transaction.originalInputIndex,
  originalOutputIndex: transaction.originalOutputIndex,
  inputs: transaction.inputs,
  outputs: transaction.outputs,
  sourceAddress: address,           // CORRECT: Where money came from
  destinationAddress: outputAddress, // CORRECT: Where money went to
  amount: transaction.amount
});

// This ensures:
// 1. Keys are generated consistently across all components
// 2. Bidirectional matching works (Node A→B and Node B→A generate compatible keys)
// 3. Connection detection works in both directions
// 4. The same UTXO flow generates the same key regardless of which node is expanding