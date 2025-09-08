import React, { useEffect, useMemo, useState } from 'react'
import { Wallet, Search, Filter, ChevronDown, ChevronRight, Bitcoin } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Card, CardContent } from '../../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Checkbox } from '../../../components/ui/checkbox'

import { UTXOClusteringService, WalletCluster, UTXO } from '../../../lib/utxo-clustering'
import { GroupedTransactionView } from './GroupedTransactionView'
import type { FTNode, FTConnection } from './NetworkGraph'
import { flowtraceService } from '../../../services/flowtraceService'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: FTNode[]
  connections: FTConnection[]
  consolidatedEntities: string[]
  onConfirmSelection?: (entityKey: string, utxos: UTXO[]) => void
  onUndoAggregation?: (entityKey: string) => void
}

/*
  Lightweight port of wallet-cluster-panel from reference project.
  Some advanced features (refresh stats, additional API enrichment) are trimmed.
*/
export const WalletClusterPanel: React.FC<Props> = ({
  open,
  onOpenChange,
  nodes,
  connections,
  consolidatedEntities = [],
  onConfirmSelection,
  onUndoAggregation,
}) => {
  const clusteringService = UTXOClusteringService.getInstance()

  const [clusters, setClusters] = useState<WalletCluster[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())
  const [selectedUtxoIds, setSelectedUtxoIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('clusters')

  // Helper: transform connections to utxos (simplified from reference)
  const connectionsToUtxos = (edges: FTConnection[]): UTXO[] => {
    const out: UTXO[] = []
    edges.forEach((c, idx) => {
      if (!c.txHash || !c.amount) return
      const amount = parseFloat(String(c.amount))
      if (!isFinite(amount) || amount <= 0) return
      const src = nodes.find((n) => n.id === c.from)
      const dst = nodes.find((n) => n.id === c.to)
      out.push({
        id: `u-${c.txHash}-${idx}-src`,
        txHash: c.txHash,
        vout: idx,
        amount,
        address: src?.label || src?.id || 'unknown',
        entityName: src?.label,
        entityType: src?.entityType,
        fromNodeId: c.from,
        toNodeId: c.to,
      })
      if (dst && dst !== src) {
        out.push({
          id: `u-${c.txHash}-${idx}-dst`,
          txHash: c.txHash,
          vout: idx + 1000,
          amount,
          address: dst?.label || dst?.id || 'unknown',
          entityName: dst?.label,
          entityType: dst?.entityType,
          fromNodeId: c.from,
          toNodeId: c.to,
        })
      }
    })
    return out
  }

  // (Optional) enrich missing block info using existing service
  const enrichUtxos = async (utxos: UTXO[]): Promise<UTXO[]> => {
    const enriched = [...utxos]
    const addrSet = new Set<string>()
    utxos.forEach((u) => {
      if (!u.blockHeight) addrSet.add(u.address)
    })
    for (const addr of addrSet) {
      try {
        const resp: any = await flowtraceService.fetchAllTransactions(addr, 50)
        const txs = resp?.txs || []
        enriched.forEach((u) => {
          if (u.address !== addr) return
          const t = txs.find((t: any) => t.txid === u.txHash)
          if (t) {
            u.blockHeight = t.block_height
            u.confirmations = t.confirmations
          }
        })
      } catch {
        /* ignore */
      }
    }
    return enriched
  }

  // Build clusters when inputs change
  useEffect(() => {
    const build = async () => {
      const utxos = await enrichUtxos(connectionsToUtxos(connections))
      const cls = clusteringService.createWalletClusters(utxos)
      setClusters(cls)
    }
    if (nodes.length && connections.length) build()
    else setClusters([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, connections])

  // Group clusters by entity key (label)
  const entityGroups = useMemo(() => {
    const map = new Map<string, { utxos: UTXO[]; total: number; type?: string }>()
    clusters.forEach((c) => {
      const key = c.entityName || c.label
      if (!key) return
      const g = map.get(key) || { utxos: [], total: 0, type: c.entityType }
      g.utxos.push(...c.utxos)
      g.total += c.totalBalance
      if (!g.type) g.type = c.entityType
      map.set(key, g)
    })
    const arr = Array.from(map.entries()).map(([k, v]) => ({ entityKey: k, entityName: k, ...v }))
    arr.sort((a, b) => b.total - a.total)
    return arr
  }, [clusters])

  const toggleEntityExpand = (k: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev)
      next.has(k) ? next.delete(k) : next.add(k)
      return next
    })
  }

  const isUtxoSelected = (id: string) => selectedUtxoIds.has(id)
  const toggleUtxo = (id: string) => {
    setSelectedUtxoIds((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const formatBtc = (v?: number) => {
    const num = Number(v)
    return (isFinite(num) ? num : 0).toFixed(8)
  }

  // visible stats
  const visibleUtxoCount = entityGroups.reduce((sum, g) => sum + g.utxos.length, 0)
  const visibleBalance = entityGroups.reduce((sum, g) => sum + (g.totalBalance || 0), 0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (clusters.length) setLastUpdated(new Date())
  }, [clusters])

  // All UTXOs across clusters
  const allUtxos = clusters.flatMap((c) => c.utxos)
  const allIds = allUtxos.map((u) => u.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedUtxoIds.has(id))

  const toggleAll = () => {
    setSelectedUtxoIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        // clear all
        allIds.forEach((id) => next.delete(id))
      } else {
        // select all
        allIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[90vw] max-h-[85vh] bg-card border-2 border-border text-foreground shadow-2xl p-0 overflow-hidden ring-4 ring-primary/40 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Wallet Clusters
            <Badge variant="secondary" className="ml-auto">{entityGroups.length}</Badge>
          </DialogTitle>
          <div className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-8" />
            </div>
            <Button variant="outline" size="sm" onClick={() => {/* refresh placeholder */}}>
              <Filter className="h-4 w-4" /> Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{visibleUtxoCount}</div>
              <div className="text-xs text-muted-foreground">Total UTXOs</div>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatBtc(
                  entityGroups.reduce((sum, g) => {
                    const selectedUtxos = g.utxos.filter(u => selectedUtxoIds.has(u.id))
                    return sum + selectedUtxos.reduce((acc, u) => acc + u.amount, 0)
                  }, 0)
                )}
              </div>
              <div className="text-xs text-muted-foreground">Total Balance (BTC)</div>
            </div>
          </div>

          {lastUpdated && (
            <div className="text-xs text-muted-foreground text-center pt-2">Last updated: {lastUpdated.toLocaleTimeString()}</div>
          )}

        </DialogHeader>

        <Card className="h-full border-0 shadow-none flex flex-col">
          <CardContent className="pt-0 flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="clusters">Clusters</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="clusters" className="mt-4 space-y-2">
                {entityGroups
                  .filter((g) =>
                    searchQuery ? g.entityName.toLowerCase().includes(searchQuery.toLowerCase()) : true,
                  )
                  .map((g) => {
                    const expanded = expandedEntities.has(g.entityKey)
                    return (
                      <div
                        key={g.entityKey}
                        className={`p-3 border rounded-lg cursor-pointer text-gray-900 ${expanded ? 'border-blue-500 bg-blue-50' : 'hover:bg-blue-50'}`}
                        onClick={() => toggleEntityExpand(g.entityKey)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="font-medium text-sm">{g.entityName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span>
                              {(() => {
                                const selectedUtxos = g.utxos.filter(u => selectedUtxoIds.has(u.id))
                                const sum = selectedUtxos.reduce((acc, u) => acc + u.amount, 0)
                                return `${formatBtc(sum)} BTC`
                              })()}
                            </span>
                            <Badge>{g.utxos.length} UTXOs</Badge>

                            {/* Per-entity select */}
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                const allSelected = g.utxos.every((u) => selectedUtxoIds.has(u.id))
                                setSelectedUtxoIds((prev) => {
                                  const next = new Set(prev)
                                  if (allSelected) g.utxos.forEach((u) => next.delete(u.id))
                                  else g.utxos.forEach((u) => next.add(u.id))
                                  return next
                                })
                              }}
                              className="h-6 px-2 text-xs dark:text-gray-300"
                            >
                              {g.utxos.every((u) => selectedUtxoIds.has(u.id)) ? 'Deselect' : 'Select'}
                            </Button>
                          </div>
                        </div>
                        {expanded && (
                          <div className="mt-3 space-y-1">
                            {g.utxos.map((u) => (
                              <div key={u.id} className="flex justify-between items-center text-xs bg-gray-50 rounded p-1">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={isUtxoSelected(u.id)}
                                    onCheckedChange={() => toggleUtxo(u.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Bitcoin className="h-3 w-3 text-orange-500" />
                                  <span className="font-mono">{u.txHash.substring(0, 8)}...</span>
                                  <span>#{u.vout}</span>
                                </div>
                                <span>{formatBtc(u.amount)} BTC</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                {/* Placeholder: could show selected cluster details here */}
                <div className="text-center text-muted-foreground py-8">Select a cluster on the left</div>
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* Footer with Select All & Confirm */}
          <div className="sticky bottom-0 border-t border-border bg-background p-4 flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} /> Select All ({allIds.length})
            </label>
            <Button
              onClick={() => {
                if (!onConfirmSelection) return
                const map = new Map<string, UTXO[]>()
                allUtxos.forEach((u) => {
                  if (!selectedUtxoIds.has(u.id)) return
                  const key = u.entityName || 'unknown'
                  if (!map.has(key)) map.set(key, [])
                  map.get(key)!.push(u)
                })

                map.forEach((utxos, key) => onConfirmSelection(key, utxos))

                setSelectedUtxoIds(new Set())
              }}
              disabled={selectedUtxoIds.size === 0}
            >
              Confirm ({selectedUtxoIds.size})
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}