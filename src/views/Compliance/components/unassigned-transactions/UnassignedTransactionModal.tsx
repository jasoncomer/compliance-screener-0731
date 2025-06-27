
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
import { useTheme } from "@/context/ThemeContext"

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
  const { theme } = useTheme();
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

  // Theme-based styling
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const borderColor = isDark ? 'border-gray-800' : 'border-gray-200';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const cardBgColor = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const cardBorderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const mutedTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const selectBgColor = isDark ? 'bg-gray-800' : 'bg-white';
  const selectBorderColor = isDark ? 'border-gray-700' : 'border-gray-300';
  const textareaBgColor = isDark ? 'bg-gray-700' : 'bg-white';
  const textareaBorderColor = isDark ? 'border-gray-600' : 'border-gray-300';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${bgColor} ${borderColor} ${textColor}`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className={`text-xl font-semibold ${textColor}`}>Transaction Details</DialogTitle>
          <div className="flex items-center gap-3">
            <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
              <SelectTrigger className={`w-48 ${selectBgColor} ${selectBorderColor} ${textColor}`}>
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent className={`${selectBgColor} ${selectBorderColor}`}>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id} className={textColor}>
                    <div className="flex flex-col">
                      <span>{member.name}</span>
                      <span className={`text-xs ${mutedTextColor}`}>{member.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={onClose} variant="ghost" size="icon" className={`${mutedTextColor} hover:${textColor}`}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Transaction Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className={`${cardBgColor} ${cardBorderColor}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${textColor}`}>
                  <Hash className="h-4 w-4" />
                  Transaction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={`text-xs ${mutedTextColor} uppercase tracking-wide`}>Transaction ID</Label>
                    <p className={`font-mono text-sm ${textColor} break-all mt-1`}>{transaction.txId}</p>
                  </div>
                  <div>
                    <Label className={`text-xs ${mutedTextColor} uppercase tracking-wide`}>Client ID</Label>
                    <p className={`text-sm ${textColor} mt-1`}>{transaction.clientId}</p>
                  </div>
                  <div>
                    <Label className={`text-xs ${mutedTextColor} uppercase tracking-wide`}>Blockchain</Label>
                    <p className={`text-sm ${textColor} mt-1 capitalize`}>{transaction.blockchain}</p>
                  </div>
                  <div>
                    <Label className={`text-xs ${mutedTextColor} uppercase tracking-wide`}>Timestamp</Label>
                    <p className={`text-sm ${textColor} mt-1`}>{transaction.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${cardBgColor} ${cardBorderColor}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${textColor}`}>
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

            <Card className={`${cardBgColor} ${cardBorderColor}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${textColor}`}>
                  <Coins className="h-4 w-4" />
                  Amount Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={mutedTextColor}>Amount</span>
                  <span className={`text-lg font-semibold ${textColor}`}>
                    {transaction.blockchain.toUpperCase()} {transaction.amount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={mutedTextColor}>Converted Amount</span>
                  <span className="text-lg font-semibold text-green-400">
                    {formatCurrency(transaction.amount, transaction.blockchain)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            <Card className={`${cardBgColor} ${cardBorderColor}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${textColor}`}>
                  <Calendar className="h-4 w-4" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transaction.statusHistory.map((history, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} last:border-b-0`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(history.status)} flex items-center gap-1`}>
                          {getStatusIcon(history.status)}
                          {history.status.replace("_", " ")}
                        </Badge>
                        {history.reviewer && <span className={`text-sm ${mutedTextColor}`}>by {history.reviewer}</span>}
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{history.timestamp.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card className={`${cardBgColor} ${cardBorderColor}`}>
              <CardHeader>
                <CardTitle className={textColor}>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${getStatusColor(transaction.status)} flex items-center gap-2 w-fit`}>
                  {getStatusIcon(transaction.status)}
                  {transaction.status.replace("_", " ")}
                </Badge>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card className={`${cardBgColor} ${cardBorderColor}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${textColor}`}>
                  <TrendingUp className="h-4 w-4" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={mutedTextColor}>Risk Level</span>
                  <span className={`font-semibold ${riskLevel.color}`}>{riskLevel.level}</span>
                </div>
                <div className="space-y-2">
                  <span className={`text-sm ${mutedTextColor}`}>Risk Scores</span>
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
              <Card className={`${cardBgColor} ${cardBorderColor}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${textColor}`}>
                    <FileText className="h-4 w-4" />
                    SAR Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">SAR Submitted</Badge>
                    {transaction.sarReport && <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{transaction.sarReport}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assignment Section */}
            {selectedReviewer && (
              <Card className={`${cardBgColor} ${cardBorderColor}`}>
                <CardHeader>
                  <CardTitle className={textColor}>Assignment Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Add notes for the assigned reviewer..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    className={`${textareaBgColor} ${textareaBorderColor} ${textColor} placeholder-gray-400`}
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
              <Card className={`${cardBgColor} ${cardBorderColor}`}>
                <CardHeader>
                  <CardTitle className={textColor}>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{transaction.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
