/**
 * Monitoring utilities for UTXO key system
 * Tracks performance, validates system health, and provides alerting
 */

import { validateUTXOKey, matchUTXOKey } from './utxoKeyGeneration';

export interface PerformanceMetrics {
  utxoKeyGenerationTime: number;
  utxoKeyMatchingTime: number;
  totalConnections: number;
  validUtxoKeys: number;
  invalidUtxoKeys: number;
  duplicateUtxoKeys: number;
  timestamp: number;
}

export interface HealthCheck {
  status: 'healthy' | 'warning' | 'critical';
  checks: {
    utxoKeyValidation: boolean;
    performanceAcceptable: boolean;
    noDuplicates: boolean;
    systemResponsive: boolean;
  };
  issues: string[];
  recommendations: string[];
  timestamp: number;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  resolved: boolean;
}

class UTXOMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: Alert[] = [];
  private maxMetricsHistory = 100;
  private maxAlertsHistory = 50;

  /**
   * Records performance metrics for UTXO operations
   */
  recordMetrics(metrics: Partial<PerformanceMetrics>): void {
    const fullMetrics: PerformanceMetrics = {
      utxoKeyGenerationTime: 0,
      utxoKeyMatchingTime: 0,
      totalConnections: 0,
      validUtxoKeys: 0,
      invalidUtxoKeys: 0,
      duplicateUtxoKeys: 0,
      timestamp: Date.now(),
      ...metrics
    };

    this.metrics.push(fullMetrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    console.log('📊 UTXO Metrics recorded:', fullMetrics);
  }

  /**
   * Measures UTXO key generation performance
   */
  measureUtxoKeyGeneration<T>(operation: () => T): T {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    
    this.recordMetrics({
      utxoKeyGenerationTime: endTime - startTime
    });
    
    return result;
  }

  /**
   * Measures UTXO key matching performance
   */
  measureUtxoKeyMatching<T>(operation: () => T): T {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    
    this.recordMetrics({
      utxoKeyMatchingTime: endTime - startTime
    });
    
    return result;
  }

  /**
   * Validates UTXO key health across connections
   */
  validateUtxoKeyHealth(connections: Array<{ utxoKey?: string }>): {
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
    issues: string[];
  } {
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    const issues: string[] = [];
    const utxoKeySet = new Set<string>();

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

      if (utxoKeySet.has(conn.utxoKey)) {
        issues.push(`Connection ${i}: Duplicate UTXO key: ${conn.utxoKey}`);
        duplicateCount++;
        continue;
      }

      utxoKeySet.add(conn.utxoKey);
      validCount++;
    }

    this.recordMetrics({
      totalConnections: connections.length,
      validUtxoKeys: validCount,
      invalidUtxoKeys: invalidCount,
      duplicateUtxoKeys: duplicateCount
    });

    return { validCount, invalidCount, duplicateCount, issues };
  }

  /**
   * Performs comprehensive health check
   */
  performHealthCheck(connections: Array<{ utxoKey?: string }>): HealthCheck {
    const timestamp = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check UTXO key validation
    const { validCount, invalidCount, duplicateCount, issues: validationIssues } = 
      this.validateUtxoKeyHealth(connections);
    
    issues.push(...validationIssues);
    
    const utxoKeyValidation = invalidCount === 0 && duplicateCount === 0;
    
    // Check performance
    const recentMetrics = this.getRecentMetrics(5);
    const avgGenerationTime = recentMetrics.reduce((sum, m) => sum + m.utxoKeyGenerationTime, 0) / recentMetrics.length;
    const avgMatchingTime = recentMetrics.reduce((sum, m) => sum + m.utxoKeyMatchingTime, 0) / recentMetrics.length;
    
    const performanceAcceptable = avgGenerationTime < 10 && avgMatchingTime < 5; // ms
    
    if (!performanceAcceptable) {
      issues.push(`Performance degraded: Generation ${avgGenerationTime.toFixed(2)}ms, Matching ${avgMatchingTime.toFixed(2)}ms`);
      recommendations.push('Consider optimizing UTXO key operations or caching');
    }
    
    // Check for duplicates
    const noDuplicates = duplicateCount === 0;
    
    if (!noDuplicates) {
      issues.push(`${duplicateCount} duplicate UTXO keys found`);
      recommendations.push('Review connection generation logic to prevent duplicates');
    }
    
    // Check system responsiveness
    const systemResponsive = this.checkSystemResponsiveness();
    
    if (!systemResponsive) {
      issues.push('System appears unresponsive');
      recommendations.push('Check for blocking operations or memory leaks');
    }
    
    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (issues.length > 0) {
      status = issues.some(issue => issue.includes('critical') || issue.includes('error')) ? 'critical' : 'warning';
    }
    
    // Add general recommendations
    if (invalidCount > 0) {
      recommendations.push('Run migration to fix invalid UTXO keys');
    }
    
    if (duplicateCount > 0) {
      recommendations.push('Implement duplicate detection in UTXO key generation');
    }

    const healthCheck: HealthCheck = {
      status,
      checks: {
        utxoKeyValidation,
        performanceAcceptable,
        noDuplicates,
        systemResponsive
      },
      issues,
      recommendations,
      timestamp
    };

    console.log('🏥 Health check completed:', healthCheck);
    return healthCheck;
  }

  /**
   * Checks if system is responsive
   */
  private checkSystemResponsiveness(): boolean {
    try {
      const startTime = performance.now();
      // Perform a simple operation
      const testKey = 'test::0::test::0.00000000';
      validateUTXOKey(testKey);
      const endTime = performance.now();
      
      return (endTime - startTime) < 100; // Should complete in under 100ms
    } catch {
      return false;
    }
  }

  /**
   * Gets recent performance metrics
   */
  getRecentMetrics(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Gets performance trends
   */
  getPerformanceTrends(): {
    utxoKeyGenerationTrend: 'improving' | 'stable' | 'degrading';
    utxoKeyMatchingTrend: 'improving' | 'stable' | 'degrading';
    averageGenerationTime: number;
    averageMatchingTime: number;
  } {
    const recent = this.getRecentMetrics(10);
    const older = this.metrics.slice(-20, -10);
    
    if (recent.length === 0 || older.length === 0) {
      return {
        utxoKeyGenerationTrend: 'stable',
        utxoKeyMatchingTrend: 'stable',
        averageGenerationTime: 0,
        averageMatchingTime: 0
      };
    }
    
    const recentAvgGen = recent.reduce((sum, m) => sum + m.utxoKeyGenerationTime, 0) / recent.length;
    const olderAvgGen = older.reduce((sum, m) => sum + m.utxoKeyGenerationTime, 0) / older.length;
    
    const recentAvgMatch = recent.reduce((sum, m) => sum + m.utxoKeyMatchingTime, 0) / recent.length;
    const olderAvgMatch = older.reduce((sum, m) => sum + m.utxoKeyMatchingTime, 0) / older.length;
    
    const generationTrend = recentAvgGen < olderAvgGen * 0.9 ? 'improving' : 
                           recentAvgGen > olderAvgGen * 1.1 ? 'degrading' : 'stable';
    
    const matchingTrend = recentAvgMatch < olderAvgMatch * 0.9 ? 'improving' : 
                         recentAvgMatch > olderAvgMatch * 1.1 ? 'degrading' : 'stable';
    
    return {
      utxoKeyGenerationTrend: generationTrend,
      utxoKeyMatchingTrend: matchingTrend,
      averageGenerationTime: recentAvgGen,
      averageMatchingTime: recentAvgMatch
    };
  }

  /**
   * Creates an alert
   */
  createAlert(type: 'error' | 'warning' | 'info', message: string): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      resolved: false
    };
    
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertsHistory);
    }
    
    console.log(`🚨 Alert created [${type.toUpperCase()}]:`, message);
  }

  /**
   * Gets active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolves an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Alert resolved:`, alert.message);
      return true;
    }
    return false;
  }

  /**
   * Gets system status summary
   */
  getSystemStatus(): {
    overallHealth: 'healthy' | 'warning' | 'critical';
    activeAlerts: number;
    performanceTrends: ReturnType<typeof this.getPerformanceTrends>;
    recentMetrics: PerformanceMetrics | null;
  } {
    const recentMetrics = this.metrics[this.metrics.length - 1] || null;
    const activeAlerts = this.getActiveAlerts().length;
    const performanceTrends = this.getPerformanceTrends();
    
    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (activeAlerts > 0) {
      const criticalAlerts = this.getActiveAlerts().filter(a => a.type === 'error').length;
      overallHealth = criticalAlerts > 0 ? 'critical' : 'warning';
    }
    
    return {
      overallHealth,
      activeAlerts,
      performanceTrends,
      recentMetrics
    };
  }
}

// Export singleton instance
export const utxoMonitor = new UTXOMonitor();

/**
 * Utility function to wrap UTXO operations with monitoring
 */
export function withMonitoring<T>(
  operation: () => T,
  operationType: 'generation' | 'matching'
): T {
  if (operationType === 'generation') {
    return utxoMonitor.measureUtxoKeyGeneration(operation);
  } else {
    return utxoMonitor.measureUtxoKeyMatching(operation);
  }
}

/**
 * Utility function to perform health check on connections
 */
export function performUtxoHealthCheck(connections: Array<{ utxoKey?: string }>): HealthCheck {
  return utxoMonitor.performHealthCheck(connections);
}

/**
 * Utility function to validate UTXO key health
 */
export function validateUtxoHealth(connections: Array<{ utxoKey?: string }>): {
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  issues: string[];
} {
  return utxoMonitor.validateUtxoKeyHealth(connections);
}