import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateConnectionKey,
  connectionInvolvesAddress,
  findConnectionsForAddress,
  ensureConnectionKeys,
  connectionsAreSame
} from '../utxoKeyGeneration';

// Mock connection data similar to your test nodes
const mockConnections = [
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

describe('Connection Key System Tests', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('generateConnectionKey', () => {
    it('should generate consistent connection keys', () => {
      const conn = mockConnections[0];
      const key1 = generateConnectionKey(conn);
      const key2 = generateConnectionKey(conn);
      
      expect(key1).toBe(key2);
      expect(key1).toContain(conn.from);
      expect(key1).toContain(conn.to);
      expect(key1).toContain(conn.amount);
    });

    it('should generate different keys for different connections', () => {
      const key1 = generateConnectionKey(mockConnections[0]);
      const key2 = generateConnectionKey(mockConnections[1]);
      
      expect(key1).not.toBe(key2);
    });

    it('should handle missing fields gracefully', () => {
      const incompleteConn = {
        from: 'addr1',
        to: 'addr2'
        // missing amount and utxoKey
      };
      
      const key = generateConnectionKey(incompleteConn);
      expect(key).toContain('addr1');
      expect(key).toContain('addr2');
      expect(key).toContain('0'); // default amount
    });
  });

  describe('connectionInvolvesAddress', () => {
    it('should correctly identify connections involving an address via from/to', () => {
      const conn = mockConnections[0];
      
      expect(connectionInvolvesAddress(conn, conn.from)).toBe(true);
      expect(connectionInvolvesAddress(conn, conn.to)).toBe(true);
      expect(connectionInvolvesAddress(conn, 'nonexistent-address')).toBe(false);
    });

    it('should handle utxoKey fallback correctly', () => {
      const conn = {
        from: 'addr1',
        to: 'addr2',
        utxoKey: 'tx123::0::addr3::1000000'
      };
      
      // Should match via from/to (primary method)
      expect(connectionInvolvesAddress(conn, 'addr1')).toBe(true);
      expect(connectionInvolvesAddress(conn, 'addr2')).toBe(true);
      
      // Should NOT match via utxoKey since from/to takes priority
      expect(connectionInvolvesAddress(conn, 'addr3')).toBe(false);
    });

    it('should work with aggregated connections', () => {
      const aggregatedConn = {
        from: 'addr1',
        to: 'addr2',
        originalConnections: [
          { from: 'addr1', to: 'addr3' },
          { from: 'addr4', to: 'addr2' }
        ]
      };
      
      expect(connectionInvolvesAddress(aggregatedConn, 'addr1')).toBe(true);
      expect(connectionInvolvesAddress(aggregatedConn, 'addr2')).toBe(true);
    });
  });

  describe('findConnectionsForAddress', () => {
    it('should find all connections for a specific address', () => {
      const nodeA = 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s';
      const connectionsWithKeys = ensureConnectionKeys(mockConnections);
      const found = findConnectionsForAddress(connectionsWithKeys, nodeA);
      
      // Node A should be involved in 3 connections
      expect(found).toHaveLength(3);
      expect(found.every(conn => connectionInvolvesAddress(conn, nodeA))).toBe(true);
    });

    it('should return empty array for address with no connections', () => {
      const connectionsWithKeys = ensureConnectionKeys(mockConnections);
      const found = findConnectionsForAddress(connectionsWithKeys, 'nonexistent-address');
      
      expect(found).toHaveLength(0);
    });
  });

  describe('ensureConnectionKeys', () => {
    it('should add connectionKey to all connections', () => {
      const result = ensureConnectionKeys(mockConnections);
      
      expect(result).toHaveLength(mockConnections.length);
      result.forEach(conn => {
        expect(conn.connectionKey).toBeDefined();
        expect(typeof conn.connectionKey).toBe('string');
        expect(conn.connectionKey.length).toBeGreaterThan(0);
      });
    });

    it('should not modify existing connectionKeys', () => {
      const connWithKey = {
        ...mockConnections[0],
        connectionKey: 'existing-key'
      };
      
      const result = ensureConnectionKeys([connWithKey]);
      expect(result[0].connectionKey).toBe('existing-key');
    });
  });

  describe('connectionsAreSame', () => {
    it('should identify identical connections', () => {
      const conn1 = mockConnections[0];
      const conn2 = { ...mockConnections[0] };
      
      expect(connectionsAreSame(conn1, conn2)).toBe(true);
    });

    it('should identify different connections', () => {
      const conn1 = mockConnections[0];
      const conn2 = mockConnections[1];
      
      expect(connectionsAreSame(conn1, conn2)).toBe(false);
    });
  });

  describe('Integration Tests - Expand Node Modal Scenario', () => {
    it('should correctly filter connections for expand node modal', () => {
      const sourceNode = 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s'; // Node A
      const connectionsWithKeys = ensureConnectionKeys(mockConnections);
      
      // This simulates what happens in FlowTracePage.tsx
      const filtered = findConnectionsForAddress(connectionsWithKeys, sourceNode);
      
      console.log('🔍 INTEGRATION TEST - Expand Node Modal:');
      console.log('Source node:', sourceNode);
      console.log('Total connections:', mockConnections.length);
      console.log('Filtered connections:', filtered.length);
      console.log('Connection details:', filtered.map(c => ({
        from: c.from,
        to: c.to,
        amount: c.amount,
        connectionKey: c.connectionKey
      })));
      
      // Node A should have 3 connections
      expect(filtered).toHaveLength(3);
      
      // Verify each connection involves the source node
      filtered.forEach(conn => {
        expect(connectionInvolvesAddress(conn, sourceNode)).toBe(true);
      });
      
      // Verify we can determine target addresses correctly
      const targetAddresses = filtered.map(conn => 
        conn.from === sourceNode ? conn.to : conn.from
      );
      
      console.log('Target addresses:', targetAddresses);
      
      // Should include Node C and Node D
      expect(targetAddresses).toContain('bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w'); // Node C
      expect(targetAddresses).toContain('bc1qdef456789012345678901234567890123456789'); // Node D
    });

    it('should handle bidirectional connections correctly', () => {
      const sourceNode = 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w'; // Node C
      const connectionsWithKeys = ensureConnectionKeys(mockConnections);
      const filtered = findConnectionsForAddress(connectionsWithKeys, sourceNode);
      
      console.log('🔍 BIDIRECTIONAL TEST:');
      console.log('Source node:', sourceNode);
      console.log('Filtered connections:', filtered.length);
      
      // Node C should have 2 connections (both directions with Node A)
      expect(filtered).toHaveLength(2);
      
      // Both should involve Node C
      filtered.forEach(conn => {
        expect(connectionInvolvesAddress(conn, sourceNode)).toBe(true);
      });
    });
  });

  describe('Debugging Tests', () => {
    it('should log detailed connection analysis', () => {
      console.log('🔍 DETAILED CONNECTION ANALYSIS:');
      
      mockConnections.forEach((conn, index) => {
        const connectionKey = generateConnectionKey(conn);
        console.log(`Connection ${index + 1}:`);
        console.log(`  From: ${conn.from}`);
        console.log(`  To: ${conn.to}`);
        console.log(`  Amount: ${conn.amount}`);
        console.log(`  UTXO Key: ${conn.utxoKey}`);
        console.log(`  Connection Key: ${connectionKey}`);
        console.log(`  Involves A: ${connectionInvolvesAddress(conn, 'bc1qankq7lpa8ldq5yk36ndsxdsu0x84ylmrkjmn9s')}`);
        console.log(`  Involves C: ${connectionInvolvesAddress(conn, 'bc1qy5usrvs0pg3wt3uc3m9sm29jnngkc038j6tz9w')}`);
        console.log(`  Involves D: ${connectionInvolvesAddress(conn, 'bc1qdef456789012345678901234567890123456789')}`);
        console.log('---');
      });
      
      // This test always passes, it's just for debugging
      expect(true).toBe(true);
    });
  });
});