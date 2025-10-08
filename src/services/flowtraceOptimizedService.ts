import { axiosInstance } from '../api/api';

export interface OptimizedFlowTraceResponse {
  success: boolean;
  data: {
    address: string;
    transactions: any[];
    enhancedData: any[];
    riskScores: Record<string, any>;
    summary: {
      totalTransactions: number;
      uniqueAddresses: number;
      hasAttribution: boolean;
    };
  };
  performance: {
    addressesProcessed: number;
    lookupTime: number;
    totalTime: number;
    apiCallsSaved: number;
    optimization: string;
  };
}

export interface BatchFlowTraceResponse {
  success: boolean;
  data: Array<{
    address: string;
    success: boolean;
    data?: any;
    error?: string;
  }>;
  performance: {
    addressesProcessed: number;
    totalTime: number;
    averageTimePerAddress: number;
    apiCallsSaved: number;
    optimization: string;
  };
}

/**
 * Optimized FlowTrace service
 * Uses new backend endpoints for dramatically improved performance
 */
export const flowtraceOptimizedService = {
  
  /**
   * Main FlowTrace expansion - replaces 15-20 API calls with 1
   */
  async expandNode(address: string, options: {
    includeRiskScores?: boolean;
    includeTransactions?: boolean;
  } = {}): Promise<OptimizedFlowTraceResponse> {
    console.log(`🚀 FlowTrace: Expanding node ${address} with optimized endpoint`);
    
    const response = await axiosInstance.post('/flowtrace/expand-node', {
      address,
      includeRiskScores: options.includeRiskScores ?? true,
      includeTransactions: options.includeTransactions ?? true
    });
    
    console.log(`✅ FlowTrace: Node expansion complete in ${response.data.performance.totalTime}ms`);
    console.log(`📊 Performance: ${response.data.performance.apiCallsSaved} API calls saved`);
    
    return response.data;
  },

  /**
   * Batch expand multiple nodes - useful for complex FlowTrace operations
   */
  async expandNodesBatch(addresses: string[], options: {
    includeRiskScores?: boolean;
  } = {}): Promise<BatchFlowTraceResponse> {
    console.log(`🚀 FlowTrace: Batch expanding ${addresses.length} nodes`);
    
    const response = await axiosInstance.post('/flowtrace/expand-nodes-batch', {
      addresses,
      includeRiskScores: options.includeRiskScores ?? false
    });
    
    console.log(`✅ FlowTrace: Batch expansion complete in ${response.data.performance.totalTime}ms`);
    console.log(`📊 Performance: ${response.data.performance.apiCallsSaved} API calls saved`);
    
    return response.data;
  },

  /**
   * Get FlowTrace performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    const response = await axiosInstance.get('/flowtrace/performance-metrics');
    return response.data;
  },

  /**
   * Clear FlowTrace cache (useful for testing)
   */
  async clearCache(): Promise<void> {
    await axiosInstance.post('/flowtrace/clear-cache');
    console.log('🧹 FlowTrace cache cleared');
  },

  /**
   * Legacy compatibility method - converts optimized response to old format
   * This allows gradual migration of existing FlowTrace code
   */
  async expandNodeLegacyFormat(address: string): Promise<any> {
    const optimizedResponse = await this.expandNode(address);
    
    // Convert to legacy format for backward compatibility
    const legacyFormat = {
      address: optimizedResponse.data.address,
      transactions: optimizedResponse.data.transactions,
      enhancedData: optimizedResponse.data.enhancedData,
      riskScores: optimizedResponse.data.riskScores,
      performance: optimizedResponse.performance
    };
    
    return legacyFormat;
  }
};

/**
 * Performance comparison utility
 */
export class FlowTracePerformanceMonitor {
  private static measurements: Array<{
    method: string;
    startTime: number;
    endTime: number;
    apiCalls: number;
    addressesProcessed: number;
  }> = [];

  static startMeasurement(method: string): void {
    this.measurements.push({
      method,
      startTime: Date.now(),
      endTime: 0,
      apiCalls: 0,
      addressesProcessed: 0
    });
  }

  static endMeasurement(method: string, apiCalls: number, addressesProcessed: number): void {
    const measurement = this.measurements.find(m => m.method === method && m.endTime === 0);
    if (measurement) {
      measurement.endTime = Date.now();
      measurement.apiCalls = apiCalls;
      measurement.addressesProcessed = addressesProcessed;
    }
  }

  static getPerformanceReport(): any {
    const report = this.measurements.map(m => ({
      method: m.method,
      duration: m.endTime - m.startTime,
      apiCalls: m.apiCalls,
      addressesProcessed: m.addressesProcessed,
      efficiency: m.addressesProcessed / m.apiCalls
    }));

    return {
      measurements: report,
      summary: {
        totalMeasurements: report.length,
        averageDuration: report.reduce((sum, r) => sum + r.duration, 0) / report.length,
        averageEfficiency: report.reduce((sum, r) => sum + r.efficiency, 0) / report.length
      }
    };
  }

  static clearMeasurements(): void {
    this.measurements = [];
  }
}
