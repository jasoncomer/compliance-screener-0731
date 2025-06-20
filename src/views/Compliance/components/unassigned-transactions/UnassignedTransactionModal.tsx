"use client"

import { useState } from "react"
import {
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Hash,
  Building2,
  Coins,
  TrendingUp,
  FileText,
  Shield,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IComplianceTransaction, EComplianceTransactionStatus } from "@/typings/compliance"
import { getComplianceReportStatusColor } from "../../utils/compliance.utils"

interface UnassignedTransactionModalProps {
  transaction: IComplianceTransaction | null
  isOpen: boolean
  onClose: () => void
  onAssign: (reviewerId: string, notes?: string) => void
  teamMembers: { id: string; name: string; role: string }[]
}

export function UnassignedTransactionModal({
  transaction,
  isOpen,
  onClose,
  onAssign,
  teamMembers,
}: UnassignedTransactionModalProps) {
  const [selectedReviewer, setSelectedReviewer] = useState<string>("")
  const [assignmentNotes, setAssignmentNotes] = useState("")

  const getStatusIcon = (status: EComplianceTransactionStatus) => {
    switch (status) {
      case EComplianceTransactionStatus.UNASSIGNED:
        return <Clock className="h-3 w-3" />
      case EComplianceTransactionStatus.UNREVIEWED:
        return <User className="h-3 w-3" />
      case EComplianceTransactionStatus.IN_REVIEW:
        return <User className="h-3 w-3" />
      case EComplianceTransactionStatus.APPROVED:
        return <CheckCircle className="h-3 w-3" />
      case EComplianceTransactionStatus.HOLD:
        return <AlertTriangle className="h-3 w-3" />
      case EComplianceTransactionStatus.CLOSED_WITH_NOTE:
        return <X className="h-3 w-3" />
      case EComplianceTransactionStatus.CLOSED_WITH_SAR:
        return <Shield className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: EComplianceTransactionStatus) => {
    return getComplianceReportStatusColor(status)
  }

  const getRiskLevel = (scores: number[]) => {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    if (avgScore >= 80) return { level: "HIGH", color: "text-red-400" }
    if (avgScore >= 60) return { level: "MEDIUM", color: "text-yellow-400" }
    return { level: "LOW", color: "text-green-400" }
  }

  const formatCurrency = (amount: number, blockchain: string) => {
    // Mock conversion rate - in real app this would come from API
    const btcToUsd = 45000
    const ethToUsd = 3000

    let usdValue = amount
    if (blockchain.toLowerCase() === "bitcoin") {
      usdValue = amount * btcToUsd
    } else if (blockchain.toLowerCase() === "ethereum") {
      usdValue = amount * ethToUsd
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(usdValue)
  }

  const handleAssign = () => {
    if (selectedReviewer) {
      onAssign(selectedReviewer, assignmentNotes)
      setSelectedReviewer("")
      setAssignmentNotes("")
      onClose()
    }
  }

  if (!transaction) return null;

  const riskLevel = getRiskLevel(transaction.riskScores)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-gray-100">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-100">Transaction Details</DialogTitle>
          <div className="flex items-center gap-3">
            <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id} className="text-gray-100">
                    <div className="flex flex-col">
                      <span>{member.name}</span>
                      <span className="text-xs text-gray-400">{member.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={onClose} variant="ghost" size="icon" className="text-gray-400 hover:text-gray-100">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Transaction Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Hash className="h-4 w-4" />
                  Transaction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-400 uppercase tracking-wide">Transaction ID</Label>
                    <p className="font-mono text-sm text-gray-100 break-all mt-1">{transaction.txId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 uppercase tracking-wide">Client ID</Label>
                    <p className="text-sm text-gray-100 mt-1">{transaction.clientId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 uppercase tracking-wide">Blockchain</Label>
                    <p className="text-sm text-gray-100 mt-1 capitalize">{transaction.blockchain}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 uppercase tracking-wide">Timestamp</Label>
                    <p className="text-sm text-gray-100 mt-1">{transaction.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Building2 className="h-4 w-4" />
                  Counterparty Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {transaction.counterpartyEntities.map((entity, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-orange-500/20 text-orange-400 border-orange-500/30"
                    >
                      {entity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Coins className="h-4 w-4" />
                  Amount Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-lg font-semibold text-gray-100">
                    {transaction.blockchain.toUpperCase()} {transaction.amount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Converted Amount</span>
                  <span className="text-lg font-semibold text-green-400">
                    {formatCurrency(transaction.amount, transaction.blockchain)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Calendar className="h-4 w-4" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transaction.statusHistory.map((history, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(history.status)} flex items-center gap-1`}>
                          {getStatusIcon(history.status)}
                          {history.status.replace("_", " ")}
                        </Badge>
                        {history.reviewer && <span className="text-sm text-gray-400">by {history.reviewer}</span>}
                      </div>
                      <span className="text-xs text-gray-500">{history.timestamp.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${getStatusColor(transaction.status)} flex items-center gap-2 w-fit`}>
                  {getStatusIcon(transaction.status)}
                  {transaction.status.replace("_", " ")}
                </Badge>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <TrendingUp className="h-4 w-4" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Risk Level</span>
                  <span className={`font-semibold ${riskLevel.color}`}>{riskLevel.level}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-gray-400">Risk Scores</span>
                  <div className="flex flex-wrap gap-1">
                    {transaction.riskScores.map((score, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {score}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SAR Information */}
            {transaction.sarSubmitted && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-100">
                    <FileText className="h-4 w-4" />
                    SAR Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">SAR Submitted</Badge>
                    {transaction.sarReport && <p className="text-sm text-gray-300">{transaction.sarReport}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assignment Section */}
            {selectedReviewer && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100">Assignment Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Add notes for the assigned reviewer..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                    rows={3}
                  />
                  <Button onClick={handleAssign} className="w-full">
                    Assign Transaction
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {transaction.notes && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">{transaction.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
