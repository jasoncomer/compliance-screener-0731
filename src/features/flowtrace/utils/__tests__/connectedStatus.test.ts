import { describe, it, expect, beforeEach } from 'vitest';
import {
  connectionInvolvesAddress,
  findConnectionsForAddress,
  ensureConnectionKeys
} from '../utxoKeyGeneration';

// Test data that mimics your actual flowtrace scenario
const testConnections = [
  {
    from: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s', // Node A
    to: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',   // Node C
    amount: '1000000',
    currency: 'BTC',
    txHash: 'tx123',
    utxoKey: 'tx123::0::bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w::1000000'
  },
  {
    from: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w', // Node C
    to: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',   // Node A
    amount: '500000',
    currency: 'BTC',
    txHash: 'tx456',
    utxoKey: 'tx456::0::bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s::500000'
  },
  {
    from: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s', // Node A
    to: 'bc1qdef456789012345678901234567890123456789',   // Node D
    amount: '2000000',
    currency: 'BTC',
    txHash: 'tx789',
    utxoKey: 'tx789::0::bc1qdef456789012345678901234567890123456789::2000000'
  }
];

describe('Connected Status Tests - What Users Actually See', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('Expand Node Modal - Connected Status', () => {
    it('should correctly mark nodes as "connected" in the Expand Node Modal', () => {
      const sourceNode = 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s'; // Node A
      const connectionsWithKeys = ensureConnectionKeys(testConnections);
      
      // This simulates what happens when you click "Expand Node" on Node A
      const connectedConnections = findConnectionsForAddress(connectionsWithKeys, sourceNode);
      
      console.log('🔍 EXPAND NODE MODAL - CONNECTED STATUS:');
      console.log('Source node (Node A):', sourceNode);
      console.log('Total connections found:', connectedConnections.length);
      
      // Simulate the UI logic that determines which nodes should show as "connected"
      const connectedNodes = new Set<string>();
      connectedConnections.forEach(conn => {
        // Determine the counterparty node
        const counterparty = conn.from === sourceNode ? conn.to : conn.from;
        connectedNodes.add(counterparty);
      });
      
      console.log('Nodes that should show as "CONNECTED" in the modal:');
      Array.from(connectedNodes).forEach(nodeId => {
        console.log(`  ✅ ${nodeId} - CONNECTED`);
      });
      
      // Expected results based on your test data:
      // Node A should be connected to: Node C and Node D
      expect(connectedNodes.size).toBe(2);
      expect(connectedNodes.has('bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w')).toBe(true); // Node C
      expect(connectedNodes.has('bc1qdef456789012345678901234567890123456789')).toBe(true); // Node D
    });

    it('should handle bidirectional connections correctly in the modal', () => {
      const sourceNode = 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w'; // Node C
      const connectionsWithKeys = ensureConnectionKeys(testConnections);
      
      const connectedConnections = findConnectionsForAddress(connectionsWithKeys, sourceNode);
      
      console.log('🔍 BIDIRECTIONAL CONNECTIONS - CONNECTED STATUS:');
      console.log('Source node (Node C):', sourceNode);
      console.log('Total connections found:', connectedConnections.length);
      
      const connectedNodes = new Set<string>();
      connectedConnections.forEach(conn => {
        const counterparty = conn.from === sourceNode ? conn.to : conn.from;
        connectedNodes.add(counterparty);
      });
      
      console.log('Nodes that should show as "CONNECTED" in the modal:');
      Array.from(connectedNodes).forEach(nodeId => {
        console.log(`  ✅ ${nodeId} - CONNECTED`);
      });
      
      // Node C should be connected to: Node A (bidirectional)
      expect(connectedNodes.size).toBe(1);
      expect(connectedNodes.has('bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s')).toBe(true); // Node A
    });

    it('should NOT mark unconnected nodes as connected', () => {
      const sourceNode = 'bc1qdef456789012345678901234567890123456789'; // Node D
      const connectionsWithKeys = ensureConnectionKeys(testConnections);
      
      const connectedConnections = findConnectionsForAddress(connectionsWithKeys, sourceNode);
      
      console.log('🔍 UNCONNECTED NODES - CONNECTED STATUS:');
      console.log('Source node (Node D):', sourceNode);
      console.log('Total connections found:', connectedConnections.length);
      
      const connectedNodes = new Set<string>();
      connectedConnections.forEach(conn => {
        const counterparty = conn.from === sourceNode ? conn.to : conn.from;
        connectedNodes.add(counterparty);
      });
      
      console.log('Nodes that should show as "CONNECTED" in the modal:');
      Array.from(connectedNodes).forEach(nodeId => {
        console.log(`  ✅ ${nodeId} - CONNECTED`);
      });
      
      // Node D should be connected to: Node A only
      expect(connectedNodes.size).toBe(1);
      expect(connectedNodes.has('bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s')).toBe(true); // Node A
      
      // Node D should NOT be connected to Node C
      expect(connectedNodes.has('bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w')).toBe(false); // Node C
    });
  });

  describe('NodeTxPicker - Pre-selection Status', () => {
    it('should correctly pre-select connected addresses in NodeTxPicker', () => {
      const currentAddress = 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s'; // Node A
      const connectionsWithKeys = ensureConnectionKeys(testConnections);
      
      // This simulates what happens in NodeTxPicker when determining which addresses to pre-select
      const connectedConnections = findConnectionsForAddress(connectionsWithKeys, currentAddress);
      
      console.log('🔍 NODE TX PICKER - PRE-SELECTION STATUS:');
      console.log('Current address (Node A):', currentAddress);
      console.log('Total connections found:', connectedConnections.length);
      
      // Build set of counterparty addresses for pre-selection
      const preSelectedAddresses = new Set<string>();
      connectedConnections.forEach(conn => {
        if (conn.from === currentAddress && conn.to) {
          preSelectedAddresses.add(conn.to);
        }
        if (conn.to === currentAddress && conn.from) {
          preSelectedAddresses.add(conn.from);
        }
      });
      
      console.log('Addresses that should be PRE-SELECTED in NodeTxPicker:');
      Array.from(preSelectedAddresses).forEach(address => {
        console.log(`  ✅ ${address} - PRE-SELECTED`);
      });
      
      // Node A should pre-select: Node C and Node D
      expect(preSelectedAddresses.size).toBe(2);
      expect(preSelectedAddresses.has('bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w')).toBe(true); // Node C
      expect(preSelectedAddresses.has('bc1qdef456789012345678901234567890123456789')).toBe(true); // Node D
    });
  });

  describe('WalletClusterPanel - Connection Counts', () => {
    it('should correctly count connections for each node in WalletClusterPanel', () => {
      const connectionsWithKeys = ensureConnectionKeys(testConnections);
      
      console.log('🔍 WALLET CLUSTER PANEL - CONNECTION COUNTS:');
      
      // Test each node's connection count
      const nodes = [
        'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s', // Node A
        'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w', // Node C
        'bc1qdef456789012345678901234567890123456789'  // Node D
      ];
      
      nodes.forEach(nodeId => {
        const nodeConnections = findConnectionsForAddress(connectionsWithKeys, nodeId);
        console.log(`Node ${nodeId}: ${nodeConnections.length} connections`);
        
        // Log each connection for this node
        nodeConnections.forEach((conn, index) => {
          const counterparty = conn.from === nodeId ? conn.to : conn.from;
          console.log(`  Connection ${index + 1}: ${nodeId} ↔ ${counterparty} (${conn.amount} ${conn.currency})`);
        });
      });
      
      // Verify connection counts
      const nodeAConnections = findConnectionsForAddress(connectionsWithKeys, 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s');
      const nodeCConnections = findConnectionsForAddress(connectionsWithKeys, 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w');
      const nodeDConnections = findConnectionsForAddress(connectionsWithKeys, 'bc1qdef456789012345678901234567890123456789');
      
      expect(nodeAConnections.length).toBe(3); // A has 3 connections (A→C, C→A, A→D)
      expect(nodeCConnections.length).toBe(2); // C has 2 connections (A→C, C→A)
      expect(nodeDConnections.length).toBe(1); // D has 1 connection (A→D)
    });
  });

  describe('Real-World Scenario - Your Original Issue', () => {
    it('should reproduce the exact scenario from your original issue', () => {
      console.log('🔍 REPRODUCING YOUR ORIGINAL ISSUE:');
      console.log('This test simulates the exact scenario you described:');
      console.log('- Node A: bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s');
      console.log('- Node C: bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w');
      console.log('- Node D: bc1qdef456789012345678901234567890123456789');
      console.log('');
      
      const sourceNode = 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s'; // Node A
      const connectionsWithKeys = ensureConnectionKeys(testConnections);
      
      // Simulate opening the Expand Node Modal for Node A
      const connectedConnections = findConnectionsForAddress(connectionsWithKeys, sourceNode);
      
      console.log('When you click "Expand Node" on Node A:');
      console.log(`Found ${connectedConnections.length} connections`);
      console.log('');
      
      // Simulate the UI logic that determines which checkboxes should be checked
      const connectedNodes = new Set<string>();
      connectedConnections.forEach(conn => {
        const counterparty = conn.from === sourceNode ? conn.to : conn.from;
        connectedNodes.add(counterparty);
      });
      
      console.log('In the Expand Node Modal, these nodes should show as CONNECTED:');
      connectedNodes.forEach(nodeId => {
        const isNodeC = nodeId === 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w';
        const isNodeD = nodeId === 'bc1qdef456789012345678901234567890123456789';
        const nodeName = isNodeC ? 'Node C' : isNodeD ? 'Node D' : 'Unknown';
        console.log(`  ✅ ${nodeName} (${nodeId}) - CONNECTED`);
      });
      
      console.log('');
      console.log('Expected result:');
      console.log('  ✅ Node C should be marked as CONNECTED');
      console.log('  ✅ Node D should be marked as CONNECTED');
      console.log('  ❌ No other nodes should be marked as CONNECTED');
      
      // Verify the expected results
      expect(connectedNodes.size).toBe(2);
      expect(connectedNodes.has('bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w')).toBe(true); // Node C
      expect(connectedNodes.has('bc1qdef456789012345678901234567890123456789')).toBe(true); // Node D
      
      console.log('');
      console.log('✅ TEST PASSED: The connection key system correctly identifies connected nodes!');
    });
  });
});