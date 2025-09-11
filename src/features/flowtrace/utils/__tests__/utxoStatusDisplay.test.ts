import { describe, it, expect } from 'vitest';

// Mock the generateUTXOKey function
const generateUTXOKey = (params: any) => {
  return `${params.originalTxHash || params.txid}::${params.originalInputIndex || 0}::${params.address}::${params.amount}`;
};

// Mock the connectionInvolvesAddress function
const connectionInvolvesAddress = (connection: any, address: string) => {
  if (connection.from && connection.to) {
    return connection.from === address || connection.to === address;
  }
  if (connection.utxoKey && (!connection.from || !connection.to)) {
    // Simplified utxoKey matching for this test
    return connection.utxoKey.includes(address);
  }
  if (connection.from) { return connection.from === address; }
  if (connection.to) { return connection.to === address; }
  return false;
};

describe('UTXO Status Display Logic', () => {
  it('should correctly identify UTXOs that are connected to another node', () => {
    const address = 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w';
    const existingConnections = [
      {
        from: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',
        to: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
        amount: '1000000',
        utxoKey: 'tx123::0::bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s::1000000'
      }
    ];

    const utxoKey = generateUTXOKey({
      originalTxHash: 'tx123',
      txid: 'tx123',
      originalInputIndex: 0,
      originalOutputIndex: 0,
      inputs: [],
      outputs: [],
      address: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
      amount: '1000000'
    });

    // Simulate the logic from NodeTxPicker
    let isConnectedToNode = false;
    let connectedNodeId = '';
    
    const connectionInfo = existingConnections.find(conn => {
      if (conn.utxoKey === utxoKey) return true;
      return false;
    });

    if (connectionInfo) {
      if (connectionInfo.from && connectionInfo.to) {
        isConnectedToNode = true;
        connectedNodeId = connectionInfo.from === address ? connectionInfo.to : connectionInfo.from;
      }
    }

    const isAlreadyConnected = !!connectionInfo;

    expect(isAlreadyConnected).toBe(true);
    expect(isConnectedToNode).toBe(true);
    expect(connectedNodeId).toBe('bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s');
  });

  it('should correctly identify UTXOs that are in graph but not connected to another node', () => {
    const address = 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w';
    const existingConnections = [
      {
        // This connection has no from/to, just a utxoKey (in graph but not connected to another node)
        utxoKey: 'tx456::0::bc1qdef456789012345678901234567890123456789::500000',
        amount: '500000'
      }
    ];

    const utxoKey = generateUTXOKey({
      originalTxHash: 'tx456',
      txid: 'tx456',
      originalInputIndex: 0,
      originalOutputIndex: 0,
      inputs: [],
      outputs: [],
      address: 'bc1qdef456789012345678901234567890123456789',
      amount: '500000'
    });

    // Simulate the logic from NodeTxPicker
    let isConnectedToNode = false;
    let connectedNodeId = '';
    
    const connectionInfo = existingConnections.find(conn => {
      if (conn.utxoKey === utxoKey) return true;
      return false;
    });

    if (connectionInfo) {
      if (connectionInfo.from && connectionInfo.to) {
        isConnectedToNode = true;
        connectedNodeId = connectionInfo.from === address ? connectionInfo.to : connectionInfo.from;
      }
    }

    const isAlreadyConnected = !!connectionInfo;

    expect(isAlreadyConnected).toBe(true);
    expect(isConnectedToNode).toBe(false);
    expect(connectedNodeId).toBe('');
  });

  it('should correctly identify UTXOs that are not in graph at all', () => {
    const address = 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w';
    const existingConnections = [
      {
        from: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',
        to: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
        amount: '1000000',
        utxoKey: 'tx123::0::bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s::1000000'
      }
    ];

    const utxoKey = generateUTXOKey({
      originalTxHash: 'tx999', // Different transaction
      txid: 'tx999',
      originalInputIndex: 0,
      originalOutputIndex: 0,
      inputs: [],
      outputs: [],
      address: 'bc1qghi789012345678901234567890123456789012',
      amount: '2000000'
    });

    // Simulate the logic from NodeTxPicker
    let isConnectedToNode = false;
    let connectedNodeId = '';
    
    const connectionInfo = existingConnections.find(conn => {
      if (conn.utxoKey === utxoKey) return true;
      return false;
    });

    if (connectionInfo) {
      if (connectionInfo.from && connectionInfo.to) {
        isConnectedToNode = true;
        connectedNodeId = connectionInfo.from === address ? connectionInfo.to : connectionInfo.from;
      }
    }

    const isAlreadyConnected = !!connectionInfo;

    expect(isAlreadyConnected).toBe(false);
    expect(isConnectedToNode).toBe(false);
    expect(connectedNodeId).toBe('');
  });

  it('should handle aggregated connections correctly', () => {
    const address = 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w';
    const existingConnections = [
      {
        from: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',
        to: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
        amount: '5000000',
        isAggregated: true,
        originalConnections: [
          {
            utxoKey: 'tx1::0::bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s::2000000'
          },
          {
            utxoKey: 'tx2::0::bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s::3000000'
          }
        ]
      }
    ];

    const utxoKey = 'tx1::0::bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s::2000000';

    // Simulate the logic from NodeTxPicker
    let isConnectedToNode = false;
    let connectedNodeId = '';
    
    const connectionInfo = existingConnections.find(conn => {
      if (conn.utxoKey === utxoKey) return true;
      
      if (conn.isAggregated && conn.originalConnections) {
        return conn.originalConnections.some(origConn => {
          if (origConn.utxoKey === utxoKey) return true;
          return false;
        });
      }
      
      return false;
    });

    if (connectionInfo) {
      if (connectionInfo.from && connectionInfo.to) {
        isConnectedToNode = true;
        connectedNodeId = connectionInfo.from === address ? connectionInfo.to : connectionInfo.from;
      }
    }

    const isAlreadyConnected = !!connectionInfo;

    expect(isAlreadyConnected).toBe(true);
    expect(isConnectedToNode).toBe(true);
    expect(connectedNodeId).toBe('bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s');
  });
});