import React, { useState, useEffect } from "react"
import { flowtraceService } from "../../../services/flowtraceService"
// UI primitives
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"

// Utilities
import { getCounterpartyName, getSOTData, getEntityInfoWithOverride } from "@/lib/counterparty-utils"
import { wrapTextAtLimit } from "@/lib/utils"

// Lucide icons
import { Shield, AlertTriangle, Copy, ExternalLink, AlertCircle, Zap, Edit3, Save, X, Info, ArrowRight, RotateCcw } from "lucide-react"

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

type FilterType = "all" | "high" | "medium" | "low"

export const EntityPanel: React.FC<EntityPanelProps> = ({ address, selectedNode }) => {
  const [riskData, setRiskData] = useState<any>(null)
  const [isLoadingRiskData, setIsLoadingRiskData] = useState(false)

  useEffect(() => {
    if (!selectedNode?.address) return

    const fetchRiskData = async () => {
      setIsLoadingRiskData(true)
      try {
        const data = await flowtraceService.fetchRiskScore(selectedNode.address, "address")
        setRiskData(data)
      } catch (err) {
        console.error("Failed to fetch risk data", err)
      } finally {
        setIsLoadingRiskData(false)
      }
    }

    fetchRiskData()
  }, [selectedNode?.address])

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