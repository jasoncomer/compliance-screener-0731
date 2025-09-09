import React, { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Bitcoin } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import type { GroupedTransaction, UTXO } from '../../../lib/utxo-clustering'

interface Props {
  groupedTransaction: GroupedTransaction
  onUTXOSelect?: (utxo: UTXO) => void
  onExpand?: (txid: string) => void
  isExpanded?: boolean
  className?: string
}

/*
  Simplified copy of the original component from jason-flowtrace with same API.
*/
export const GroupedTransactionView: React.FC<Props> = ({
  groupedTransaction,
  onUTXOSelect,
  onExpand,
  isExpanded = false,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(isExpanded)

  const toggle = () => {
    const next = !expanded
    setExpanded(next)
    onExpand?.(groupedTransaction.txid)
  }

  const selectUtxo = (utxo: UTXO) => onUTXOSelect?.(utxo)

  const fmtBtc = (v: number) => v.toFixed(8)
  const fmtUsd = (v: number, price = 45000) => (v * price).toFixed(2)

  const confirmationColor = (conf?: number) => {
    if (!conf) return 'bg-gray-500'
    if (conf >= 6) return 'bg-green-500'
    if (conf >= 1) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={toggle} className="h-6 w-6 p-0">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <CardTitle className="text-sm font-mono">
              {groupedTransaction.txid.substring(0, 8)}...
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {groupedTransaction.utxos.length} UTXOs
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Bitcoin className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">{fmtBtc(groupedTransaction.totalAmount)} BTC</span>
            <span className="text-xs text-muted-foreground">${fmtUsd(groupedTransaction.totalAmount)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs text-muted-foreground ml-8">
          {groupedTransaction.blockHeight && (
            <div className="flex items-center space-x-1">
              <span>Block:</span>
              <span className="font-mono">{groupedTransaction.blockHeight}</span>
            </div>
          )}
          {groupedTransaction.confirmations !== undefined && (
            <div className="flex items-center space-x-1">
              <span>Confirmations:</span>
              <div className={`w-2 h-2 rounded-full ${confirmationColor(groupedTransaction.confirmations)}`} />
              <span>{groupedTransaction.confirmations}</span>
            </div>
          )}
          {groupedTransaction.fee && (
            <div className="flex items-center space-x-1">
              <span>Fee:</span>
              <span className="font-mono">{fmtBtc(groupedTransaction.fee)} BTC</span>
            </div>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Individual UTXOs:</div>
            {groupedTransaction.utxos.map((u) => (
              <div key={`${u.txHash}-${u.vout}`} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-muted-foreground w-8">#{u.vout}</div>
                  <div className="flex flex-col">
                    <div className="text-xs font-mono">{u.address.substring(0, 12)}...</div>
                    <div className="text-xs text-muted-foreground">Amount: {fmtBtc(u.amount)} BTC</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {u.spent && (
                    <Badge variant="secondary" className="text-xs">
                      Spent
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => selectUtxo(u)}>
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Total UTXOs: {groupedTransaction.utxos.length}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600"
                onClick={() => window.open(`https://blockstream.info/tx/${groupedTransaction.txid}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" /> View on Explorer
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}