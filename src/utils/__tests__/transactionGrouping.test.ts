/**
 * Tests for transaction grouping utilities
 */

import { getTransactionColorIndex, getTransactionGroupClass, getTransactionGroupClassWithHover } from '../transactionGrouping';

describe('Transaction Grouping Utilities', () => {
  describe('getTransactionColorIndex', () => {
    it('should return consistent color index for the same transaction ID', () => {
      const txId = 'abc123def456';
      const index1 = getTransactionColorIndex(txId);
      const index2 = getTransactionColorIndex(txId);
      
      expect(index1).toBe(index2);
    });

    it('should return different color indices for different transaction IDs', () => {
      // const txId1 = 'abc123def456';
      // const txId2 = 'xyz789ghi012';
      
      // const index1 = getTransactionColorIndex(txId1);
      // const index2 = getTransactionColorIndex(txId2);
      
      // They might be the same by chance, but let's test with multiple IDs
      const indices = [
        getTransactionColorIndex('tx1'),
        getTransactionColorIndex('tx2'),
        getTransactionColorIndex('tx3'),
        getTransactionColorIndex('tx4'),
        getTransactionColorIndex('tx5'),
      ];
      
      // At least some should be different
      const uniqueIndices = new Set(indices);
      expect(uniqueIndices.size).toBeGreaterThan(1);
    });

    it('should return index within valid range', () => {
      const txId = 'test123';
      const index = getTransactionColorIndex(txId, 4);
      
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(4);
    });

    it('should handle empty transaction ID', () => {
      const index = getTransactionColorIndex('');
      expect(index).toBe(0);
    });

    it('should handle null/undefined transaction ID', () => {
      const index1 = getTransactionColorIndex(null as any);
      const index2 = getTransactionColorIndex(undefined as any);
      
      expect(index1).toBe(0);
      expect(index2).toBe(0);
    });
  });

  describe('getTransactionGroupClass', () => {
    it('should return valid CSS class name', () => {
      const txId = 'test123';
      const className = getTransactionGroupClass(txId);
      
      expect(className).toMatch(/^tx-group-\d+$/);
    });

    it('should return consistent class for same transaction ID', () => {
      const txId = 'consistent123';
      const class1 = getTransactionGroupClass(txId);
      const class2 = getTransactionGroupClass(txId);
      
      expect(class1).toBe(class2);
    });
  });

  describe('getTransactionGroupClassWithHover', () => {
    it('should return class with hover suffix', () => {
      const txId = 'test123';
      const className = getTransactionGroupClassWithHover(txId);
      
      expect(className).toContain('tx-group-');
      expect(className).toContain('tx-group-hover');
    });

    it('should return consistent class for same transaction ID', () => {
      const txId = 'consistent123';
      const class1 = getTransactionGroupClassWithHover(txId);
      const class2 = getTransactionGroupClassWithHover(txId);
      
      expect(class1).toBe(class2);
    });
  });

  describe('Color distribution', () => {
    it('should distribute colors reasonably across different transaction IDs', () => {
      const testIds = Array.from({ length: 100 }, (_, i) => `tx${i}`);
      const indices = testIds.map(id => getTransactionColorIndex(id));
      const uniqueIndices = new Set(indices);
      
      // With 100 different IDs and 4 colors, we should see all colors used
      expect(uniqueIndices.size).toBe(4);
      
      // Each color should be used roughly equally (within reasonable bounds)
      const colorCounts = Array.from(uniqueIndices).map(colorIndex => 
        indices.filter(i => i === colorIndex).length
      );
      
      // Each color should be used at least 15 times (allowing for some variance)
      colorCounts.forEach(count => {
        expect(count).toBeGreaterThan(15);
      });
    });
  });
});