/**
 * Comprehensive test suite for UTXO key generation and matching
 * Tests all edge cases, backward compatibility, and error conditions
 */

import { 
  generateUTXOKey, 
  matchUTXOKey, 
  validateUTXOKey,
  UTXOKeyGenerationInput 
} from '../utxoKeyGeneration';

describe('UTXO Key Generation', () => {
  describe('generateUTXOKey', () => {
    it('should generate correct key for input UTXO with all parameters', () => {
      const input: UTXOKeyGenerationInput = {
        originalTxHash: 'abc123def456',
        txid: 'fallback',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      };
      
      const result = generateUTXOKey(input);
      expect(result).toBe('abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000');
    });

    it('should generate correct key for output UTXO with all parameters', () => {
      const input: UTXOKeyGenerationInput = {
        originalTxHash: 'abc123def456',
        txid: 'fallback',
        originalOutputIndex: 1,
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        amount: '0.005'
      };
      
      const result = generateUTXOKey(input);
      expect(result).toBe('abc123def456::1::bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh::0.00500000');
    });

    it('should normalize address to lowercase', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      };
      
      const result = generateUTXOKey(input);
      expect(result).toContain('1a1zp1ep5qgefi2dmptftl5slmv7divfna');
    });

    it('should normalize amount to 8 decimal places', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      };
      
      const result = generateUTXOKey(input);
      expect(result).toContain('0.00100000');
    });

    it('should handle satoshi amounts from inputs', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        inputs: [{ amt: 100000 }] // 100000 satoshis = 0.001 BTC
      };
      
      const result = generateUTXOKey(input);
      expect(result).toContain('0.00100000');
    });

    it('should handle satoshi amounts from outputs', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalOutputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        outputs: [{ amt: 500000 }] // 500000 satoshis = 0.005 BTC
      };
      
      const result = generateUTXOKey(input);
      expect(result).toContain('0.00500000');
    });

    it('should handle coinbase transactions (mining rewards)', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        inputs: [{ intxid_n: 0xffffffff }], // Coinbase input pattern
        amount: '6.25'
      };
      
      const result = generateUTXOKey(input);
      expect(result).toContain('coinbase');
      expect(result).toContain('6.25000000');
    });

    it('should handle coinbase transactions with no inputs', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        inputs: [],
        amount: '6.25'
      };
      
      const result = generateUTXOKey(input);
      expect(result).toContain('coinbase');
    });

    it('should throw error when transaction hash is missing', () => {
      const input: UTXOKeyGenerationInput = {
        txid: '',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.001'
      };
      
      expect(() => generateUTXOKey(input)).toThrow('Transaction hash is required');
    });

    it('should throw error when address is missing and not coinbase', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        amount: '0.001',
        inputs: [{ intxid_n: 0 }] // Provide inputs without address to prevent coinbase detection
      };
      
      expect(() => generateUTXOKey(input)).toThrow('Address is required for UTXO key generation');
    });

    it('should throw error when amount is missing', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      };
      
      expect(() => generateUTXOKey(input)).toThrow('Amount is required for UTXO key generation');
    });

    it('should throw error when amount is invalid', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: 'invalid'
      };
      
      expect(() => generateUTXOKey(input)).toThrow('Invalid amount for UTXO key generation');
    });

    it('should throw error when amount is negative', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '-0.001'
      };
      
      expect(() => generateUTXOKey(input)).toThrow('Invalid amount for UTXO key generation');
    });
  });

  describe('matchUTXOKey', () => {
    it('should match identical keys', () => {
      const key1 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      const key2 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      
      expect(matchUTXOKey(key1, key2)).toBe(true);
    });

    it('should match new format keys', () => {
      const key1 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      const key2 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      
      expect(matchUTXOKey(key1, key2)).toBe(true);
    });

    it('should match old format keys', () => {
      const key1 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna';
      const key2 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna';
      
      expect(matchUTXOKey(key1, key2)).toBe(true);
    });

    it('should match mixed format keys (new vs old)', () => {
      const newFormat = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      const oldFormat = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna';
      
      expect(matchUTXOKey(newFormat, oldFormat)).toBe(true);
      expect(matchUTXOKey(oldFormat, newFormat)).toBe(true);
    });

    it('should not match different transaction hashes', () => {
      const key1 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      const key2 = 'def456abc123::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      
      expect(matchUTXOKey(key1, key2)).toBe(false);
    });

    it('should not match different indices', () => {
      const key1 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      const key2 = 'abc123def456::1::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      
      expect(matchUTXOKey(key1, key2)).toBe(false);
    });

    it('should not match different addresses', () => {
      const key1 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      const key2 = 'abc123def456::0::bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh::0.00100000';
      
      expect(matchUTXOKey(key1, key2)).toBe(false);
    });

    it('should not match different amounts', () => {
      const key1 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      const key2 = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00500000';
      
      expect(matchUTXOKey(key1, key2)).toBe(false);
    });

    it('should handle invalid keys gracefully', () => {
      const validKey = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      const invalidKey = 'invalid-key';
      
      expect(matchUTXOKey(validKey, invalidKey)).toBe(false);
      expect(matchUTXOKey(invalidKey, validKey)).toBe(false);
    });
  });

  describe('validateUTXOKey', () => {
    it('should validate new format keys', () => {
      const validKey = 'abc123def456789012345678901234567890123456789012345678901234567890::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      expect(validateUTXOKey(validKey)).toBe(true);
    });

    it('should validate old format keys', () => {
      const validKey = 'abc123def456789012345678901234567890123456789012345678901234567890::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna';
      expect(validateUTXOKey(validKey)).toBe(true);
    });

    it('should reject keys with invalid transaction hash', () => {
      const invalidKey = 'invalid-hash::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      expect(validateUTXOKey(invalidKey)).toBe(false);
    });

    it('should reject keys with invalid index', () => {
      const invalidKey = 'abc123def456789012345678901234567890123456789012345678901234567890::invalid::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000';
      expect(validateUTXOKey(invalidKey)).toBe(false);
    });

    it('should reject keys with empty address', () => {
      const invalidKey = 'abc123def456789012345678901234567890123456789012345678901234567890::0::::0.00100000';
      expect(validateUTXOKey(invalidKey)).toBe(false);
    });

    it('should reject keys with invalid amount format', () => {
      const invalidKey = 'abc123def456789012345678901234567890123456789012345678901234567890::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.001';
      expect(validateUTXOKey(invalidKey)).toBe(false);
    });

    it('should reject empty or null keys', () => {
      expect(validateUTXOKey('')).toBe(false);
      expect(validateUTXOKey(null as any)).toBe(false);
      expect(validateUTXOKey(undefined as any)).toBe(false);
    });

    it('should reject keys with wrong number of parts', () => {
      const invalidKey = 'abc123def456::0::1a1zp1ep5qgefi2dmptftl5slmv7divfna::0.00100000::extra';
      expect(validateUTXOKey(invalidKey)).toBe(false);
    });
  });

  describe('Edge Cases and Real-World Scenarios', () => {
    it('should handle very small amounts correctly', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '0.00000001' // 1 satoshi
      };
      
      const result = generateUTXOKey(input);
      expect(result).toContain('0.00000001');
    });

    it('should handle large amounts correctly', () => {
      const input: UTXOKeyGenerationInput = {
        txid: 'abc123def456',
        originalInputIndex: 0,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: '21000000' // 21 million BTC
      };
      
      const result = generateUTXOKey(input);
      expect(result).toContain('21000000.00000000');
    });

    it('should handle different address formats', () => {
      const legacyAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      const segwitAddress = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
      const bech32Address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      
      const inputs = [
        { address: legacyAddress, expected: 'legacy' },
        { address: segwitAddress, expected: 'segwit' },
        { address: bech32Address, expected: 'bech32' }
      ];
      
      inputs.forEach(({ address, expected }) => {
        const input: UTXOKeyGenerationInput = {
          txid: 'abc123def456',
          originalInputIndex: 0,
          address,
          amount: '0.001'
        };
        
        const result = generateUTXOKey(input);
        expect(result).toContain(address.toLowerCase());
      });
    });

    it('should handle coinbase transactions with different amounts', () => {
      const amounts = ['6.25', '12.5', '25', '50'];
      
      amounts.forEach(amount => {
        const input: UTXOKeyGenerationInput = {
          txid: 'abc123def456',
          originalInputIndex: 0,
          inputs: [{ intxid_n: 0xffffffff }],
          amount
        };
        
        const result = generateUTXOKey(input);
        expect(result).toContain('coinbase');
        expect(result).toContain(parseFloat(amount).toFixed(8));
      });
    });
  });
});