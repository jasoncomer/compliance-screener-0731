import React, { useEffect,useState } from 'react'

import { Edit3, Plus,Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription,DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { getPopularCurrencies } from '../lib/currency-icons'
import { connectionInvolvesAddress } from '../utils/utxoKeyGeneration'

import { FTNode } from './NetworkGraph'

interface EdgeConfig {
  targetId: string
  amount: string
  currency: string
  direction: 'out' | 'in'
  date: string
  utxoKey?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceNode: FTNode
  existingNodes: FTNode[]
  existingConnections?: { from?: string; to?: string; utxoKey?: string; amount?: string | number; currency?: string; date?: string; txHash?: string; isAggregated?: boolean; originalConnections?: any[] }[]
  onCreateEdges?: (edges: EdgeConfig[]) => void
  onEditEdges?: (edges: EdgeConfig[]) => void
}

const currencies = getPopularCurrencies()

export const CustomNodeExpandDialog: React.FC<Props> = ({ open, onOpenChange, sourceNode, existingNodes, onCreateEdges, existingConnections = [], onEditEdges }) => {
  // Unique list of available target nodes (excluding source)
  const otherNodes = Array.from(new Map(existingNodes.filter(n => n.id !== sourceNode.id).map(n => [n.id, n])).values())
  
  const buildPrefill = () => {
    const edgeMap = new Map<string, EdgeConfig>();
    
    existingConnections.forEach(c => {
      // Use connection key approach to determine if connection involves sourceNode
      if (!connectionInvolvesAddress(c, sourceNode.id)) return;
      
      // Determine target address using simple from/to matching (most reliable)
      const targetId = c.from === sourceNode.id ? c.to : c.from;
      
      // Handle aggregated connections
      if (c.originalConnections) {
        c.originalConnections.forEach(oc => {
          // Use simple from/to matching for original connections too
          const ocTargetId = oc.from === sourceNode.id ? oc.to : oc.from;
          
          if (ocTargetId && !edgeMap.has(ocTargetId)) {
            edgeMap.set(ocTargetId, {
              targetId: ocTargetId,
              amount: String(c.amount || '0'), // Use aggregated amount
              currency: c.currency || 'USD',
              date: c.date?.split('T')[0] || new Date().toISOString().split('T')[0],
              direction: (oc.from === sourceNode.id ? 'out' : 'in') as 'in' | 'out',
              utxoKey: oc.utxoKey // Preserve UTXO key
            });
          }
        });
      } else {
        // Handle individual connections
        if (targetId && !edgeMap.has(targetId)) {
          edgeMap.set(targetId, {
            targetId,
            amount: String(c.amount || '0'),
            currency: c.currency || 'USD',
            date: c.date?.split('T')[0] || new Date().toISOString().split('T')[0],
            direction: (c.from === sourceNode.id ? 'out' : 'in') as 'in' | 'out',
            utxoKey: c.utxoKey
          });
        }
      }
    });
    
    return Array.from(edgeMap.values());
  }

  const [connectedEdges, setConnectedEdges] = useState<EdgeConfig[]>(() => buildPrefill())
  const [newEdges, setNewEdges] = useState<EdgeConfig[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  // Refresh configs whenever dialog opens or existingConnections change
  useEffect(() => {
    if (open) {
      setConnectedEdges(buildPrefill())
      setNewEdges([])
      setEditingId(null)
    }
  }, [open, existingConnections])


  const addNewConnection = (nodeId: string) => {
    const newEdge: EdgeConfig = {
      targetId: nodeId,
      amount: '',
      currency: 'USD',
      direction: 'in',
      date: new Date().toISOString().split('T')[0]
    }
    setNewEdges(prev => [...prev, newEdge])
  }

  const removeConnection = (nodeId: string) => {
    setConnectedEdges(prev => prev.filter(e => e.targetId !== nodeId))
  }

  const removeNewConnection = (nodeId: string) => {
    setNewEdges(prev => prev.filter(e => e.targetId !== nodeId))
  }

  const updateEdge = (nodeId: string, field: keyof EdgeConfig, value: string) => {
    setConnectedEdges(prev => prev.map(e => e.targetId === nodeId ? { ...e, [field]: value } : e))
    setNewEdges(prev => prev.map(e => e.targetId === nodeId ? { ...e, [field]: value } : e))
  }

  const isConnected = (nodeId: string) => connectedEdges.some(e => e.targetId === nodeId)
  const isNewlyAdded = (nodeId: string) => newEdges.some(e => e.targetId === nodeId)
  const isEditing = (nodeId: string) => editingId === nodeId

  const availableNodes = otherNodes.filter(n => !isConnected(n.id) && !isNewlyAdded(n.id))

  const handleSubmit = () => {
    const allEdges = [...connectedEdges, ...newEdges].filter(e => e.amount.trim())
    if (allEdges.length) {
      if (existingConnections.length && onEditEdges) {
        onEditEdges(allEdges)
      } else if (onCreateEdges) {
        onCreateEdges(allEdges)
      }
      setConnectedEdges([])
      setNewEdges([])
      setEditingId(null)
      onOpenChange(false)
    }
  }

  const hasValidEdges = [...connectedEdges, ...newEdges].some(e => e.amount.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-7xl h-[90vh] flex flex-col p-0">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="tracking-tight text-xl font-semibold">Manage Edges for {sourceNode.label || sourceNode.id}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Edit existing connections or add new ones.</DialogDescription>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-gray-950">
          <div className="px-6 py-4 space-y-6">
            {/* Connected Edges Section */}
            {connectedEdges.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Connected Edges</h3>
                <div className="space-y-3">
                  {connectedEdges.map(edge => {
                    const node = otherNodes.find(n => n.id === edge.targetId)
                    const displayName = node?.label && node.label !== edge.targetId 
                      ? `${node.label}: ${edge.targetId.substring(0, 6)}`
                      : edge.targetId;
                    return (
                      <div key={edge.targetId} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
                            <span className="text-sm text-gray-500">({edge.direction === 'out' ? 'From' : 'To'} {sourceNode.label})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(isEditing(edge.targetId) ? null : edge.targetId)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeConnection(edge.targetId)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {isEditing(edge.targetId) ? (
                          <div className="grid grid-cols-8 gap-2 items-center">
                            <span className="col-span-1 text-xs text-muted-foreground">Amount</span>
                            <Input 
                              className="col-span-1" 
                              value={edge.amount} 
                              onChange={e => updateEdge(edge.targetId, 'amount', e.target.value)} 
                              placeholder="e.g. 0.5" 
                            />
                            <span className="col-span-1 text-xs text-muted-foreground">Currency</span>
                            <select 
                              className="col-span-1 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800" 
                              value={edge.currency} 
                              onChange={e => updateEdge(edge.targetId, 'currency', e.target.value)}
                            >
                              {currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}
                              <option value="OTHER">Other...</option>
                            </select>
                            <span className="col-span-1 text-xs text-muted-foreground">Date</span>
                            <input 
                              type="date" 
                              className="col-span-1 border rounded px-2 py-1 text-sm" 
                              value={edge.date} 
                              onChange={e => updateEdge(edge.targetId, 'date', e.target.value)} 
                            />
                            <span className="col-span-1 text-xs text-muted-foreground">Direction</span>
                            <select 
                              className="col-span-1 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800" 
                              value={edge.direction} 
                              onChange={e => updateEdge(edge.targetId, 'direction', e.target.value)}
                            >
                              <option value="in">From</option>
                              <option value="out">To</option>
                            </select>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <span className="ml-2 font-medium">{edge.amount} {edge.currency}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <span className="ml-2 font-medium">{edge.date}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Direction:</span>
                              <span className="ml-2 font-medium">{edge.direction === 'out' ? 'To' : 'From'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* New Edges Section */}
            {newEdges.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">New Edges</h3>
                <div className="space-y-3">
                  {newEdges.map(edge => {
                    const node = otherNodes.find(n => n.id === edge.targetId)
                    const displayName = node?.label && node.label !== edge.targetId 
                      ? `${node.label}: ${edge.targetId.substring(0, 6)}`
                      : edge.targetId;
                    return (
                      <div key={edge.targetId} className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
                            <span className="text-sm text-gray-500">({edge.direction === 'out' ? 'From' : 'To'} {sourceNode.label})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNewConnection(edge.targetId)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-8 gap-2 items-center">
                          <span className="col-span-1 text-xs text-muted-foreground">Amount</span>
                          <Input 
                            className="col-span-1" 
                            value={edge.amount} 
                            onChange={e => updateEdge(edge.targetId, 'amount', e.target.value)} 
                            placeholder="e.g. 0.5" 
                          />
                          <span className="col-span-1 text-xs text-muted-foreground">Currency</span>
                          <select 
                            className="col-span-1 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800" 
                            value={edge.currency} 
                            onChange={e => updateEdge(edge.targetId, 'currency', e.target.value)}
                          >
                            {currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}
                            <option value="OTHER">Other...</option>
                          </select>
                          <span className="col-span-1 text-xs text-muted-foreground">Date</span>
                          <input 
                            type="date" 
                            className="col-span-1 border rounded px-2 py-1 text-sm" 
                            value={edge.date} 
                            onChange={e => updateEdge(edge.targetId, 'date', e.target.value)} 
                          />
                          <span className="col-span-1 text-xs text-muted-foreground">Direction</span>
                          <select 
                            className="col-span-1 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800" 
                            value={edge.direction} 
                            onChange={e => updateEdge(edge.targetId, 'direction', e.target.value)}
                          >
                            <option value="in">From</option>
                            <option value="out">To</option>
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add New Connections */}
            {availableNodes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Add New Connections</h3>
                <div className="grid grid-cols-1 gap-2">
                  {availableNodes.map(node => {
                    const displayName = node.label && node.label !== node.id 
                      ? `${node.label}: ${node.id.substring(0, 6)}`
                      : node.id;
                    return (
                      <div key={node.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addNewConnection(node.id)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Connect
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!hasValidEdges} onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
