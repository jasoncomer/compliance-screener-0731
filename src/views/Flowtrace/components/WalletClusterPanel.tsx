import React, { useMemo, useState } from 'react'

import { Bitcoin, ChevronDown, ChevronRight, Info, Search, SortAsc, SortDesc, Users,Wallet } from 'lucide-react'

import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Progress } from '../../../components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { connectionInvolvesAddress } from '../utils/utxoKeyGeneration'

import type { FTConnection,FTNode } from './NetworkGraph'

// Constants
const FILTER_THRESHOLDS = {
  LARGE_ENTITY_MIN_NODES: 3,
  HIGH_UTXO_MIN_COUNT: 10,
} as const

type SortByOption = 'utxos' | 'nodes' | 'name' | 'connections'
type FilterByOption = 'all' | 'large-entities' | 'high-utxos'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: FTNode[]
  connections: FTConnection[]
  consolidatedEntities: string[]
  onConfirmSelection?: (entityKey: string, utxos: any[]) => void
  onUndoAggregation?: (entityKey: string) => void
}

interface EntityGroup {
  entityId: string
  entityName: string
  entityType?: string
  nodes: FTNode[]
  totalConnections: number
  totalUtxoCount: number
  logoUrl?: string
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
  consolidatedEntities,
  onConfirmSelection,
  onUndoAggregation,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<SortByOption>('nodes')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<FilterByOption>('all')
  const [isCalculating, setIsCalculating] = useState(false)


  // Memoized UTXO count calculation with caching
  const utxoCountCache = useMemo(() => {
    const cache = new Map<string, number>()

    nodes.forEach(node => {
      let utxoCount = 0

      connections.forEach(conn => {
        // If this is an aggregated connection, use the original connections for UTXO count
        const connectionsToUse = conn.originalConnections || [conn]

        connectionsToUse.forEach(originalConn => {
          // Count each connection as a UTXO
          if (originalConn.from === node.id || originalConn.to === node.id) {
            utxoCount++
          }
        })
      })

      cache.set(node.id, utxoCount)
    })

    return cache
  }, [nodes, connections])

  // Group nodes by entity_id for aggregation
  const entityGroups = useMemo(() => {
    setIsCalculating(true)

    const entityMap = new Map<string, EntityGroup>()

    // Group nodes by entityId
    nodes.forEach(node => {
      if (!node.entityId) return

      const existing = entityMap.get(node.entityId)
      const nodeUtxoCount = utxoCountCache.get(node.id) || 0
      const nodeConnections = connections.filter(c => connectionInvolvesAddress(c, node.id)).length

      if (existing) {
        existing.nodes.push(node)
        existing.totalConnections += nodeConnections
        existing.totalUtxoCount += nodeUtxoCount
      } else {
        entityMap.set(node.entityId, {
          entityId: node.entityId,
          entityName: node.label || node.entityId,
          entityType: node.entityType,
          nodes: [node],
          totalConnections: nodeConnections,
          totalUtxoCount: nodeUtxoCount,
          logoUrl: node.logoUrl
        })
      }
    })

    // Convert to array and filter out single-node entities
    let arr = Array.from(entityMap.values())
      .filter(group => group.nodes.length > 1) // Only show entities with multiple nodes

    // Apply filters
    if (filterBy !== 'all') {
      arr = arr.filter(g => {
        switch (filterBy) {
          case 'large-entities': return g.nodes.length > FILTER_THRESHOLDS.LARGE_ENTITY_MIN_NODES
          case 'high-utxos': return g.totalUtxoCount > FILTER_THRESHOLDS.HIGH_UTXO_MIN_COUNT
          default: return true
        }
      })
    }

    // Apply sorting
    arr.sort((a, b) => {
      let aVal: number | string
      let bVal: number | string

      switch (sortBy) {
        case 'utxos':
          aVal = a.totalUtxoCount
          bVal = b.totalUtxoCount
          break
        case 'nodes':
          aVal = a.nodes.length
          bVal = b.nodes.length
          break
        case 'name':
          aVal = a.entityName.toLowerCase()
          bVal = b.entityName.toLowerCase()
          break
        case 'connections':
          aVal = a.totalConnections
          bVal = b.totalConnections
          break
        default:
          aVal = a.nodes.length
          bVal = b.nodes.length
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })

    setIsCalculating(false)
    return arr
  }, [nodes, connections, sortBy, sortOrder, filterBy, utxoCountCache])

  const toggleEntityExpand = (entityId: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev)
      next.has(entityId) ? next.delete(entityId) : next.add(entityId)
      return next
    })
  }


  // Filter entities by search query
  const filteredEntityGroups = useMemo(() => {
    if (!searchQuery) return entityGroups
    const lowerQuery = searchQuery.toLowerCase()
    return entityGroups.filter(g => g.entityName.toLowerCase().includes(lowerQuery))
  }, [entityGroups, searchQuery])

  // Enhanced statistics
  const stats = useMemo(() => {
    const totalNodes = entityGroups.reduce((sum, g) => sum + g.nodes.length, 0)
    const totalUtxoCount = entityGroups.reduce((sum, g) => sum + g.totalUtxoCount, 0)
    const totalConnections = entityGroups.reduce((sum, g) => sum + g.totalConnections, 0)
    const avgNodesPerEntity = entityGroups.length > 0 ? totalNodes / entityGroups.length : 0

    return {
      totalClusters: entityGroups.length,
      totalNodes,
      totalUtxoCount,
      totalConnections,
      avgNodesPerEntity
    }
  }, [entityGroups])


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[90vw] h-[90vh] bg-card border-2 border-border text-foreground shadow-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b gap-3">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <Wallet className="h-6 w-6 text-primary" aria-hidden="true" /> Wallet Clusters
          </DialogTitle>

          {/* Enhanced Controls */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entities..."
                className="pl-8"
                aria-label="Search entities by name"
              />
            </div>
            <Select value={filterBy} onValueChange={(value: FilterByOption) => setFilterBy(value)}>
              <SelectTrigger className="w-40 h-10" aria-label="Filter entities">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="large-entities">Large Entities</SelectItem>
                <SelectItem value="high-utxos">High UTXOs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: SortByOption) => setSortBy(value)}>
              <SelectTrigger className="w-40 h-10" aria-label="Sort by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utxos">UTXOs</SelectItem>
                <SelectItem value="nodes">Nodes</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="connections">Connections</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="default"
              className="h-10 w-10 p-0"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className="h-10 w-10 p-0"
                  aria-label="Information about Wallet Clusters"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="bottom" align="end">
                <div className="space-y-2">
                  <p className="font-semibold">About Wallet Clusters</p>
                  <p className="text-sm">This panel groups blockchain addresses that belong to the same entity (exchanges, services, or wallet clusters).</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Only entities with multiple addresses are shown</li>
                    <li>View UTXO counts and connection details for each entity</li>
                    <li>Use <strong>Aggregate</strong> to consolidate an entity's nodes into one in the graph</li>
                    <li>Use <strong>Un-aggregate</strong> to reverse the consolidation</li>
                    <li>Filter and sort entities to find what you need</li>
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 transition-all hover:shadow-md">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalClusters}</div>
              <div className="text-xs font-medium text-muted-foreground mt-1">Entities</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50 transition-all hover:shadow-md">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalNodes}</div>
              <div className="text-xs font-medium text-muted-foreground mt-1">Total Nodes</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50 transition-all hover:shadow-md">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalUtxoCount}
              </div>
              <div className="text-xs font-medium text-muted-foreground mt-1">Total UTXOs</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50 transition-all hover:shadow-md">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.totalConnections}</div>
              <div className="text-xs font-medium text-muted-foreground mt-1">Connections</div>
            </div>
          </div>

          {/* Average Nodes per Entity */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
              <span>Average Nodes per Entity</span>
              <span className="font-semibold">{stats.avgNodesPerEntity.toFixed(1)}</span>
            </div>
            <Progress value={Math.min(100, stats.avgNodesPerEntity * 10)} className="h-2.5" />
          </div>

        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 py-4 space-y-3">

                {/* Loading state */}
                {isCalculating ? (
                  <div className="text-center py-8 text-muted-foreground" role="status" aria-live="polite">
                    <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
                    <p>Calculating entity groups...</p>
                  </div>
                ) : entityGroups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                    <p>No entities with multiple nodes found.</p>
                    <p className="text-sm">Entities need to have multiple nodes to be shown here.</p>
                    <p className="text-xs mt-2">Total nodes: {nodes.length}, Total connections: {connections.length}</p>
                  </div>
                ) : filteredEntityGroups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                    <p>No entities match your search.</p>
                    <p className="text-sm">Try adjusting your search terms or filters.</p>
                    {searchQuery && <p className="text-xs mt-2">Searching for: "{searchQuery}"</p>}
                  </div>
                ) : (
                  filteredEntityGroups.map((g) => {
                    const expanded = expandedEntities.has(g.entityId)
                    const isConsolidated = consolidatedEntities.includes(g.entityId)

                    return (
                      <div
                        key={g.entityId}
                        className={`p-4 border rounded-xl cursor-pointer transition-all shadow-sm ${
                          expanded
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                            : 'border-border hover:border-blue-300 hover:bg-accent/50 dark:hover:bg-accent/20 hover:shadow-md'
                        } border-l-4 border-l-blue-500`}
                        onClick={() => toggleEntityExpand(g.entityId)}
                        role="button"
                        aria-expanded={expanded}
                        aria-label={`Entity: ${g.entityName}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggleEntityExpand(g.entityId)
                          }
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {expanded ? <ChevronDown className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" aria-hidden="true" /> : <ChevronRight className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />}
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              {g.logoUrl && (
                                <img src={g.logoUrl} alt={`${g.entityName} logo`} className="w-5 h-5 rounded flex-shrink-0" />
                              )}
                              <span className="font-semibold text-base truncate">{g.entityName}</span>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {g.entityType || 'entity'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:flex-shrink-0 pl-8 sm:pl-0">
                            <div className="text-left sm:text-right">
                              <div className="font-mono text-sm font-semibold">{g.totalUtxoCount} UTXOs</div>
                              <div className="text-xs text-muted-foreground">
                                {g.totalConnections} connections
                              </div>
                            </div>
                            <Badge variant="default" className="px-2.5 py-1">
                              {g.nodes.length} nodes
                            </Badge>

                            {/* Aggregate button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onConfirmSelection && !isConsolidated) {
                                  onConfirmSelection(g.entityId, [])
                                }
                              }}
                              disabled={isConsolidated}
                              className="h-8 px-3 text-xs font-medium"
                              aria-label={`Aggregate ${g.entityName}`}
                            >
                              {isConsolidated ? 'Aggregated' : 'Aggregate'}
                            </Button>
                          </div>
                        </div>

                        {/* Entity metadata */}
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-muted-foreground pl-8">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="font-medium">Entity ID: {g.entityId}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Bitcoin className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="font-medium">Avg: {Math.round(g.totalUtxoCount / g.nodes.length)} UTXOs/node</span>
                          </div>
                        </div>
                        
                        {expanded && (
                          <div className="mt-4 pt-4 border-t border-border/50 space-y-2 pl-8" role="list" aria-label="Entity nodes">
                            {g.nodes.map((node) => (
                              <div
                                key={node.id}
                                className="flex justify-between items-center text-xs bg-muted/30 dark:bg-muted/10 rounded-lg p-3 hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
                                role="listitem"
                              >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  {node.logoUrl && (
                                    <img src={node.logoUrl} alt={`${node.label || node.id} logo`} className="w-4 h-4 rounded flex-shrink-0" />
                                  )}
                                  <span className="font-mono text-xs">{node.id.substring(0, 12)}...</span>
                                  <span className="text-muted-foreground truncate">{node.label}</span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-mono font-medium">{utxoCountCache.get(node.id) || 0} UTXOs</div>
                                  <div className="text-muted-foreground">
                                    {connections.filter(c => connectionInvolvesAddress(c, node.id)).length} connections
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}

                {/* Consolidated Entities */}
                {consolidatedEntities.length > 0 && (
                  <>
                    <div className="mt-8 mb-4 pt-6 border-t-2 border-border/50">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2.5">
                        <Users className="h-5 w-5 text-green-600" aria-hidden="true" />
                        Consolidated Entities
                      </h3>
                    </div>
                    {consolidatedEntities.map((entityId) => {
                      const aggNode = nodes.find(n => n.id === `agg:${entityId.replace(/\s+/g, '_')}`)
                      if (!aggNode) return null

                      return (
                        <div
                          key={entityId}
                          className="p-4 border rounded-xl border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm hover:shadow-md transition-all"
                          role="article"
                          aria-label={`Consolidated entity: ${aggNode.label || entityId}`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {aggNode.logoUrl && (
                                <img src={aggNode.logoUrl} alt={`${aggNode.label} logo`} className="w-5 h-5 rounded flex-shrink-0" />
                              )}
                              <span className="font-semibold text-base truncate">{aggNode.label}</span>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {aggNode.entityType || 'entity'}
                              </Badge>
                              <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700 flex-shrink-0">
                                ✓ Consolidated
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <div className="font-mono text-sm font-semibold">{utxoCountCache.get(aggNode.id) || 0} UTXOs</div>
                                <div className="text-xs text-muted-foreground">
                                  {connections.filter(c => connectionInvolvesAddress(c, aggNode.id)).length} connections
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (onUndoAggregation) {
                                    onUndoAggregation(entityId)
                                  }
                                }}
                                className="h-8 px-3 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-300 dark:border-red-800"
                                aria-label={`Un-aggregate ${aggNode.label || entityId}`}
                              >
                                Un-aggregate
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="font-medium">Entity ID: {entityId}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}