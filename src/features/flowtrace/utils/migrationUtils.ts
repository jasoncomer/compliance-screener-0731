/**
 * Migration utilities for UTXO key system
 * Handles data transformation and cleanup during system migration
 */

import { generateUTXOKey, matchUTXOKey, validateUTXOKey, UTXOKeyGenerationInput } from './utxoKeyGeneration';

export interface ConnectionMigrationData {
  from: string;
  to: string;
  utxoKey?: string;
  amount?: string;
  currency?: string;
  txHash?: string;
  originalConnections?: ConnectionMigrationData[];
  isAggregated?: boolean;
}

export interface MigrationReport {
  totalConnections: number;
  migratedConnections: number;
  failedMigrations: number;
  errors: string[];
  warnings: string[];
  performance: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

/**
 * Migrates connections to use the new UTXO key format
 * @param connections - Array of connections to migrate
 * @returns Migration report with statistics and errors
 */
export function migrateConnections(connections: ConnectionMigrationData[]): {
  migratedConnections: ConnectionMigrationData[];
  report: MigrationReport;
} {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  let migratedCount = 0;
  let failedCount = 0;

  const migratedConnections: ConnectionMigrationData[] = [];

  console.log('🔄 Starting UTXO key migration...');
  console.log(`📊 Total connections to migrate: ${connections.length}`);

  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i];
    
    try {
      // Skip if already has valid new format UTXO key
      if (conn.utxoKey && validateUTXOKey(conn.utxoKey)) {
        const parts = conn.utxoKey.split('::');
        if (parts.length === 4) {
          migratedConnections.push(conn);
          migratedCount++;
          continue;
        }
      }

      // Try to generate new UTXO key
      const newUtxoKey = generateNewUtxoKey(conn);
      
      if (newUtxoKey) {
        const migratedConn = {
          ...conn,
          utxoKey: newUtxoKey
        };
        
        // Handle aggregated connections
        if (conn.isAggregated && conn.originalConnections) {
          const migratedOriginals = conn.originalConnections.map(origConn => {
            const origUtxoKey = generateNewUtxoKey(origConn);
            return {
              ...origConn,
              utxoKey: origUtxoKey || origConn.utxoKey
            };
          });
          
          migratedConn.originalConnections = migratedOriginals;
        }
        
        migratedConnections.push(migratedConn);
        migratedCount++;
      } else {
        // Keep original connection if migration fails
        migratedConnections.push(conn);
        warnings.push(`Connection ${i}: Could not generate new UTXO key, keeping original`);
        failedCount++;
      }
      
    } catch (error) {
      const errorMsg = `Connection ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ Migration error for connection ${i}:`, error);
      
      // Keep original connection on error
      migratedConnections.push(conn);
      failedCount++;
    }
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  const report: MigrationReport = {
    totalConnections: connections.length,
    migratedConnections: migratedCount,
    failedMigrations: failedCount,
    errors,
    warnings,
    performance: {
      startTime,
      endTime,
      duration
    }
  };

  console.log('✅ Migration completed');
  console.log(`📊 Results: ${migratedCount} migrated, ${failedCount} failed, ${errors.length} errors`);
  console.log(`⏱️ Duration: ${duration.toFixed(2)}ms`);

  return { migratedConnections, report };
}

/**
 * Generates a new UTXO key for a connection
 * @param conn - Connection to generate UTXO key for
 * @returns New UTXO key or null if generation fails
 */
function generateNewUtxoKey(conn: ConnectionMigrationData): string | null {
  try {
    // Extract transaction hash
    const txHash = conn.txHash || 'unknown';
    
    // Try to extract address from connection
    const address = conn.from || conn.to || 'unknown';
    
    // Use amount from connection
    const amount = conn.amount || '0';
    
    // Generate new UTXO key
    const input: UTXOKeyGenerationInput = {
      txid: txHash,
      address,
      amount
    };
    
    return generateUTXOKey(input);
  } catch (error) {
    console.warn('Failed to generate UTXO key for connection:', conn, error);
    return null;
  }
}

/**
 * Validates migrated connections for consistency
 * @param connections - Migrated connections to validate
 * @returns Validation report
 */
export function validateMigratedConnections(connections: ConnectionMigrationData[]): {
  validConnections: number;
  invalidConnections: number;
  issues: string[];
} {
  let validCount = 0;
  let invalidCount = 0;
  const issues: string[] = [];

  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i];
    
    if (!conn.utxoKey) {
      issues.push(`Connection ${i}: Missing UTXO key`);
      invalidCount++;
      continue;
    }
    
    if (!validateUTXOKey(conn.utxoKey)) {
      issues.push(`Connection ${i}: Invalid UTXO key format: ${conn.utxoKey}`);
      invalidCount++;
      continue;
    }
    
    // Check for duplicate UTXO keys
    const duplicates = connections.filter((otherConn, otherIndex) => 
      otherIndex !== i && 
      otherConn.utxoKey === conn.utxoKey
    );
    
    if (duplicates.length > 0) {
      issues.push(`Connection ${i}: Duplicate UTXO key found: ${conn.utxoKey}`);
      invalidCount++;
      continue;
    }
    
    validCount++;
  }

  return {
    validConnections: validCount,
    invalidConnections: invalidCount,
    issues
  };
}

/**
 * Analyzes existing connections for migration readiness
 * @param connections - Connections to analyze
 * @returns Analysis report
 */
export function analyzeConnectionsForMigration(connections: ConnectionMigrationData[]): {
  totalConnections: number;
  hasUtxoKeys: number;
  validUtxoKeys: number;
  invalidUtxoKeys: number;
  missingUtxoKeys: number;
  oldFormatKeys: number;
  newFormatKeys: number;
  recommendations: string[];
} {
  let hasUtxoKeys = 0;
  let validUtxoKeys = 0;
  let invalidUtxoKeys = 0;
  let missingUtxoKeys = 0;
  let oldFormatKeys = 0;
  let newFormatKeys = 0;
  const recommendations: string[] = [];

  for (const conn of connections) {
    if (conn.utxoKey) {
      hasUtxoKeys++;
      
      if (validateUTXOKey(conn.utxoKey)) {
        validUtxoKeys++;
        
        const parts = conn.utxoKey.split('::');
        if (parts.length === 3) {
          oldFormatKeys++;
        } else if (parts.length === 4) {
          newFormatKeys++;
        }
      } else {
        invalidUtxoKeys++;
      }
    } else {
      missingUtxoKeys++;
    }
  }

  // Generate recommendations
  if (missingUtxoKeys > 0) {
    recommendations.push(`${missingUtxoKeys} connections missing UTXO keys - will need to generate new keys`);
  }
  
  if (invalidUtxoKeys > 0) {
    recommendations.push(`${invalidUtxoKeys} connections have invalid UTXO keys - will need to regenerate`);
  }
  
  if (oldFormatKeys > 0) {
    recommendations.push(`${oldFormatKeys} connections use old UTXO key format - will be migrated to new format`);
  }
  
  if (newFormatKeys > 0) {
    recommendations.push(`${newFormatKeys} connections already use new UTXO key format - no migration needed`);
  }

  return {
    totalConnections: connections.length,
    hasUtxoKeys,
    validUtxoKeys,
    invalidUtxoKeys,
    missingUtxoKeys,
    oldFormatKeys,
    newFormatKeys,
    recommendations
  };
}

/**
 * Creates a backup of connections before migration
 * @param connections - Connections to backup
 * @returns Backup data
 */
export function createBackup(connections: ConnectionMigrationData[]): {
  timestamp: string;
  count: number;
  data: ConnectionMigrationData[];
} {
  const timestamp = new Date().toISOString();
  
  console.log(`💾 Creating backup with ${connections.length} connections at ${timestamp}`);
  
  return {
    timestamp,
    count: connections.length,
    data: JSON.parse(JSON.stringify(connections)) // Deep copy
  };
}

/**
 * Restores connections from backup
 * @param backup - Backup data to restore
 * @returns Restored connections
 */
export function restoreFromBackup(backup: { data: ConnectionMigrationData[] }): ConnectionMigrationData[] {
  console.log(`🔄 Restoring ${backup.data.length} connections from backup`);
  
  return JSON.parse(JSON.stringify(backup.data)); // Deep copy
}