import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateConnectionKey,
  connectionInvolvesAddress,
  findConnectionsForAddress,
  ensureConnectionKeys,
  connectionsAreSame
} from '../utxoKeyGeneration';

// Complex multi-hop and multi-connected scenario
const complexConnections = [
  // Hub node A connects to multiple nodes
  {
    from: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s', // Node A (Hub)
    to: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',   // Node C
    amount: '1000000',
    currency: 'BTC',
    txHash: 'tx1',
    utxoKey: 'tx1::0::bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w::1000000'
  },
  {
    from: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s', // Node A (Hub)
    to: 'bc1qdef456789012345678901234567890123456789',   // Node D
    amount: '2000000',
    currency: 'BTC',
    txHash: 'tx2',
    utxoKey: 'tx2::0::bc1qdef456789012345678901234567890123456789::2000000'
  },
  {
    from: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s', // Node A (Hub)
    to: 'bc1qghi789012345678901234567890123456789012',   // Node E
    amount: '500000',
    currency: 'BTC',
    txHash: 'tx3',
    utxoKey: 'tx3::0::bc1qghi789012345678901234567890123456789012::500000'
  },
  
  // Multi-hop: C connects to F, creating A->C->F path
  {
    from: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w', // Node C
    to: 'bc1qjkl012345678901234567890123456789012345',   // Node F
    amount: '800000',
    currency: 'BTC',
    txHash: 'tx4',
    utxoKey: 'tx4::0::bc1qjkl012345678901234567890123456789012345::800000'
  },
  
  // Bidirectional connections between D and E
  {
    from: 'bc1qdef456789012345678901234567890123456789', // Node D
    to: 'bc1qghi789012345678901234567890123456789012',   // Node E
    amount: '300000',
    currency: 'BTC',
    txHash: 'tx5',
    utxoKey: 'tx5::0::bc1qghi789012345678901234567890123456789012::300000'
  },
  {
    from: 'bc1qghi789012345678901234567890123456789012', // Node E
    to: 'bc1qdef456789012345678901234567890123456789',   // Node D
    amount: '150000',
    currency: 'BTC',
    txHash: 'tx6',
    utxoKey: 'tx6::0::bc1qdef456789012345678901234567890123456789::150000'
  },
  
  // F connects to G, creating A->C->F->G path
  {
    from: 'bc1qjkl012345678901234567890123456789012345', // Node F
    to: 'bc1qmno345678901234567890123456789012345678',   // Node G
    amount: '400000',
    currency: 'BTC',
    txHash: 'tx7',
    utxoKey: 'tx7::0::bc1qmno345678901234567890123456789012345678::400000'
  },
  
  // Isolated connection (not connected to main network)
  {
    from: 'bc1qpqr678901234567890123456789012345678901', // Node H
    to: 'bc1qstu901234567890123456789012345678901234',   // Node I
    amount: '100000',
    currency: 'BTC',
    txHash: 'tx8',
    utxoKey: 'tx8::0::bc1qstu901234567890123456789012345678901234::100000'
  }
];

// Aggregated connections (representing multiple underlying connections)
const aggregatedConnections = [
  {
    from: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s', // Node A
    to: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',   // Node C
    amount: '5000000', // Aggregated amount
    currency: 'BTC',
    txHash: 'agg-tx1',
    isAggregated: true,
    originalConnections: [
      {
        from: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
        to: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',
        amount: '2000000',
        currency: 'BTC',
        txHash: 'orig-tx1',
        utxoKey: 'orig-tx1::0::bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w::2000000'
      },
      {
        from: 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s',
        to: 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w',
        amount: '3000000',
        currency: 'BTC',
        txHash: 'orig-tx2',
        utxoKey: 'orig-tx2::0::bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w::3000000'
      }
    ]
  }
];

describe('Complex Connection Scenarios', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('Multi-Connected Hub Node', () => {
    it('should correctly identify all connections for a hub node', () => {
      const hubNode = 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s'; // Node A
      const connectionsWithKeys = ensureConnectionKeys(complexConnections);
      const hubConnections = findConnectionsForAddress(connectionsWithKeys, hubNode);
      
      console.log('🔍 HUB NODE TEST:');
      console.log('Hub node:', hubNode);
      console.log('Total connections found:', hubConnections.length);
      console.log('Hub connections:', hubConnections.map(c => ({
        from: c.from,
        to: c.to,
        amount: c.amount,
        connectionKey: c.connectionKey
      })));
      
      // Hub should have 3 direct connections
      expect(hubConnections).toHaveLength(3);
      
      // Verify all connections involve the hub
      hubConnections.forEach(conn => {
        expect(connectionInvolvesAddress(conn, hubNode)).toBe(true);
      });
      
      // Verify target nodes
      const targetNodes = hubConnections.map(conn => 
        conn.from === hubNode ? conn.to : conn.from
      );
      
      expect(targetNodes).toContain('bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w'); // Node C
      expect(targetNodes).toContain('bc1qdef456789012345678901234567890123456789'); // Node D
      expect(targetNodes).toContain('bc1qghi789012345678901234567890123456789012'); // Node E
    });
  });

  describe('Multi-Hop Path Analysis', () => {
    it('should identify connections in a multi-hop path', () => {
      const pathStart = 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s'; // Node A
      const pathMiddle = 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w'; // Node C
      const pathEnd = 'bc1qjkl012345678901234567890123456789012345'; // Node F
      
      const connectionsWithKeys = ensureConnectionKeys(complexConnections);
      
      // Check A->C connection
      const aToC = findConnectionsForAddress(connectionsWithKeys, pathStart)
        .filter(conn => connectionInvolvesAddress(conn, pathMiddle));
      expect(aToC).toHaveLength(1);
      
      // Check C->F connection
      const cToF = findConnectionsForAddress(connectionsWithKeys, pathMiddle)
        .filter(conn => connectionInvolvesAddress(conn, pathEnd));
      expect(cToF).toHaveLength(1);
      
      // Verify the path: A->C->F
      console.log('🔍 MULTI-HOP PATH TEST:');
      console.log('A->C connection:', aToC[0]);
      console.log('C->F connection:', cToF[0]);
      console.log('Path: A->C->F verified');
    });

    it('should identify all nodes reachable from a starting node', () => {
      const startNode = 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s'; // Node A
      const connectionsWithKeys = ensureConnectionKeys(complexConnections);
      
      // Get all connections involving the start node
      const startConnections = findConnectionsForAddress(connectionsWithKeys, startNode);
      
      // Get all unique nodes connected to the start node
      const connectedNodes = new Set<string>();
      startConnections.forEach(conn => {
        if (conn.from === startNode && conn.to) connectedNodes.add(conn.to);
        if (conn.to === startNode && conn.from) connectedNodes.add(conn.from);
      });
      
      console.log('🔍 REACHABLE NODES TEST:');
      console.log('Start node:', startNode);
      console.log('Direct connections:', Array.from(connectedNodes));
      
      // Should connect to C, D, E directly
      expect(connectedNodes.size).toBe(3);
      expect(connectedNodes.has('bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w')).toBe(true); // C
      expect(connectedNodes.has('bc1qdef456789012345678901234567890123456789')).toBe(true); // D
      expect(connectedNodes.has('bc1qghi789012345678901234567890123456789012')).toBe(true); // E
    });
  });

  describe('Bidirectional Connections', () => {
    it('should handle bidirectional connections correctly', () => {
      const nodeD = 'bc1qdef456789012345678901234567890123456789';
      const nodeE = 'bc1qghi789012345678901234567890123456789012';
      
      const connectionsWithKeys = ensureConnectionKeys(complexConnections);
      
      // Check D's connections
      const dConnections = findConnectionsForAddress(connectionsWithKeys, nodeD);
      console.log('🔍 BIDIRECTIONAL TEST - Node D:');
      console.log('D connections:', dConnections.length);
      
      // D should have 3 connections: A->D, D->E, E->D
      expect(dConnections).toHaveLength(3);
      
      // Check E's connections
      const eConnections = findConnectionsForAddress(connectionsWithKeys, nodeE);
      console.log('E connections:', eConnections.length);
      
      // E should have 3 connections: A->E, D->E, E->D
      expect(eConnections).toHaveLength(3);
      
      // Verify bidirectional D<->E exists
      const dToE = dConnections.filter(conn => 
        conn.from === nodeD && conn.to === nodeE
      );
      const eToD = eConnections.filter(conn => 
        conn.from === nodeE && conn.to === nodeD
      );
      
      expect(dToE).toHaveLength(1);
      expect(eToD).toHaveLength(1);
      expect(dToE[0].amount).toBe('300000');
      expect(eToD[0].amount).toBe('150000');
    });
  });

  describe('Isolated Network Segments', () => {
    it('should not find connections between isolated network segments', () => {
      const mainNetworkNode = 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s'; // Node A
      const isolatedNode = 'bc1qpqr678901234567890123456789012345678901'; // Node H
      
      const connectionsWithKeys = ensureConnectionKeys(complexConnections);
      
      // Main network node should not connect to isolated node
      const mainConnections = findConnectionsForAddress(connectionsWithKeys, mainNetworkNode);
      const hasIsolatedConnection = mainConnections.some(conn => 
        connectionInvolvesAddress(conn, isolatedNode)
      );
      
      expect(hasIsolatedConnection).toBe(false);
      
      // Isolated node should only connect to its partner
      const isolatedConnections = findConnectionsForAddress(connectionsWithKeys, isolatedNode);
      expect(isolatedConnections).toHaveLength(1);
      expect(isolatedConnections[0].to).toBe('bc1qstu901234567890123456789012345678901234'); // Node I
    });
  });

  describe('Aggregated Connections', () => {
    it('should handle aggregated connections correctly', () => {
      const nodeA = 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s';
      const nodeC = 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w';
      
      const connectionsWithKeys = ensureConnectionKeys(aggregatedConnections);
      const aConnections = findConnectionsForAddress(connectionsWithKeys, nodeA);
      
      console.log('🔍 AGGREGATED CONNECTIONS TEST:');
      console.log('A connections:', aConnections.length);
      console.log('Aggregated connection:', aConnections[0]);
      
      // Should find the aggregated connection
      expect(aConnections).toHaveLength(1);
      
      const aggConn = aConnections[0];
      expect(aggConn.isAggregated).toBe(true);
      expect(aggConn.amount).toBe('5000000');
      expect(aggConn.originalConnections).toHaveLength(2);
      
      // Verify original connections are properly structured
      aggConn.originalConnections?.forEach((origConn: any) => {
        expect(connectionInvolvesAddress(origConn, nodeA)).toBe(true);
        expect(connectionInvolvesAddress(origConn, nodeC)).toBe(true);
      });
    });
  });

  describe('Connection Key Uniqueness', () => {
    it('should generate unique connection keys for different connections', () => {
      const connectionsWithKeys = ensureConnectionKeys(complexConnections);
      const connectionKeys = connectionsWithKeys.map(conn => conn.connectionKey);
      
      // All connection keys should be unique
      const uniqueKeys = new Set(connectionKeys);
      expect(uniqueKeys.size).toBe(connectionKeys.length);
      
      console.log('🔍 CONNECTION KEY UNIQUENESS TEST:');
      console.log('Total connections:', connectionsWithKeys.length);
      console.log('Unique keys:', uniqueKeys.size);
      console.log('All keys unique:', uniqueKeys.size === connectionKeys.length);
    });

    it('should generate identical keys for identical connections', () => {
      const conn1 = { ...complexConnections[0] };
      const conn2 = { ...complexConnections[0] };
      
      const key1 = generateConnectionKey(conn1);
      const key2 = generateConnectionKey(conn2);
      
      expect(key1).toBe(key2);
      expect(connectionsAreSame(conn1, conn2)).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of connections efficiently', () => {
      // Generate a large number of connections
      const largeConnections = [];
      for (let i = 0; i < 1000; i++) {
        largeConnections.push({
          from: `node_${i % 100}`,
          to: `node_${(i + 1) % 100}`,
          amount: String(i * 1000),
          currency: 'BTC',
          txHash: `tx_${i}`,
          utxoKey: `tx_${i}::0::node_${(i + 1) % 100}::${i * 1000}`
        });
      }
      
      const startTime = performance.now();
      const connectionsWithKeys = ensureConnectionKeys(largeConnections);
      const endTime = performance.now();
      
      console.log('🔍 PERFORMANCE TEST:');
      console.log('Connections processed:', largeConnections.length);
      console.log('Time taken:', (endTime - startTime).toFixed(2), 'ms');
      
      // Should complete in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // All connections should have keys
      expect(connectionsWithKeys.every(conn => conn.connectionKey)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle connections with missing or invalid data', () => {
      const edgeCaseConnections = [
        { from: 'node1', to: 'node2' }, // No amount, no utxoKey
        { from: 'node3', to: 'node4', amount: '1000' }, // No utxoKey
        { from: 'node5', to: 'node6', utxoKey: 'tx::0::node6::2000' }, // No amount
        { from: '', to: 'node7' }, // Empty from
        { to: 'node8' }, // No from
      ];
      
      const connectionsWithKeys = ensureConnectionKeys(edgeCaseConnections);
      
      console.log('🔍 EDGE CASES TEST:');
      console.log('Edge case connections processed:', connectionsWithKeys.length);
      
      // Should handle all edge cases gracefully
      expect(connectionsWithKeys).toHaveLength(edgeCaseConnections.length);
      
      // All should have connection keys
      connectionsWithKeys.forEach(conn => {
        expect(conn.connectionKey).toBeDefined();
        expect(typeof conn.connectionKey).toBe('string');
      });
    });
  });
});