import React, { useMemo, useState } from 'react'

import { Bitcoin, ChevronDown, ChevronRight, Filter, Search, SortAsc, SortDesc, Users,Wallet } from 'lucide-react'

import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Progress } from '../../../components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { connectionInvolvesAddress } from '../utils/utxoKeyGeneration'

import type { FTConnection,FTNode } from './NetworkGraph'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: FTNode[]
  connections: FTConnection[]
  consolidatedEntities: string[]
  onConfirmSelection?: (entityKey: string, utxos: any[]) => void
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
  consolidatedEntities,
  onConfirmSelection,
  onUndoAggregation,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('clusters')
  const [sortBy, setSortBy] = useState<'utxos' | 'nodes' | 'name' | 'connections'>('nodes')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<'all' | 'large-entities' | 'high-utxos'>('all')


  // Helper function to calculate UTXO count for a node
  const calculateNodeUtxoCount = (nodeId: string): number => {
    let utxoCount = 0
    
    connections.forEach(conn => {
      // If this is an aggregated connection, use the original connections for UTXO count
      const connectionsToUse = conn.originalConnections || [conn]
      
      connectionsToUse.forEach(originalConn => {
        // Count each connection as a UTXO
        if (originalConn.from === nodeId || originalConn.to === nodeId) {
          utxoCount++
        }
      })
    })
    
    return utxoCount
  }


  // Group nodes by entity_id for aggregation
  const entityGroups = useMemo(() => {
    const entityMap = new Map<string, { 
      entityId: string
      entityName: string
      entityType?: string
      nodes: FTNode[]
      totalConnections: number
      totalUtxoCount: number
      logoUrl?: string
    }>()
    
    // Group nodes by entityId
    nodes.forEach(node => {
      if (!node.entityId) return
      
      const existing = entityMap.get(node.entityId)
      if (existing) {
        existing.nodes.push(node)
        existing.totalConnections += connections.filter(c => connectionInvolvesAddress(c, node.id)).length
        // Calculate UTXO metrics
        const nodeUtxoCount = calculateNodeUtxoCount(node.id)
        existing.totalUtxoCount += nodeUtxoCount
      } else {
        const nodeUtxoCount = calculateNodeUtxoCount(node.id)
        entityMap.set(node.entityId, {
          entityId: node.entityId,
          entityName: node.label || node.entityId,
          entityType: node.entityType,
          nodes: [node],
          totalConnections: connections.filter(c => connectionInvolvesAddress(c, node.id)).length,
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
          case 'large-entities': return g.nodes.length > 3
          case 'high-utxos': return g.totalUtxoCount > 10
          default: return true
        }
      })
    }
    
    // Apply sorting
    arr.sort((a, b) => {
      let aVal: any, bVal: any
      switch (sortBy) {
        case 'utxos': aVal = a.totalUtxoCount; bVal = b.totalUtxoCount; break
        case 'nodes': aVal = a.nodes.length; bVal = b.nodes.length; break
        case 'name': aVal = a.entityName.toLowerCase(); bVal = b.entityName.toLowerCase(); break
        case 'connections': aVal = a.totalConnections; bVal = b.totalConnections; break
        default: aVal = a.nodes.length; bVal = b.nodes.length
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })
    
    return arr
  }, [nodes, connections, sortBy, sortOrder, calculateNodeUtxoCount])

  const toggleEntityExpand = (entityId: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev)
      next.has(entityId) ? next.delete(entityId) : next.add(entityId)
      return next
    })
  }


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
      <DialogContent className="max-w-6xl w-[90vw] max-h-[85vh] bg-card border-2 border-border text-foreground shadow-2xl p-0 overflow-hidden ring-4 ring-primary/40 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Wallet Clusters
          </DialogTitle>
          
          {/* Enhanced Controls */}
          <div className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Search entities..." 
                className="pl-8" 
              />
            </div>
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="large-entities">Large Entities</SelectItem>
                <SelectItem value="high-utxos">High UTXOs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
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
              size="sm" 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => {/* refresh placeholder */}}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.totalClusters}</div>
              <div className="text-xs text-muted-foreground">Entities</div>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.totalNodes}</div>
              <div className="text-xs text-muted-foreground">Total Nodes</div>
            </div>
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {stats.totalUtxoCount}
              </div>
              <div className="text-xs text-muted-foreground">Total UTXOs</div>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.totalConnections}</div>
              <div className="text-xs text-muted-foreground">Connections</div>
            </div>
          </div>

          {/* Average Nodes per Entity */}
          <div className="pt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Average Nodes per Entity</span>
              <span>{stats.avgNodesPerEntity.toFixed(1)}</span>
            </div>
            <Progress value={Math.min(100, stats.avgNodesPerEntity * 10)} className="h-2" />
          </div>


        </DialogHeader>

        <Card className="h-full border-0 shadow-none flex flex-col">
          <CardContent className="pt-0 flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="clusters">Entities</TabsTrigger>
              </TabsList>

              <TabsContent value="clusters" className="mt-4 space-y-2">
                
                {/* Available Entities (not yet consolidated) */}
                {entityGroups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No entities with multiple nodes found.</p>
                    <p className="text-sm">Entities need to have multiple nodes to be shown here.</p>
                    <p className="text-xs mt-2">Total nodes: {nodes.length}, Total connections: {connections.length}</p>
                  </div>
                ) : (
                  entityGroups
                    .filter((g) =>
                      searchQuery ? g.entityName.toLowerCase().includes(searchQuery.toLowerCase()) : true,
                    )
                    .length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No entities match your search.</p>
                        <p className="text-sm">Try adjusting your search terms.</p>
                      </div>
                    ) : (
                      entityGroups
                        .filter((g) =>
                          searchQuery ? g.entityName.toLowerCase().includes(searchQuery.toLowerCase()) : true,
                        )
                        .map((g) => {
                    const expanded = expandedEntities.has(g.entityId)
                    
                    return (
                      <div
                        key={g.entityId}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          expanded 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        } border-l-4 border-l-blue-500`}
                        onClick={() => toggleEntityExpand(g.entityId)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <div className="flex items-center gap-2">
                              {g.logoUrl && (
                                <img src={g.logoUrl} alt="" className="w-4 h-4 rounded" />
                              )}
                              <span className="font-medium text-sm">{g.entityName}</span>
                              <Badge variant="outline" className="text-xs">
                                {g.entityType || 'entity'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="text-right">
                              <div className="font-mono">{g.totalUtxoCount} UTXOs</div>
                              <div className="text-xs text-muted-foreground">
                                {g.totalConnections} connections
                              </div>
                            </div>
                            <Badge variant="default">
                              {g.nodes.length} nodes
                            </Badge>

                            {/* Aggregate button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onConfirmSelection) {
                                  onConfirmSelection(g.entityId, [])
                                }
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              Aggregate
                            </Button>
                          </div>
                        </div>
                        
                        {/* Entity metadata */}
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>Entity ID: {g.entityId}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bitcoin className="h-3 w-3" />
                            <span>Avg: {Math.round(g.totalUtxoCount / g.nodes.length)} UTXOs/node</span>
                          </div>
                        </div>
                        
                        {expanded && (
                          <div className="mt-3 space-y-1">
                            {g.nodes.map((node) => (
                              <div key={node.id} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-800 rounded p-2">
                                <div className="flex items-center gap-2">
                                  {node.logoUrl && (
                                    <img src={node.logoUrl} alt="" className="w-3 h-3 rounded" />
                                  )}
                                  <span className="font-mono">{node.id.substring(0, 12)}...</span>
                                  <span className="text-muted-foreground">{node.label}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono">{calculateNodeUtxoCount(node.id)} UTXOs</div>
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
                )
                )}

                {/* Consolidated Entities */}
                {consolidatedEntities.length > 0 && (
                  <>
                    <div className="mt-6 mb-3">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Consolidated Entities
                      </h3>
                    </div>
                    {consolidatedEntities.map((entityId) => {
                      const aggNode = nodes.find(n => n.id === `agg:${entityId.replace(/\s+/g, '_')}`)
                      if (!aggNode) return null
                      
                      return (
                        <div
                          key={entityId}
                          className="p-3 border rounded-lg border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {aggNode.logoUrl && (
                                <img src={aggNode.logoUrl} alt="" className="w-4 h-4 rounded" />
                              )}
                              <span className="font-medium text-sm">{aggNode.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {aggNode.entityType || 'entity'}
                              </Badge>
                              <Badge variant="default" className="text-xs bg-green-600">
                                Consolidated
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right text-sm">
                                <div className="font-mono">{calculateNodeUtxoCount(aggNode.id)} UTXOs</div>
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
                                className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Un-aggregate
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>Entity ID: {entityId}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </TabsContent>


            </Tabs>
          </CardContent>

        </Card>
      </DialogContent>
    </Dialog>
  )
}