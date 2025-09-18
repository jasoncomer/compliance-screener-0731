/**
 * Integration tests for node expansion functionality
 * Tests UTXO key matching in real-world scenarios
 */

import { matchUTXOKey, generateUTXOKey } from '../utxoKeyGeneration';

describe('Node Expansion Integration Tests', () => {
  describe('Bidirectional UTXO Matching', () => {
    it('should match same UTXO from different node perspectives', () => {
      // Node A expanding - sees UTXO as input
      const nodeAKey = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      });
      
      // Node B expanding - sees same UTXO as output
      const nodeBKey = generateUTXOKey({
        txid: 'abc123def456',
        originalOutputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      });
      
      // Should match because it's the same UTXO
      expect(matchUTXOKey(nodeAKey, nodeBKey)).toBe(true);
    });

    it('should not match different UTXOs even with same address', () => {
      // Different transaction hashes
      const utxo1 = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      });
      
      const utxo2 = generateUTXOKey({
        txid: 'def456abc123',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      });
      
      expect(matchUTXOKey(utxo1, utxo2)).toBe(false);
    });

    it('should not match different amounts for same address', () => {
      const utxo1 = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      });
      
      const utxo2 = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 1,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.005'
      });
      
      expect(matchUTXOKey(utxo1, utxo2)).toBe(false);
    });
  });

  describe('Aggregated Connection Matching', () => {
    it('should match UTXOs in aggregated connections', () => {
      // Individual UTXO
      const individualUtxo = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      });
      
      // Same UTXO in aggregated connection
      const aggregatedUtxo = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      });
      
      expect(matchUTXOKey(individualUtxo, aggregatedUtxo)).toBe(true);
    });

    it('should handle mixed format matching in aggregated connections', () => {
      // New format key
      const newFormatKey = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      });
      
      // Old format key (simulated)
      const oldFormatKey = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna';
      
      expect(matchUTXOKey(newFormatKey, oldFormatKey)).toBe(true);
    });
  });

  describe('Mining Reward Handling', () => {
    it('should handle coinbase transactions correctly', () => {
      const coinbaseUtxo = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 0,
        inputs: [{ intxid_n: 0xffffffff }],
        amount: '6.25'
      });
      
      expect(coinbaseUtxo).toContain('coinbase');
      expect(coinbaseUtxo).toContain('6.25000000');
    });

    it('should match coinbase UTXOs correctly', () => {
      const coinbase1 = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 0,
        inputs: [{ intxid_n: 0xffffffff }],
        amount: '6.25'
      });
      
      const coinbase2 = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 0,
        inputs: [{ intxid_n: 0xffffffff }],
        amount: '6.25'
      });
      
      expect(matchUTXOKey(coinbase1, coinbase2)).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large numbers of UTXOs efficiently', () => {
      const utxos = [];
      const startTime = performance.now();
      
      // Generate 1000 UTXOs
      for (let i = 0; i < 1000; i++) {
        utxos.push(generateUTXOKey({
          txid: `abc123def456${i.toString().padStart(4, '0')}`,
          originalInputIndex: i % 10,
          address: `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa${i}`,
          amount: (0.001 * (i + 1)).toString()
        }));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(utxos).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle matching large numbers of UTXOs efficiently', () => {
      const utxos = [];
      
      // Generate 100 UTXOs
      for (let i = 0; i < 100; i++) {
        utxos.push(generateUTXOKey({
          txid: `abc123def456${i.toString().padStart(4, '0')}`,
          originalInputIndex: i % 10,
          address: `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa${i}`,
          amount: (0.001 * (i + 1)).toString()
        }));
      }
      
      const startTime = performance.now();
      
      // Test matching all UTXOs against each other
      let matchCount = 0;
      for (let i = 0; i < utxos.length; i++) {
        for (let j = i + 1; j < utxos.length; j++) {
          if (matchUTXOKey(utxos[i], utxos[j])) {
            matchCount++;
          }
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(matchCount).toBe(0); // No matches expected for different UTXOs
      expect(duration).toBeLessThan(100); // Should complete quickly
    });

    it('should handle special characters in addresses', () => {
      const specialAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      ];
      
      specialAddresses.forEach(address => {
        const utxo = generateUTXOKey({
          txid: 'abc123def456',
          originalInputIndex: 0,
          address,
          amount: '0.001'
        });
        
        expect(utxo).toContain(address.toLowerCase());
      });
    });

    it('should handle very precise amounts', () => {
      const preciseAmounts = [
        '0.00000001', // 1 satoshi
        '0.00000002', // 2 satoshis
        '0.12345678', // 8 decimal places
        '1.00000000', // 1 BTC exactly
        '21000000.00000000' // 21 million BTC
      ];
      
      preciseAmounts.forEach(amount => {
        const utxo = generateUTXOKey({
          txid: 'abc123def456',
          originalInputIndex: 0,
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          amount
        });
        
        expect(utxo).toContain(parseFloat(amount).toFixed(8));
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical transaction flow', () => {
      // Simulate a typical Bitcoin transaction with multiple inputs and outputs
      const txHash = 'abc123def456789012345678901234567890123456789012345678901234567890';
      
      // Input UTXOs
      const input1 = generateUTXOKey({
        txid: txHash,
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      });
      
      const input2 = generateUTXOKey({
        txid: txHash,
        originalInputIndex: 1,
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        amount: '0.002'
      });
      
      // Output UTXOs
      const output1 = generateUTXOKey({
        txid: txHash,
        originalOutputIndex: 0,
        address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        amount: '0.0025'
      });
      
      const output2 = generateUTXOKey({
        txid: txHash,
        originalOutputIndex: 1,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Change back to sender
        amount: '0.0005'
      });
      
      // All UTXOs should be unique
      const utxos = [input1, input2, output1, output2];
      for (let i = 0; i < utxos.length; i++) {
        for (let j = i + 1; j < utxos.length; j++) {
          expect(matchUTXOKey(utxos[i], utxos[j])).toBe(false);
        }
      }
    });

    it('should handle node expansion scenarios', () => {
      // Simulate node expansion where we need to find existing connections
      const existingConnections = [
        {
          from: 'node1',
          to: 'node2',
          utxoKey: generateUTXOKey({
            txid: 'abc123def456',
            originalInputIndex: 0,
            address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            amount: '0.001'
          })
        },
        {
          from: 'node2',
          to: 'node3',
          utxoKey: generateUTXOKey({
            txid: 'def456abc123',
            originalInputIndex: 0,
            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            amount: '0.002'
          })
        }
      ];
      
      // Simulate checking if a UTXO is already connected
      const newUtxo = generateUTXOKey({
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      });
      
      const isAlreadyConnected = existingConnections.some(conn => 
        matchUTXOKey(conn.utxoKey, newUtxo)
      );
      
      expect(isAlreadyConnected).toBe(true);
    });
  });
});