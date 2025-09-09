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

  // Group UTXOs by address and TXID to create wallet clusters
  createWalletClusters(utxos: UTXO[]): WalletCluster[] {
    const addressGroups = new Map<string, UTXO[]>()
    const txGroups = new Map<string, Map<string, UTXO[]>>() // address -> txid -> utxos

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
        const clusterId = `${address}-${txid}`
        const totalBalance = txUtxos.reduce((sum, u) => sum + u.amount, 0)
        const entityName = txUtxos[0]?.entityName || 'Unknown Entity'
        const entityType = txUtxos[0]?.entityType || 'wallet'
        const utxoCount = txUtxos.length
        const label = utxoCount > 1 ? `${entityName} (${utxoCount} UTXOs)` : `${entityName} (Wallet Cluster)`

        const cluster: WalletCluster = {
          id: clusterId,
          label,
          addresses: [address],
          utxos: txUtxos,
          totalBalance,
          entityName,
          entityType,
          txGroups: new Map([[txid, txUtxos]]),
          isExpanded: false,
        }

        clusters.push(cluster)
        this.clusters.set(clusterId, cluster)
      })
    })

    return clusters
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

  getClusterStats() {
    let totalUTXOs = 0
    let totalBalance = 0
    this.clusters.forEach((c) => {
      totalUTXOs += c.utxos.length
      totalBalance += c.totalBalance
    })
    return {
      totalClusters: this.clusters.size,
      totalUTXOs,
      totalBalance,
      averageUTXOsPerCluster: this.clusters.size > 0 ? totalUTXOs / this.clusters.size : 0,
    }
  }
}

export default UTXOClusteringService