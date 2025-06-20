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
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  MessageSquare,
  Search,
  TrendingUp,
  User,
  Calendar,
  DollarSign,
  Shield,
  AlertCircle,
} from "lucide-react"

interface Case {
  id: string
  title: string
  clientId: string
  assignedTo: string
  priority: string
  status: string
  riskScore: number
  totalAmount: string
  transactionCount: number
  createdDate: string
  lastActivity: string
  dueDate: string
  description: string
  tags: string[]
  evidence: number
  notes: number
}

// Mock data for active cases
const mockActiveCases = [
  {
    id: "CASE-2025-001",
    title: "Suspicious High-Value Bitcoin Transfers",
    clientId: "12312323",
    assignedTo: "Sarah Chen",
    priority: "CRITICAL",
    status: "UNDER_REVIEW",
    riskScore: 92,
    totalAmount: "$45,230.00",
    transactionCount: 8,
    createdDate: "2025-06-12",
    lastActivity: "2 hours ago",
    dueDate: "2025-06-14",
    description: "Multiple high-value transactions to addresses flagged in OFAC sanctions list",
    tags: ["AML", "Sanctions", "High-Risk"],
    evidence: 3,
    notes: 7,
  },
  {
    id: "CASE-2025-002",
    title: "Rapid Transaction Velocity Pattern",
    clientId: "45678901",
    assignedTo: "Michael Rodriguez",
    priority: "HIGH",
    status: "ESCALATED",
    riskScore: 78,
    totalAmount: "$12,450.00",
    transactionCount: 23,
    createdDate: "2025-06-11",
    lastActivity: "4 hours ago",
    dueDate: "2025-06-15",
    description: "Unusual transaction velocity pattern suggesting potential structuring activity",
    tags: ["Structuring", "Velocity", "Pattern"],
    evidence: 5,
    notes: 12,
  },
  {
    id: "CASE-2025-003",
    title: "Cross-Chain Bridge Anomaly",
    clientId: "78901234",
    assignedTo: "Emma Thompson",
    priority: "MEDIUM",
    status: "PENDING_REVIEW",
    riskScore: 65,
    totalAmount: "$8,750.00",
    transactionCount: 4,
    createdDate: "2025-06-10",
    lastActivity: "1 day ago",
    dueDate: "2025-06-16",
    description: "Suspicious cross-chain bridging activity with privacy coin involvement",
    tags: ["Cross-Chain", "Privacy", "Bridge"],
    evidence: 2,
    notes: 4,
  },
  {
    id: "CASE-2025-004",
    title: "PEP-Related Transaction Investigation",
    clientId: "34567890",
    assignedTo: "David Kim",
    priority: "HIGH",
    status: "AWAITING_RESPONSE",
    riskScore: 85,
    totalAmount: "$67,890.00",
    transactionCount: 12,
    createdDate: "2025-06-09",
    lastActivity: "6 hours ago",
    dueDate: "2025-06-13",
    description: "Transactions involving politically exposed person requiring enhanced due diligence",
    tags: ["PEP", "EDD", "Political"],
    evidence: 8,
    notes: 15,
  },
  {
    id: "CASE-2025-005",
    title: "Mixer Service Detection",
    clientId: "56789012",
    assignedTo: "Sarah Chen",
    priority: "CRITICAL",
    status: "INVESTIGATION",
    riskScore: 95,
    totalAmount: "$23,100.00",
    transactionCount: 6,
    createdDate: "2025-06-08",
    lastActivity: "30 minutes ago",
    dueDate: "2025-06-12",
    description: "Funds traced through cryptocurrency mixing service",
    tags: ["Mixer", "Obfuscation", "Critical"],
    evidence: 12,
    notes: 23,
  },
]

const caseStats = [
  { label: "Total Active Cases", value: 47, change: "+3", icon: FileText },
  { label: "Critical Priority", value: 8, change: "+2", icon: AlertTriangle },
  { label: "Overdue Cases", value: 3, change: "-1", icon: Clock },
  { label: "Avg. Resolution Time", value: "2.3d", change: "-0.2d", icon: TrendingUp },
]

export default function ActiveCases() {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500 text-white"
      case "HIGH":
        return "bg-orange-500 text-white"
      case "MEDIUM":
        return "bg-yellow-500 text-black"
      case "LOW":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "ESCALATED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "PENDING_REVIEW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "AWAITING_RESPONSE":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "INVESTIGATION":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "bg-red-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  const filteredCases = mockActiveCases.filter((case_) => {
    const matchesStatus = filterStatus === "all" || case_.status === filterStatus
    const matchesPriority = filterPriority === "all" || case_.priority === filterPriority
    const matchesSearch =
      case_.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.clientId.includes(searchTerm) ||
      case_.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesPriority && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {caseStats.map((stat, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-gray-500">{stat.change} from last week</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="ESCALATED">Escalated</SelectItem>
              <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
              <SelectItem value="AWAITING_RESPONSE">Awaiting Response</SelectItem>
              <SelectItem value="INVESTIGATION">Investigation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search cases by ID, title, client, or officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700"
          />
        </div>
      </div>

      {/* Cases Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Active Cases ({filteredCases.length})</CardTitle>
          <CardDescription>Cases currently under investigation by compliance officers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Case ID</TableHead>
                <TableHead className="text-gray-400">Title</TableHead>
                <TableHead className="text-gray-400">Assigned To</TableHead>
                <TableHead className="text-gray-400">Priority</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Risk Score</TableHead>
                <TableHead className="text-gray-400">Amount</TableHead>
                <TableHead className="text-gray-400">Due Date</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((case_) => (
                <TableRow key={case_.id} className="border-gray-700 hover:bg-gray-800">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-blue-400 font-mono text-sm">{case_.id}</span>
                      <span className="text-xs text-gray-400">{case_.createdDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col max-w-xs">
                      <span className="text-white font-medium truncate">{case_.title}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {case_.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {case_.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{case_.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-white">{case_.assignedTo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(case_.priority)}>{case_.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(case_.status)}>{case_.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getRiskScoreColor(case_.riskScore)} text-white`}>{case_.riskScore}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{case_.totalAmount}</span>
                      <span className="text-xs text-gray-400">{case_.transactionCount} txns</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white">{case_.dueDate}</span>
                      <span className="text-xs text-gray-400">{case_.lastActivity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCase(case_)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-400" />
                            Case Management - {selectedCase?.id}
                          </DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Comprehensive case investigation and management interface
                          </DialogDescription>
                        </DialogHeader>
                        {selectedCase && (
                          <div className="space-y-6">
                            {/* Case Header */}
                            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                  <span className="text-sm text-gray-400">Priority</span>
                                  <Badge className={getPriorityColor(selectedCase.priority)}>
                                    {selectedCase.priority}
                                  </Badge>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm text-gray-400">Status</span>
                                  <Badge className={getStatusColor(selectedCase.status)}>
                                    {selectedCase.status.replace("_", " ")}
                                  </Badge>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm text-gray-400">Risk Score</span>
                                  <Badge
                                    className={`${getRiskScoreColor(selectedCase.riskScore)} text-white text-lg px-3 py-1`}
                                  >
                                    {selectedCase.riskScore}/100
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-400">Due Date</div>
                                <div className="text-white font-medium">{selectedCase.dueDate}</div>
                              </div>
                            </div>

                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="grid w-full grid-cols-5 bg-gray-800">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                                <TabsTrigger value="evidence">Evidence</TabsTrigger>
                                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                <TabsTrigger value="actions">Actions</TabsTrigger>
                              </TabsList>

                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid grid-cols-2 gap-6">
                                  <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader>
                                      <CardTitle className="text-white text-lg">Case Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div>
                                        <Label className="text-gray-400 text-sm">Case Title</Label>
                                        <p className="text-white font-medium mt-1">{selectedCase.title}</p>
                                      </div>
                                      <div>
                                        <Label className="text-gray-400 text-sm">Description</Label>
                                        <p className="text-white mt-1">{selectedCase.description}</p>
                                      </div>
                                      <div>
                                        <Label className="text-gray-400 text-sm">Client ID</Label>
                                        <p className="text-white mt-1">{selectedCase.clientId}</p>
                                      </div>
                                      <div>
                                        <Label className="text-gray-400 text-sm">Tags</Label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {selectedCase.tags.map((tag, index) => (
                                            <Badge key={index} variant="outline">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader>
                                      <CardTitle className="text-white text-lg">Assignment & Timeline</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div>
                                        <Label className="text-gray-400 text-sm">Assigned Officer</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                          <User className="h-4 w-4 text-gray-400" />
                                          <span className="text-white">{selectedCase.assignedTo}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-gray-400 text-sm">Created Date</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Calendar className="h-4 w-4 text-gray-400" />
                                          <span className="text-white">{selectedCase.createdDate}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-gray-400 text-sm">Last Activity</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Clock className="h-4 w-4 text-gray-400" />
                                          <span className="text-white">{selectedCase.lastActivity}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-gray-400 text-sm">Due Date</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                          <AlertCircle className="h-4 w-4 text-yellow-400" />
                                          <span className="text-white">{selectedCase.dueDate}</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                <Card className="bg-gray-800 border-gray-700">
                                  <CardHeader>
                                    <CardTitle className="text-white text-lg">Financial Summary</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-3 gap-6">
                                      <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                          <DollarSign className="h-5 w-5 text-green-400" />
                                          <span className="text-gray-400">Total Amount</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">{selectedCase.totalAmount}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                          <TrendingUp className="h-5 w-5 text-blue-400" />
                                          <span className="text-gray-400">Transactions</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                          {selectedCase.transactionCount}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                          <Shield className="h-5 w-5 text-red-400" />
                                          <span className="text-gray-400">Risk Score</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                          {selectedCase.riskScore}/100
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>

                              <TabsContent value="transactions" className="space-y-4">
                                <Card className="bg-gray-800 border-gray-700">
                                  <CardHeader>
                                    <CardTitle className="text-white text-lg">Related Transactions</CardTitle>
                                    <CardDescription>All transactions associated with this case</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="text-center py-8">
                                      <div className="text-gray-400 mb-4">Transaction list would be rendered here</div>
                                      <div className="bg-gray-900 rounded-lg p-8 border-2 border-dashed border-gray-600">
                                        <div className="text-gray-500">Detailed transaction analysis including:</div>
                                        <ul className="text-sm text-gray-400 mt-2 space-y-1">
                                          <li>• Transaction hashes and amounts</li>
                                          <li>• Source and destination addresses</li>
                                          <li>• Risk scores and flags</li>
                                          <li>• Timeline visualization</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>

                              <TabsContent value="evidence" className="space-y-4">
                                <Card className="bg-gray-800 border-gray-700">
                                  <CardHeader>
                                    <CardTitle className="text-white text-lg flex items-center gap-2">
                                      <FileText className="h-5 w-5" />
                                      Evidence Collection ({selectedCase.evidence} items)
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <Button variant="outline" className="border-gray-600 text-gray-300">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Upload Document
                                      </Button>
                                      <Button variant="outline" className="border-gray-600 text-gray-300">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Add Screenshot
                                      </Button>
                                    </div>
                                    <div className="space-y-3">
                                      {[
                                        {
                                          name: "Blockchain Analysis Report.pdf",
                                          type: "PDF",
                                          size: "2.3 MB",
                                          date: "2025-06-12",
                                        },
                                        {
                                          name: "Address Clustering Data.xlsx",
                                          type: "Excel",
                                          size: "1.8 MB",
                                          date: "2025-06-11",
                                        },
                                        {
                                          name: "OFAC Match Screenshot.png",
                                          type: "Image",
                                          size: "456 KB",
                                          date: "2025-06-10",
                                        },
                                      ].map((file, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between p-3 bg-gray-900 rounded border"
                                        >
                                          <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-blue-400" />
                                            <div>
                                              <div className="text-white font-medium">{file.name}</div>
                                              <div className="text-sm text-gray-400">
                                                {file.type} • {file.size} • {file.date}
                                              </div>
                                            </div>
                                          </div>
                                          <Button size="sm" variant="ghost">
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>

                              <TabsContent value="timeline" className="space-y-4">
                                <Card className="bg-gray-800 border-gray-700">
                                  <CardHeader>
                                    <CardTitle className="text-white text-lg">Case Timeline</CardTitle>
                                    <CardDescription>Chronological history of case activities</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      {[
                                        {
                                          time: "2 hours ago",
                                          action: "Risk score updated to 92",
                                          user: "System",
                                          type: "system",
                                        },
                                        {
                                          time: "4 hours ago",
                                          action: "Evidence uploaded: OFAC Match Screenshot",
                                          user: "Sarah Chen",
                                          type: "evidence",
                                        },
                                        {
                                          time: "6 hours ago",
                                          action: "Case status changed to Under Review",
                                          user: "Sarah Chen",
                                          type: "status",
                                        },
                                        {
                                          time: "1 day ago",
                                          action: "Case assigned to Sarah Chen",
                                          user: "System",
                                          type: "assignment",
                                        },
                                        {
                                          time: "1 day ago",
                                          action: "Case created from flagged transaction",
                                          user: "System",
                                          type: "creation",
                                        },
                                      ].map((event, index) => (
                                        <div
                                          key={index}
                                          className="flex items-start gap-3 p-3 bg-gray-900 rounded border"
                                        >
                                          <div
                                            className={`w-3 h-3 rounded-full mt-2 ${
                                              event.type === "system"
                                                ? "bg-blue-500"
                                                : event.type === "evidence"
                                                  ? "bg-green-500"
                                                  : event.type === "status"
                                                    ? "bg-yellow-500"
                                                    : event.type === "assignment"
                                                      ? "bg-purple-500"
                                                      : "bg-gray-500"
                                            }`}
                                          />
                                          <div className="flex-1">
                                            <div className="text-white">{event.action}</div>
                                            <div className="text-sm text-gray-400">
                                              {event.user} • {event.time}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>

                              <TabsContent value="actions" className="space-y-4">
                                <Card className="bg-gray-800 border-gray-700">
                                  <CardHeader>
                                    <CardTitle className="text-white text-lg">Case Actions</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div>
                                      <Label className="text-gray-400">Update Status</Label>
                                      <Select>
                                        <SelectTrigger className="bg-gray-900 border-gray-600 mt-1">
                                          <SelectValue placeholder="Select new status..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 border-gray-700">
                                          <SelectItem value="under_review">Under Review</SelectItem>
                                          <SelectItem value="escalated">Escalated</SelectItem>
                                          <SelectItem value="pending_review">Pending Review</SelectItem>
                                          <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
                                          <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label className="text-gray-400">Reassign Case</Label>
                                      <Select>
                                        <SelectTrigger className="bg-gray-900 border-gray-600 mt-1">
                                          <SelectValue placeholder="Select officer..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 border-gray-700">
                                          <SelectItem value="sarah">Sarah Chen - Senior Analyst</SelectItem>
                                          <SelectItem value="michael">
                                            Michael Rodriguez - Compliance Officer
                                          </SelectItem>
                                          <SelectItem value="emma">Emma Thompson - AML Specialist</SelectItem>
                                          <SelectItem value="david">David Kim - Investigation Lead</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label className="text-gray-400">Add Note</Label>
                                      <Textarea
                                        className="bg-gray-900 border-gray-600 mt-1"
                                        placeholder="Add investigation notes, findings, or updates..."
                                        rows={3}
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                      <Button className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Close Case
                                      </Button>
                                      <Button variant="destructive">
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Escalate Case
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
    </div>
  )
}
