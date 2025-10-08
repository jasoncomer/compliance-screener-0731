import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Transaction } from "../../components/types"

import TransactionDetailDialog from "./TransactionDetailDialog"

interface TransactionsTableProps {
  transactions: Transaction[]
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {

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
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Real-Time Compliance Monitoring ({transactions.length})</CardTitle>
        <CardDescription>
          This page shows new unassigned transactions that need to be assigned to a compliance officer for review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Client ID</TableHead>
              <TableHead className="text-gray-400">Counterparty Entities</TableHead>
              <TableHead className="text-gray-400">Blockchain</TableHead>
              <TableHead className="text-gray-400">Amount</TableHead>
              <TableHead className="text-gray-400">Timestamp</TableHead>
              <TableHead className="text-gray-400">Risk Score</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="border-gray-700 hover:bg-gray-800">
                <TableCell>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-white">{transaction.clientId}</TableCell>
                <TableCell className="text-gray-400">{transaction.counterpartyEntities}</TableCell>
                <TableCell className="text-white">{transaction.blockchain}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-white">{transaction.amount}</span>
                    <span className="text-sm text-gray-400">{transaction.convertedAmount}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-400">{transaction.timestamp}</TableCell>
                <TableCell>
                  <Badge className={`${getRiskScoreColor(transaction.riskScore)} text-white`}>
                    {transaction.riskScore}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TransactionDetailDialog
                    transaction={transaction}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        View Details
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}