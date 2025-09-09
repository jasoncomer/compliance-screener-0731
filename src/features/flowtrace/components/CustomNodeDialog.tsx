import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getPopularCurrencies } from '../lib/currency-icons'
import { FTNode } from './NetworkGraph'

interface CustomNodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingNodes: FTNode[]
  onCreate: (data: {
    label: string
    currencyCode: string
    logo: string
    notes: string
    edges: { targetId: string; amount: string; currency: string; direction: 'out' | 'in'; date: string }[]
  }) => void
}

const availableCurrencies = getPopularCurrencies().map(c => ({
  value: c.logo,
  code: c.code,
  label: `${c.name} (${c.code})`
}))

export const CustomNodeDialog: React.FC<CustomNodeDialogProps> = ({ open, onOpenChange, existingNodes, onCreate }) => {
  const [label, setLabel] = useState('')
  const [logo, setLogo] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [notes, setNotes] = useState('')
  const [connectedIds, setConnectedIds] = useState<string[]>([])
  const [edgeConfigs, setEdgeConfigs] = useState<Record<string, { amount: string; currency: string; direction: 'out' | 'in'; date: string }>>({})

  const handleLogoChange = (val: string) => {
    setLogo(val)
    if (val === 'OTHER') {
      // For custom currency, use a generic currency icon
      setCurrencyCode('OTHER')
    } else {
      const selected = availableCurrencies.find(l => l.value === val)
      const newCode = selected?.code || ''
      setCurrencyCode(newCode)
    }
    // propagate change to existing edge configs
    setEdgeConfigs(prev => {
      const updated: typeof prev = {}
      Object.entries(prev).forEach(([id, cfg]) => {
        updated[id] = { ...cfg, currency: cfg.currency || (val === 'OTHER' ? 'OTHER' : currencyCode) }
      })
      return updated
    })
  }

  const handleToggleConnection = (nodeId: string) => {
    setConnectedIds(prev => prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId])
    setEdgeConfigs(prev => prev[nodeId] ? (() => { const { [nodeId]:_, ...rest}=prev; return rest })() : { ...prev, [nodeId]: { amount: '', currency: currencyCode || 'USD', direction: 'out', date: new Date().toISOString().split('T')[0] } })
  }

  const updateEdgeField = (id: string, field: 'amount'|'currency'|'direction'|'date', value: string) => {
    setEdgeConfigs(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const handleSubmit = () => {
    if (!label.trim() || !logo) return
    onCreate({
      label: label.trim(),
      currencyCode,
      logo,
      notes: notes.trim(),
      edges: connectedIds.map(id => ({ targetId: id, ...edgeConfigs[id], currency: edgeConfigs[id].currency || currencyCode }))
    })
    // reset
    setLabel('')
    setLogo('')
    setCurrencyCode('')
    setConnectedIds([])
    setNotes('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create Custom Node</DialogTitle>
          <DialogDescription>
            Specify node details and choose any existing nodes to connect with.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium">Name</label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Bank of America" className="col-span-3" />
          </div>
          {/* Currency */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium">Currency</label>
            <select value={logo} onChange={e => handleLogoChange(e.target.value)} className="col-span-3 text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              <option value="">Select currency</option>
              {availableCurrencies.map(cur => (
                <option key={cur.value} value={cur.value}>{cur.label}</option>
              ))}
              <option value="OTHER">Other Currency...</option>
            </select>
          </div>
          {/* Note */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-right text-sm font-medium pt-1">Note</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="col-span-3 text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 resize-none" placeholder="Optional note about this node" />
          </div>
          {/* Connections */}
          {existingNodes.length > 0 && (
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right text-sm font-medium pt-1">Connect To</label>
              <div className="col-span-3 max-h-40 overflow-auto border rounded px-2 py-1 space-y-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                {existingNodes.map(node => {
                  const displayName = node.label && node.label !== node.id 
                    ? `${node.label}: ${node.id.substring(0, 6)}`
                    : node.id;
                  return (
                    <div key={node.id} className="flex flex-col border rounded p-2 mb-1">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={connectedIds.includes(node.id)} onChange={() => handleToggleConnection(node.id)} />
                        <span className="truncate text-sm">{displayName}</span>
                      </label>
                    {connectedIds.includes(node.id) && (
                      <div className="grid grid-cols-8 gap-2 items-center mt-2">
                        <span className="text-xs col-span-2">Amount</span>
                        <Input className="col-span-2" value={edgeConfigs[node.id]?.amount || ''} onChange={e=>updateEdgeField(node.id,'amount',e.target.value)} />
                        <span className="text-xs col-span-2">Date</span>
                        <input type="date" className="col-span-2 border rounded px-2 py-1 text-sm" value={edgeConfigs[node.id]?.date || ''} onChange={e=>updateEdgeField(node.id,'date',e.target.value)} />
                        <span className="text-xs col-span-2">Direction</span>
                        <select className="col-span-2 border rounded px-2 py-1 text-sm" value={edgeConfigs[node.id]?.direction || 'in'} onChange={e=>updateEdgeField(node.id,'direction',e.target.value)}>
                          <option value="in">From</option>
                          <option value="out">To</option>
                        </select>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!label.trim() || !logo} onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CustomNodeDialog