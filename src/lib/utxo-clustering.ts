/*
  Ported UTXOClusteringService from jason-flowtrace.
  This version removes direct dependencies on NetworkGraph types to keep it self-contained.
*/

export interface UTXO {
  id: string
  txHash: string
  vout: number
  amount: number
  address: string
  blockHeight?: number
  confirmations?: number
  spent?: boolean
  spentTxHash?: string
  entityName?: string
  entityType?: string
  // Graph context
  fromNodeId?: string
  toNodeId?: string
  direction?: 'in' | 'out'
}

export interface WalletCluster {
  id: string
  label: string
  addresses: string[]
  utxos: UTXO[]
  totalBalance: number
  entityName?: string
  entityType?: string
  txGroups: Map<string, UTXO[]> // Grouped by TXID
  isExpanded: boolean
  // Enhanced clustering properties
  clusteringStrategy: 'address' | 'transaction' | 'temporal' | 'entity' | 'hybrid'
  confidence: number // 0-100, how confident we are this is a cluster
  riskScore: number // 0-100, calculated risk score
  lastActivity?: Date
  firstActivity?: Date
  addressReuseCount: number
  transactionPatterns: string[]
  metadata: Record<string, any>
  notes?: Array<{
    id: string
    userId: string
    userName: string
    content: string
    timestamp: string
    tags?: string[]
  }>
}

export interface GroupedTransaction {
  txid: string
  utxos: UTXO[]
  totalAmount: number
  blockHeight?: number
  confirmations?: number
  timestamp?: string
  fee?: number
}

export interface ClusteringOptions {
  strategy: 'address' | 'transaction' | 'temporal' | 'entity' | 'hybrid'
  minConfidence: number
  temporalWindowHours: number
  addressReuseThreshold: number
  enableRiskScoring: boolean
  enablePatternDetection: boolean
}

export interface ClusteringResult {
  clusters: WalletCluster[]
  statistics: {
    totalClusters: number
    totalUTXOs: number
    averageClusterSize: number
    clusteringConfidence: number
    riskDistribution: Record<string, number>
  }
}

/*
  Singleton service that clusters UTXOs by address and transaction.
  Provides helpers used by WalletClusterPanel.
*/
export class UTXOClusteringService {
  private static instance: UTXOClusteringService
  private clusters: Map<string, WalletCluster> = new Map()

  static getInstance(): UTXOClusteringService {
    if (!UTXOClusteringService.instance) {
      UTXOClusteringService.instance = new UTXOClusteringService()
    }
    return UTXOClusteringService.instance
  }

  // Enhanced clustering with multiple strategies
  createWalletClusters(utxos: UTXO[], options?: Partial<ClusteringOptions>): WalletCluster[] {
    const opts: ClusteringOptions = {
      strategy: 'hybrid',
      minConfidence: 60,
      temporalWindowHours: 24,
      addressReuseThreshold: 2,
      enableRiskScoring: true,
      enablePatternDetection: true,
      ...options
    }

    switch (opts.strategy) {
      case 'address':
        return this.clusterByAddress(utxos, opts)
      case 'transaction':
        return this.clusterByTransaction(utxos, opts)
      case 'temporal':
        return this.clusterByTemporal(utxos, opts)
      case 'entity':
        return this.clusterByEntity(utxos, opts)
      case 'hybrid':
      default:
        return this.clusterHybrid(utxos, opts)
    }
  }

  // Original address-based clustering
  private clusterByAddress(utxos: UTXO[], options: ClusteringOptions): WalletCluster[] {
    const addressGroups = new Map<string, UTXO[]>()
    const txGroups = new Map<string, Map<string, UTXO[]>>()

    utxos.forEach((utxo) => {
      if (!addressGroups.has(utxo.address)) {
        addressGroups.set(utxo.address, [])
      }
      addressGroups.get(utxo.address)!.push(utxo)
    })

    addressGroups.forEach((addressUtxos, address) => {
      const txMap = new Map<string, UTXO[]>()
      addressUtxos.forEach((utxo) => {
        if (!txMap.has(utxo.txHash)) {
          txMap.set(utxo.txHash, [])
        }
        txMap.get(utxo.txHash)!.push(utxo)
      })
      txGroups.set(address, txMap)
    })

    const clusters: WalletCluster[] = []
    txGroups.forEach((txMap, address) => {
      txMap.forEach((txUtxos, txid) => {
        const cluster = this.createCluster(
          `${address}-${txid}`,
          address,
          txUtxos,
          txid,
          'address',
          options
        )
        clusters.push(cluster)
        this.clusters.set(cluster.id, cluster)
      })
    })

    return clusters
  }

  // Transaction-based clustering (group by transaction patterns)
  private clusterByTransaction(utxos: UTXO[], options: ClusteringOptions): WalletCluster[] {
    const txGroups = new Map<string, UTXO[]>()
    
    utxos.forEach((utxo) => {
      if (!txGroups.has(utxo.txHash)) {
        txGroups.set(utxo.txHash, [])
      }
      txGroups.get(utxo.txHash)!.push(utxo)
    })

    const clusters: WalletCluster[] = []
    txGroups.forEach((txUtxos, txid) => {
      // Group by entity if available, otherwise by address
      const entityGroups = new Map<string, UTXO[]>()
      txUtxos.forEach(utxo => {
        const key = utxo.entityName || utxo.address
        if (!entityGroups.has(key)) {
          entityGroups.set(key, [])
        }
        entityGroups.get(key)!.push(utxo)
      })

      entityGroups.forEach((groupUtxos, entityKey) => {
        const cluster = this.createCluster(
          `tx-${txid}-${entityKey}`,
          entityKey,
          groupUtxos,
          txid,
          'transaction',
          options
        )
        clusters.push(cluster)
        this.clusters.set(cluster.id, cluster)
      })
    })

    return clusters
  }

  // Temporal clustering (group by time windows)
  private clusterByTemporal(utxos: UTXO[], options: ClusteringOptions): WalletCluster[] {
    const temporalGroups = new Map<string, UTXO[]>()
    const windowMs = options.temporalWindowHours * 60 * 60 * 1000

    utxos.forEach((utxo) => {
      // Use block height as proxy for time if available
      const timeKey = utxo.blockHeight 
        ? Math.floor(utxo.blockHeight / (options.temporalWindowHours / 24)) // Group by day blocks
        : Math.floor(Date.now() / windowMs) // Fallback to current time
      
      const key = `${timeKey}-${utxo.entityName || utxo.address}`
      if (!temporalGroups.has(key)) {
        temporalGroups.set(key, [])
      }
      temporalGroups.get(key)!.push(utxo)
    })

    const clusters: WalletCluster[] = []
    temporalGroups.forEach((groupUtxos, timeKey) => {
      const cluster = this.createCluster(
        `temporal-${timeKey}`,
        groupUtxos[0]?.entityName || groupUtxos[0]?.address || 'Unknown',
        groupUtxos,
        groupUtxos[0]?.txHash || 'unknown',
        'temporal',
        options
      )
      clusters.push(cluster)
      this.clusters.set(cluster.id, cluster)
    })

    return clusters
  }

  // Entity-based clustering (group by entity type/name)
  private clusterByEntity(utxos: UTXO[], options: ClusteringOptions): WalletCluster[] {
    const entityGroups = new Map<string, UTXO[]>()

    utxos.forEach((utxo) => {
      const entityKey = utxo.entityName || utxo.entityType || utxo.address
      if (!entityGroups.has(entityKey)) {
        entityGroups.set(entityKey, [])
      }
      entityGroups.get(entityKey)!.push(utxo)
    })

    const clusters: WalletCluster[] = []
    entityGroups.forEach((groupUtxos, entityKey) => {
      const cluster = this.createCluster(
        `entity-${entityKey}`,
        entityKey,
        groupUtxos,
        groupUtxos[0]?.txHash || 'unknown',
        'entity',
        options
      )
      clusters.push(cluster)
      this.clusters.set(cluster.id, cluster)
    })

    return clusters
  }

  // Hybrid clustering combining multiple strategies
  private clusterHybrid(utxos: UTXO[], options: ClusteringOptions): WalletCluster[] {
    // Start with entity-based clustering
    const entityClusters = this.clusterByEntity(utxos, options)
    
    // Then apply temporal and transaction refinements
    const refinedClusters: WalletCluster[] = []
    
    entityClusters.forEach(cluster => {
      // Split large clusters by transaction patterns
      if (cluster.utxos.length > 10) {
        const txGroups = new Map<string, UTXO[]>()
        cluster.utxos.forEach(utxo => {
          if (!txGroups.has(utxo.txHash)) {
            txGroups.set(utxo.txHash, [])
          }
          txGroups.get(utxo.txHash)!.push(utxo)
        })

        txGroups.forEach((txUtxos, txid) => {
          const subCluster = this.createCluster(
            `${cluster.id}-tx-${txid}`,
            cluster.entityName || cluster.addresses[0],
            txUtxos,
            txid,
            'hybrid',
            options
          )
          refinedClusters.push(subCluster)
        })
      } else {
        refinedClusters.push(cluster)
      }
    })

    return refinedClusters
  }

  // Helper to create a cluster with enhanced properties
  private createCluster(
    id: string,
    entityKey: string,
    utxos: UTXO[],
    primaryTxHash: string,
    strategy: WalletCluster['clusteringStrategy'],
    options: ClusteringOptions
  ): WalletCluster {
    const totalBalance = utxos.reduce((sum, u) => sum + u.amount, 0)
    const entityName = utxos[0]?.entityName || entityKey
    const entityType = utxos[0]?.entityType || 'wallet'
    const utxoCount = utxos.length
    
    // Calculate confidence based on clustering strategy
    let confidence = 50
    if (strategy === 'entity' && utxos[0]?.entityName) confidence = 90
    else if (strategy === 'transaction') confidence = 80
    else if (strategy === 'address') confidence = 70
    else if (strategy === 'temporal') confidence = 60
    else if (strategy === 'hybrid') confidence = 85

    // Calculate risk score
    const riskScore = options.enableRiskScoring ? this.calculateRiskScore(utxos) : 0

    // Detect transaction patterns
    const transactionPatterns = options.enablePatternDetection 
      ? this.detectTransactionPatterns(utxos) 
      : []

    // Calculate address reuse
    const addressReuseCount = new Set(utxos.map(u => u.address)).size

    // Calculate temporal range
    const timestamps = utxos
      .map(u => u.blockHeight ? new Date(u.blockHeight * 600000) : new Date()) // Rough block time
      .filter(Boolean)
      .sort()
    
    const firstActivity = timestamps[0]
    const lastActivity = timestamps[timestamps.length - 1]

    const label = utxoCount > 1 
      ? `${entityName} (${utxoCount} UTXOs)` 
      : `${entityName} (Wallet Cluster)`

    return {
      id,
      label,
      addresses: Array.from(new Set(utxos.map(u => u.address))),
      utxos,
      totalBalance,
      entityName,
      entityType,
      txGroups: new Map([[primaryTxHash, utxos]]),
      isExpanded: false,
      clusteringStrategy: strategy,
      confidence,
      riskScore,
      lastActivity,
      firstActivity,
      addressReuseCount,
      transactionPatterns,
      metadata: {
        primaryTxHash,
        utxoCount,
        avgUtxoAmount: totalBalance / utxoCount,
        clusteringTimestamp: new Date().toISOString()
      }
    }
  }

  // Calculate risk score based on UTXO patterns
  private calculateRiskScore(utxos: UTXO[]): number {
    let riskScore = 0
    
    // Base risk from UTXO count
    riskScore += Math.min(30, utxos.length * 2)
    
    // Risk from large amounts
    const totalAmount = utxos.reduce((sum, u) => sum + u.amount, 0)
    if (totalAmount > 10) riskScore += 25
    else if (totalAmount > 1) riskScore += 15
    
    // Risk from entity type
    const hasExchange = utxos.some(u => u.entityType === 'exchange')
    if (hasExchange) riskScore += 20
    
    // Risk from address reuse
    const uniqueAddresses = new Set(utxos.map(u => u.address)).size
    if (uniqueAddresses === 1) riskScore += 10 // Single address reuse
    
    // Risk from transaction patterns
    const uniqueTxs = new Set(utxos.map(u => u.txHash)).size
    if (uniqueTxs < utxos.length / 2) riskScore += 15 // Many UTXOs from few transactions
    
    return Math.min(100, riskScore)
  }

  // Detect common transaction patterns
  private detectTransactionPatterns(utxos: UTXO[]): string[] {
    const patterns: string[] = []
    
    // Check for dust transactions
    const dustCount = utxos.filter(u => u.amount < 0.00001).length
    if (dustCount > utxos.length * 0.5) patterns.push('dust-transactions')
    
    // Check for round amounts
    const roundAmounts = utxos.filter(u => u.amount % 0.1 === 0).length
    if (roundAmounts > utxos.length * 0.3) patterns.push('round-amounts')
    
    // Check for sequential transactions
    const txHashes = utxos.map(u => u.txHash).sort()
    let sequential = 0
    for (let i = 1; i < txHashes.length; i++) {
      if (txHashes[i] === txHashes[i-1]) sequential++
    }
    if (sequential > utxos.length * 0.2) patterns.push('sequential-transactions')
    
    return patterns
  }

  expandCluster(clusterId: string): UTXO[] {
    const cluster = this.clusters.get(clusterId)
    if (!cluster) return []
    cluster.isExpanded = true
    return cluster.utxos
  }

  collapseCluster(clusterId: string): void {
    const cluster = this.clusters.get(clusterId)
    if (cluster) cluster.isExpanded = false
  }

  // Returns grouped transactions for a given cluster (grouped by txid)
  getGroupedTransactions(clusterId: string): GroupedTransaction[] {
    const cluster = this.clusters.get(clusterId)
    if (!cluster) return []

    const grouped: GroupedTransaction[] = []
    cluster.txGroups.forEach((utxos, txid) => {
      const totalAmount = utxos.reduce((sum, u) => sum + u.amount, 0)
      grouped.push({
        txid,
        utxos,
        totalAmount,
        blockHeight: utxos[0]?.blockHeight,
        confirmations: utxos[0]?.confirmations,
        timestamp: new Date().toISOString(),
        fee: 0,
      })
    })
    return grouped
  }

  // Simple search util
  findClusters(query: string): WalletCluster[] {
    const q = query.toLowerCase()
    return Array.from(this.clusters.values()).filter(
      (c) => c.entityName?.toLowerCase().includes(q) || c.addresses.some((a) => a.toLowerCase().includes(q))
    )
  }

  // Enhanced clustering with options
  createAdvancedClusters(utxos: UTXO[], options: ClusteringOptions): ClusteringResult {
    const clusters = this.createWalletClusters(utxos, options)
    
    // Calculate statistics
    const totalUTXOs = clusters.reduce((sum, c) => sum + c.utxos.length, 0)
    const avgClusterSize = clusters.length > 0 ? totalUTXOs / clusters.length : 0
    const avgConfidence = clusters.length > 0 
      ? clusters.reduce((sum, c) => sum + c.confidence, 0) / clusters.length 
      : 0
    
    // Risk distribution
    const riskDistribution = {
      low: clusters.filter(c => c.riskScore < 40).length,
      medium: clusters.filter(c => c.riskScore >= 40 && c.riskScore < 70).length,
      high: clusters.filter(c => c.riskScore >= 70).length
    }

    return {
      clusters,
      statistics: {
        totalClusters: clusters.length,
        totalUTXOs,
        averageClusterSize: avgClusterSize,
        clusteringConfidence: avgConfidence,
        riskDistribution
      }
    }
  }

  // Get clusters by strategy
  getClustersByStrategy(strategy: WalletCluster['clusteringStrategy']): WalletCluster[] {
    return Array.from(this.clusters.values()).filter(c => c.clusteringStrategy === strategy)
  }

  // Get high-risk clusters
  getHighRiskClusters(threshold: number = 70): WalletCluster[] {
    return Array.from(this.clusters.values()).filter(c => c.riskScore >= threshold)
  }

  // Get clusters by entity type
  getClustersByEntityType(entityType: string): WalletCluster[] {
    return Array.from(this.clusters.values()).filter(c => c.entityType === entityType)
  }

  // Analyze cluster relationships
  analyzeClusterRelationships(): Map<string, string[]> {
    const relationships = new Map<string, string[]>()
    
    this.clusters.forEach((cluster, clusterId) => {
      const related: string[] = []
      
      // Find clusters with shared addresses
      cluster.addresses.forEach(address => {
        this.clusters.forEach((otherCluster, otherId) => {
          if (otherId !== clusterId && otherCluster.addresses.includes(address)) {
            if (!related.includes(otherId)) {
              related.push(otherId)
            }
          }
        })
      })
      
      // Find clusters with shared transaction patterns
      cluster.transactionPatterns.forEach(pattern => {
        this.clusters.forEach((otherCluster, otherId) => {
          if (otherId !== clusterId && otherCluster.transactionPatterns.includes(pattern)) {
            if (!related.includes(otherId)) {
              related.push(otherId)
            }
          }
        })
      })
      
      relationships.set(clusterId, related)
    })
    
    return relationships
  }

  getClusterStats() {
    let totalUTXOs = 0
    let totalBalance = 0
    let totalRiskScore = 0
    let totalConfidence = 0
    
    this.clusters.forEach((c) => {
      totalUTXOs += c.utxos.length
      totalBalance += c.totalBalance
      totalRiskScore += c.riskScore
      totalConfidence += c.confidence
    })
    
    return {
      totalClusters: this.clusters.size,
      totalUTXOs,
      totalBalance,
      averageUTXOsPerCluster: this.clusters.size > 0 ? totalUTXOs / this.clusters.size : 0,
      averageRiskScore: this.clusters.size > 0 ? totalRiskScore / this.clusters.size : 0,
      averageConfidence: this.clusters.size > 0 ? totalConfidence / this.clusters.size : 0,
      strategyDistribution: this.getStrategyDistribution(),
      riskDistribution: this.getRiskDistribution()
    }
  }

  private getStrategyDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {}
    this.clusters.forEach(c => {
      distribution[c.clusteringStrategy] = (distribution[c.clusteringStrategy] || 0) + 1
    })
    return distribution
  }

  private getRiskDistribution(): Record<string, number> {
    return {
      low: this.clusters.size > 0 ? Array.from(this.clusters.values()).filter(c => c.riskScore < 40).length : 0,
      medium: this.clusters.size > 0 ? Array.from(this.clusters.values()).filter(c => c.riskScore >= 40 && c.riskScore < 70).length : 0,
      high: this.clusters.size > 0 ? Array.from(this.clusters.values()).filter(c => c.riskScore >= 70).length : 0
    }
  }
}

export default UTXOClusteringService