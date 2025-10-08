import React, { useEffect,useState } from "react"

import { Badge } from "@/components/ui/badge"
// UI primitives
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { flowtraceService } from "../../../services/flowtraceService"

// Types and interfaces copied from original component for now
interface EntityPanelProps {
  address: string
  selectedNode?: {
    id: string
    label: string
    logo?: string
    chainLogo?: string
    sourceChain?: string
    destinationChain?: string
    type: string
    risk: string
    balance?: string
    transactions?: number
    availableTransactions?: number
    address?: string
    isUserDefinedLabel?: boolean
    originalLabel?: string
    entity_type?: string
    entity_tags?: string[]
    notes?: Array<{
      id: string
      userId: string
      userName: string
      content: string
      timestamp: string
    }>
  }
  connections?: Array<{
    from: string
    to: string
    amount: string
    currency: string
    date: string
    txHash: string
    usdValue: string
    type: string
    fee?: string
  }>
  onConnectNode?: (nodeId: string) => void
  availableNodes?: Array<{ id: string; label: string; type: string }>
  onAddNote?: (nodeId: string, content: string) => void
  onUpdateNodeLabel?: (nodeId: string, newLabel: string) => void
  onRevertNodeLabel?: (nodeId: string) => void
}


export const EntityPanel: React.FC<EntityPanelProps> = ({ address, selectedNode }) => {
  const [riskData, setRiskData] = useState<any>(null)

  useEffect(() => {
    if (!address) return

    const fetchRiskData = async () => {
      try {
        // Use optimized endpoint instead of separate risk score call
        const optimizedResponse = await flowtraceService.expandNodeOptimized(address, {
          includeRiskScores: true,
          includeTransactions: false // We only need risk scores here
        });
        
        // Extract risk score data from optimized response
        const riskScores = optimizedResponse.data.riskScores[address];
        if (riskScores) {
          setRiskData(riskScores);
        }
      } catch (err) {
        console.error("Failed to fetch risk data", err)
      }
    }

    fetchRiskData()
  }, [address])

  return (
    <Card className="w-full h-full overflow-y-auto">
      <CardHeader>
        <CardTitle>{selectedNode?.label ?? address}</CardTitle>
        {riskData?.score !== undefined && (
          <Badge variant="secondary">Risk Score: {riskData.score}</Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This is a simplified port of EntityPanel. Full feature parity is pending.
        </p>
        {/* TODO: implement remaining UI elements (notes, transactions, security events, editing) */}
      </CardContent>
    </Card>
  )
}