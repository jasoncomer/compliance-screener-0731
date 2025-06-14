"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, Clock, Filter, Search, Shield, TrendingUp } from "lucide-react"
import ActiveCases from "./active-cases"
import MonitoredAddresses from "./monitored-addresses"


interface Transaction {
  id: string
  clientId: string
  counterpartyEntities: string
  blockchain: string
  amount: string
  convertedAmount: string
  timestamp: string
  riskScore: number
  status: string
}

// Mock data for transactions
const mockTransactions = [
  {
    id: "5d313966d2f38aec0d5a9df2c7600de80eb10b5df52b7afed6e032079227753e4d",
    clientId: "12312323",
    counterpartyEntities: "N/A",
    blockchain: "Bitcoin",
    amount: "BTC 0.09008105",
    convertedAmount: "$959.48",
    timestamp: "6/12/2025, 2:42:05 PM",
    riskScore: 20,
    status: "UNASSIGNED",
  },
  {
    id: "7f425a88c3d47bef9a8c2e1d5f890ab4c6d20e8f73a9b1c4e5d6f7a8b9c0d1e2f3",
    clientId: "12312323",
    counterpartyEntities: "Suspicious Exchange",
    blockchain: "Bitcoin",
    amount: "BTC 0.02058156",
    convertedAmount: "$2,174.59",
    timestamp: "6/12/2025, 12:50:34 AM",
    riskScore: 85,
    status: "FLAGGED",
  },
  {
    id: "1f80a9b6c7d2fa43c8e9b0a1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
    clientId: "12312323",
    counterpartyEntities: "N/A",
    blockchain: "Bitcoin",
    amount: "BTC 0.02047116",
    convertedAmount: "$2,162.92",
    timestamp: "6/12/2025, 12:50:34 AM",
    riskScore: 21,
    status: "UNASSIGNED",
  },
  {
    id: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7",
    clientId: "45678901",
    counterpartyEntities: "High-Risk Wallet",
    blockchain: "Ethereum",
    amount: "ETH 2.5",
    convertedAmount: "$4,250.00",
    timestamp: "6/12/2025, 3:15:22 PM",
    riskScore: 92,
    status: "UNDER_REVIEW",
  },
  {
    id: "3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1",
    clientId: "78901234",
    counterpartyEntities: "N/A",
    blockchain: "Bitcoin",
    amount: "BTC 0.15",
    convertedAmount: "$1,590.75",
    timestamp: "6/12/2025, 1:30:45 PM",
    riskScore: 15,
    status: "APPROVED",
  },
]

const riskPatterns = [
  { name: "Rapid Transaction Velocity", count: 23, severity: "high" },
  { name: "Unusual Amount Patterns", count: 15, severity: "medium" },
  { name: "Sanctioned Entity Interaction", count: 8, severity: "critical" },
  { name: "Privacy Coin Usage", count: 12, severity: "medium" },
  { name: "Cross-Chain Bridging", count: 31, severity: "low" },
]

export default function ComplianceDashboard() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

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

  const filteredTransactions = mockTransactions.filter((tx) => {
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus
    const matchesSearch = tx.clientId.includes(searchTerm) || tx.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold">Compliance Monitor</span>
          </div>
          <nav className="ml-8 flex space-x-6">
            <Button variant="ghost" className="text-blue-400">
              Compliance Screener
            </Button>
            <Button variant="ghost" className="text-gray-400">
              Block Explorer
            </Button>
            <Button variant="ghost" className="text-gray-400">
              Risk Scoring
            </Button>
            <Button variant="ghost" className="text-gray-400">
              WASP Entity Explorer
            </Button>
          </nav>
          <div className="ml-auto">
            <span className="text-sm text-gray-400">bryan</span>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-red-600">
              Unassigned Transactions
            </TabsTrigger>
            <TabsTrigger value="cases">Active Cases</TabsTrigger>
            <TabsTrigger value="addresses">Monitored Addresses</TabsTrigger>
            <TabsTrigger value="archived">Archived Cases</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Transactions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">11,203</div>
                  <p className="text-xs text-gray-500">+2.1% from last hour</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">High Risk</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">47</div>
                  <p className="text-xs text-gray-500">Requires immediate review</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Under Review</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">23</div>
                  <p className="text-xs text-gray-500">Avg. review time: 2.3h</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Approved Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">156</div>
                  <p className="text-xs text-gray-500">+12% from yesterday</p>
                </CardContent>
              </Card>
            </div>

            {/* Risk Patterns */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Detected Risk Patterns</CardTitle>
                <CardDescription>Common suspicious activity patterns identified in the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {riskPatterns.map((pattern, index) => (
                    <div key={index} className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{pattern.name}</span>
                        <Badge
                          variant={
                            pattern.severity === "critical"
                              ? "destructive"
                              : pattern.severity === "high"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {pattern.count}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            pattern.severity === "critical"
                              ? "bg-red-500"
                              : pattern.severity === "high"
                                ? "bg-orange-500"
                                : pattern.severity === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(pattern.count * 3, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                    <SelectItem value="FLAGGED">Flagged</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by transaction ID or client ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            {/* Transactions Table */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Real-Time Compliance Monitoring ({filteredTransactions.length})
                </CardTitle>
                <CardDescription>
                  This page shows new unassigned transactions that need to be assigned to a compliance officer for
                  review.
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
                    {filteredTransactions.map((transaction) => (
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTransaction(transaction)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
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
                              {selectedTransaction && (
                                <div className="space-y-6">
                                  {/* Risk Assessment Header */}
                                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                                    <div className="flex items-center gap-4">
                                      <div className="flex flex-col">
                                        <span className="text-sm text-gray-400">Risk Level</span>
                                        <Badge
                                          className={`${getRiskScoreColor(selectedTransaction.riskScore)} text-white text-lg px-3 py-1`}
                                        >
                                          {selectedTransaction.riskScore}/100
                                        </Badge>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm text-gray-400">Status</span>
                                        <Badge className={getStatusColor(selectedTransaction.status)}>
                                          {selectedTransaction.status.replace("_", " ")}
                                        </Badge>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm text-gray-400">Priority</span>
                                        <Badge
                                          variant={
                                            selectedTransaction.riskScore >= 80
                                              ? "destructive"
                                              : selectedTransaction.riskScore >= 50
                                                ? "secondary"
                                                : "outline"
                                          }
                                        >
                                          {selectedTransaction.riskScore >= 80
                                            ? "CRITICAL"
                                            : selectedTransaction.riskScore >= 50
                                              ? "HIGH"
                                              : "MEDIUM"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm text-gray-400">Last Updated</div>
                                      <div className="text-white">{selectedTransaction.timestamp}</div>
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

                                    <TabsContent value="overview" className="space-y-4">
                                      {/* Transaction Details */}
                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">Transaction Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                              <div>
                                                <Label className="text-gray-400 text-sm">Transaction Hash</Label>
                                                <div className="flex items-center gap-2 mt-1">
                                                  <code className="text-blue-400 text-xs bg-gray-900 p-2 rounded border break-all">
                                                    {selectedTransaction.id}
                                                  </code>
                                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                                    </svg>
                                                  </Button>
                                                </div>
                                              </div>

                                              <div>
                                                <Label className="text-gray-400 text-sm">Client Information</Label>
                                                <div className="mt-1">
                                                  <div className="text-white font-medium">
                                                    ID: {selectedTransaction.clientId}
                                                  </div>
                                                  <div className="text-sm text-gray-400">Verified Customer</div>
                                                </div>
                                              </div>

                                              <div>
                                                <Label className="text-gray-400 text-sm">Blockchain Network</Label>
                                                <div className="flex items-center gap-2 mt-1">
                                                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                                  <span className="text-white">{selectedTransaction.blockchain}</span>
                                                  <Badge variant="outline" className="text-xs">
                                                    Mainnet
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="space-y-4">
                                              <div>
                                                <Label className="text-gray-400 text-sm">Transaction Amount</Label>
                                                <div className="mt-1">
                                                  <div className="text-white text-lg font-semibold">
                                                    {selectedTransaction.amount}
                                                  </div>
                                                  <div className="text-gray-400">
                                                    {selectedTransaction.convertedAmount}
                                                  </div>
                                                </div>
                                              </div>

                                              <div>
                                                <Label className="text-gray-400 text-sm">Transaction Fee</Label>
                                                <div className="mt-1">
                                                  <div className="text-white">0.00001 BTC</div>
                                                  <div className="text-gray-400">$0.42</div>
                                                </div>
                                              </div>

                                              <div>
                                                <Label className="text-gray-400 text-sm">Confirmations</Label>
                                                <div className="flex items-center gap-2 mt-1">
                                                  <span className="text-white">6</span>
                                                  <Badge variant="outline" className="text-green-400 border-green-400">
                                                    Confirmed
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      {/* Address Information */}
                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">Address Information</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-4">
                                            <div>
                                              <Label className="text-gray-400 text-sm">From Address</Label>
                                              <div className="flex items-center justify-between mt-1 p-3 bg-gray-900 rounded border">
                                                <code className="text-blue-400 text-sm">
                                                  1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
                                                </code>
                                                <div className="flex items-center gap-2">
                                                  <Badge variant="outline" className="text-green-400 border-green-400">
                                                    Known
                                                  </Badge>
                                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                      <path
                                                        fillRule="evenodd"
                                                        d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                                        clipRule="evenodd"
                                                      />
                                                    </svg>
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>

                                            <div>
                                              <Label className="text-gray-400 text-sm">To Address</Label>
                                              <div className="flex items-center justify-between mt-1 p-3 bg-gray-900 rounded border">
                                                <code className="text-blue-400 text-sm">
                                                  3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy
                                                </code>
                                                <div className="flex items-center gap-2">
                                                  <Badge variant="destructive">Flagged</Badge>
                                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                      <path
                                                        fillRule="evenodd"
                                                        d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                                        clipRule="evenodd"
                                                      />
                                                    </svg>
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>

                                    <TabsContent value="risk-analysis" className="space-y-4">
                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">Risk Factors Analysis</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-4">
                                            {[
                                              {
                                                factor: "High-Risk Counterparty",
                                                score: 35,
                                                description: "Destination address flagged in sanctions database",
                                              },
                                              {
                                                factor: "Unusual Amount Pattern",
                                                score: 25,
                                                description: "Transaction amount deviates from user's typical behavior",
                                              },
                                              {
                                                factor: "Geographic Risk",
                                                score: 15,
                                                description: "Transaction originates from high-risk jurisdiction",
                                              },
                                              {
                                                factor: "Velocity Pattern",
                                                score: 10,
                                                description: "Part of rapid transaction sequence",
                                              },
                                            ].map((risk, index) => (
                                              <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-900 rounded border"
                                              >
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                                    <span className="text-white font-medium">{risk.factor}</span>
                                                    <Badge className={`${getRiskScoreColor(risk.score)} text-white`}>
                                                      +{risk.score}
                                                    </Badge>
                                                  </div>
                                                  <p className="text-sm text-gray-400 mt-1">{risk.description}</p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">ML Risk Assessment</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                              <span className="text-gray-400">Money Laundering Risk</span>
                                              <div className="flex items-center gap-2">
                                                <div className="w-32 bg-gray-700 rounded-full h-2">
                                                  <div
                                                    className="bg-red-500 h-2 rounded-full"
                                                    style={{ width: "75%" }}
                                                  ></div>
                                                </div>
                                                <span className="text-white">75%</span>
                                              </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-gray-400">Terrorist Financing Risk</span>
                                              <div className="flex items-center gap-2">
                                                <div className="w-32 bg-gray-700 rounded-full h-2">
                                                  <div
                                                    className="bg-yellow-500 h-2 rounded-full"
                                                    style={{ width: "45%" }}
                                                  ></div>
                                                </div>
                                                <span className="text-white">45%</span>
                                              </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-gray-400">Sanctions Evasion Risk</span>
                                              <div className="flex items-center gap-2">
                                                <div className="w-32 bg-gray-700 rounded-full h-2">
                                                  <div
                                                    className="bg-red-500 h-2 rounded-full"
                                                    style={{ width: "85%" }}
                                                  ></div>
                                                </div>
                                                <span className="text-white">85%</span>
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>

                                    <TabsContent value="network" className="space-y-4">
                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">Transaction Network</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="text-center py-8">
                                            <div className="text-gray-400 mb-4">
                                              Network visualization would be rendered here
                                            </div>
                                            <div className="bg-gray-900 rounded-lg p-8 border-2 border-dashed border-gray-600">
                                              <div className="text-gray-500">Interactive network graph showing:</div>
                                              <ul className="text-sm text-gray-400 mt-2 space-y-1">
                                                <li>• Connected addresses and entities</li>
                                                <li>• Transaction flow patterns</li>
                                                <li>• Risk propagation paths</li>
                                                <li>• Clustering analysis</li>
                                              </ul>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">Related Transactions</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-3">
                                            {[
                                              {
                                                hash: "7f425a88c3d47bef...",
                                                amount: "BTC 0.05",
                                                risk: 65,
                                                time: "2 hours ago",
                                              },
                                              {
                                                hash: "1f80a9b6c7d2fa43...",
                                                amount: "BTC 0.12",
                                                risk: 45,
                                                time: "5 hours ago",
                                              },
                                              {
                                                hash: "9a8b7c6d5e4f3a2b...",
                                                amount: "BTC 0.08",
                                                risk: 72,
                                                time: "1 day ago",
                                              },
                                            ].map((tx, index) => (
                                              <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-900 rounded border"
                                              >
                                                <div className="flex items-center gap-3">
                                                  <code className="text-blue-400 text-sm">{tx.hash}</code>
                                                  <span className="text-white">{tx.amount}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Badge className={`${getRiskScoreColor(tx.risk)} text-white`}>
                                                    {tx.risk}
                                                  </Badge>
                                                  <span className="text-gray-400 text-sm">{tx.time}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>

                                    <TabsContent value="compliance" className="space-y-4">
                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">Compliance Checks</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-4">
                                            {[
                                              { check: "OFAC Sanctions List", status: "MATCH", severity: "critical" },
                                              { check: "EU Sanctions List", status: "CLEAR", severity: "safe" },
                                              { check: "PEP Database", status: "CLEAR", severity: "safe" },
                                              { check: "Adverse Media", status: "POTENTIAL", severity: "warning" },
                                              { check: "Internal Watchlist", status: "CLEAR", severity: "safe" },
                                            ].map((check, index) => (
                                              <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-900 rounded border"
                                              >
                                                <span className="text-white">{check.check}</span>
                                                <Badge
                                                  variant={
                                                    check.severity === "critical"
                                                      ? "destructive"
                                                      : check.severity === "warning"
                                                        ? "secondary"
                                                        : "outline"
                                                  }
                                                  className={
                                                    check.severity === "safe" ? "text-green-400 border-green-400" : ""
                                                  }
                                                >
                                                  {check.status}
                                                </Badge>
                                              </div>
                                            ))}
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">Investigation Notes</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-4">
                                            <textarea
                                              className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-3 text-white placeholder-gray-400"
                                              placeholder="Add investigation notes, findings, and recommendations..."
                                            />
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm text-gray-400">
                                                Notes are automatically saved
                                              </span>
                                              <Button size="sm" variant="outline" className="border-gray-600">
                                                Add Evidence
                                              </Button>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>

                                    <TabsContent value="actions" className="space-y-4">
                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">Case Assignment</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div>
                                            <Label className="text-gray-400">Assign To</Label>
                                            <Select>
                                              <SelectTrigger className="bg-gray-900 border-gray-600 mt-1">
                                                <SelectValue placeholder="Select compliance officer..." />
                                              </SelectTrigger>
                                              <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="officer1">Sarah Chen - Senior Analyst</SelectItem>
                                                <SelectItem value="officer2">
                                                  Michael Rodriguez - Compliance Officer
                                                </SelectItem>
                                                <SelectItem value="officer3">Emma Thompson - AML Specialist</SelectItem>
                                                <SelectItem value="officer4">David Kim - Investigation Lead</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div>
                                            <Label className="text-gray-400">Priority Level</Label>
                                            <Select>
                                              <SelectTrigger className="bg-gray-900 border-gray-600 mt-1">
                                                <SelectValue placeholder="Set priority..." />
                                              </SelectTrigger>
                                              <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="critical">
                                                  Critical - Immediate Action Required
                                                </SelectItem>
                                                <SelectItem value="high">High - Review Within 4 Hours</SelectItem>
                                                <SelectItem value="medium">Medium - Review Within 24 Hours</SelectItem>
                                                <SelectItem value="low">Low - Standard Review Process</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">Available Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-2 gap-4">
                                            <Button className="bg-green-600 hover:bg-green-700">
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Approve Transaction
                                            </Button>
                                            <Button variant="destructive">
                                              <AlertTriangle className="h-4 w-4 mr-2" />
                                              Flag for Review
                                            </Button>
                                            <Button variant="outline" className="border-gray-600 text-gray-300">
                                              <Clock className="h-4 w-4 mr-2" />
                                              Request More Info
                                            </Button>
                                            <Button variant="outline" className="border-gray-600 text-gray-300">
                                              <Shield className="h-4 w-4 mr-2" />
                                              Escalate to Senior
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card className="bg-gray-800 border-gray-700">
                                        <CardHeader>
                                          <CardTitle className="text-white text-lg">Regulatory Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-3">
                                            <Button
                                              variant="outline"
                                              className="w-full justify-start border-gray-600 text-gray-300"
                                            >
                                              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                  fillRule="evenodd"
                                                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                              Generate SAR Report
                                            </Button>
                                            <Button
                                              variant="outline"
                                              className="w-full justify-start border-gray-600 text-gray-300"
                                            >
                                              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                  fillRule="evenodd"
                                                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                              Create Compliance Report
                                            </Button>
                                            <Button
                                              variant="outline"
                                              className="w-full justify-start border-gray-600 text-gray-300"
                                            >
                                              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                  fillRule="evenodd"
                                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                              Notify Regulatory Authority
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cases">
            <ActiveCases />
          </TabsContent>

          <TabsContent value="addresses">
            <MonitoredAddresses />
          </TabsContent>

          <TabsContent value="archived">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Archived Cases</CardTitle>
                <CardDescription>Completed and archived compliance cases</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Archived cases interface would be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
