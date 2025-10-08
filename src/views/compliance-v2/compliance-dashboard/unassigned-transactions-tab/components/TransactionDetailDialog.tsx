import { ReactNode } from "react"

import { Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Transaction } from "../../components/types"
import ActionsTab from "../transaction-detail-tabs/ActionsTab"
import ComplianceTab from "../transaction-detail-tabs/ComplianceTab"
import NetworkTab from "../transaction-detail-tabs/NetworkTab"
import OverviewTab from "../transaction-detail-tabs/OverviewTab"
import RiskAnalysisTab from "../transaction-detail-tabs/RiskAnalysisTab"

interface TransactionDetailDialogProps {
  transaction: Transaction
  trigger: ReactNode
}

export default function TransactionDetailDialog({ transaction, trigger }: TransactionDetailDialogProps) {
  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "bg-red-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FLAGGED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Transaction Investigation
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Comprehensive analysis and review tools for suspicious transaction detection
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Risk Level</span>
                <Badge className={`${getRiskScoreColor(transaction.riskScore)} text-white text-lg px-3 py-1`}>
                  {transaction.riskScore}/100
                </Badge>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Status</span>
                <Badge className={getStatusColor(transaction.status)}>
                  {transaction.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Priority</span>
                <Badge
                  variant={
                    transaction.riskScore >= 80
                      ? "destructive"
                      : transaction.riskScore >= 50
                        ? "secondary"
                        : "outline"
                  }
                >
                  {transaction.riskScore >= 80 ? "CRITICAL" : transaction.riskScore >= 50 ? "HIGH" : "MEDIUM"}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Last Updated</div>
              <div className="text-white">{transaction.timestamp}</div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-800">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab transaction={transaction} />
            </TabsContent>

            <TabsContent value="risk-analysis">
              <RiskAnalysisTab transaction={transaction} />
            </TabsContent>

            <TabsContent value="network">
              <NetworkTab transaction={transaction} />
            </TabsContent>

            <TabsContent value="compliance">
              <ComplianceTab transaction={transaction} />
            </TabsContent>

            <TabsContent value="actions">
              <ActionsTab transaction={transaction} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}