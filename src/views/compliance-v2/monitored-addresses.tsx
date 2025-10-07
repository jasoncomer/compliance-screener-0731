
import { useState } from "react"

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  Filter,
  Plus,
  Search,
  Target,
  Trash2,
} from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface Address {
  id: string
  address: string
  blockchain: string
  label: string
  category: string
  riskScore: number
  status: string
  alertsEnabled: boolean
  dateAdded: string
  lastActivity: string
  totalTransactions: number
  totalVolume: string
  tags: string[]
  notes: string
  alertThreshold: number
  monitoringReason: string
  addedBy: string
}

// Mock data for monitored addresses
const mockMonitoredAddresses = [
  {
    id: "ADDR-001",
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    blockchain: "Bitcoin",
    label: "Suspicious Exchange Wallet",
    category: "HIGH_RISK",
    riskScore: 95,
    status: "ACTIVE",
    alertsEnabled: true,
    dateAdded: "2025-06-01",
    lastActivity: "2 hours ago",
    totalTransactions: 1247,
    totalVolume: "$2,450,000",
    tags: ["Exchange", "High-Volume", "Sanctions"],
    notes: "Flagged for potential sanctions evasion activities",
    alertThreshold: 10000,
    monitoringReason: "OFAC sanctions match",
    addedBy: "Sarah Chen",
  },
  {
    id: "ADDR-002",
    address: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    blockchain: "Bitcoin",
    label: "Mixer Service Input",
    category: "CRITICAL",
    riskScore: 98,
    status: "ACTIVE",
    alertsEnabled: true,
    dateAdded: "2025-05-28",
    lastActivity: "15 minutes ago",
    totalTransactions: 892,
    totalVolume: "$1,890,000",
    tags: ["Mixer", "Privacy", "Critical"],
    notes: "Known cryptocurrency mixing service - high priority monitoring",
    alertThreshold: 5000,
    monitoringReason: "Cryptocurrency mixer detection",
    addedBy: "Michael Rodriguez",
  },
  {
    id: "ADDR-003",
    address: "0x742d35Cc6634C0532925a3b8D4C9db96DfB3f681",
    blockchain: "Ethereum",
    label: "DeFi Protocol Exploit",
    category: "MEDIUM",
    riskScore: 72,
    status: "ACTIVE",
    alertsEnabled: false,
    dateAdded: "2025-06-05",
    lastActivity: "1 day ago",
    totalTransactions: 156,
    totalVolume: "$340,000",
    tags: ["DeFi", "Exploit", "Investigation"],
    notes: "Address involved in recent DeFi protocol exploit",
    alertThreshold: 25000,
    monitoringReason: "Security incident investigation",
    addedBy: "Emma Thompson",
  },
  {
    id: "ADDR-004",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    blockchain: "Bitcoin",
    label: "PEP-Related Wallet",
    category: "HIGH_RISK",
    riskScore: 85,
    status: "PAUSED",
    alertsEnabled: true,
    dateAdded: "2025-05-15",
    lastActivity: "3 days ago",
    totalTransactions: 45,
    totalVolume: "$125,000",
    tags: ["PEP", "Political", "Enhanced-DD"],
    notes: "Wallet associated with politically exposed person",
    alertThreshold: 15000,
    monitoringReason: "PEP association",
    addedBy: "David Kim",
  },
  {
    id: "ADDR-005",
    address: "0x8ba1f109551bD432803012645Hac136c22C501e3",
    blockchain: "Ethereum",
    label: "Ransomware Payment Address",
    category: "CRITICAL",
    riskScore: 99,
    status: "ACTIVE",
    alertsEnabled: true,
    dateAdded: "2025-06-10",
    lastActivity: "6 hours ago",
    totalTransactions: 23,
    totalVolume: "$89,000",
    tags: ["Ransomware", "Criminal", "Law-Enforcement"],
    notes: "Address linked to ransomware payments - law enforcement coordination",
    alertThreshold: 1000,
    monitoringReason: "Criminal activity",
    addedBy: "Sarah Chen",
  },
]

const addressStats = [
  { label: "Total Monitored", value: 247, change: "+12", icon: Target },
  { label: "High Risk", value: 89, change: "+5", icon: AlertTriangle },
  { label: "Active Alerts", value: 34, change: "+8", icon: Bell },
  { label: "Total Volume", value: "$12.4M", change: "+2.1M", icon: DollarSign },
]

export default function MonitoredAddresses() {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterBlockchain, setFilterBlockchain] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "CRITICAL":
        return "bg-red-500 text-white"
      case "HIGH_RISK":
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
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "PAUSED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 90) return "bg-red-500"
    if (score >= 70) return "bg-orange-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getBlockchainColor = (blockchain: string) => {
    switch (blockchain) {
      case "Bitcoin":
        return "bg-orange-500"
      case "Ethereum":
        return "bg-blue-500"
      case "Litecoin":
        return "bg-gray-500"
      default:
        return "bg-purple-500"
    }
  }

  const filteredAddresses = mockMonitoredAddresses.filter((addr) => {
    const matchesCategory = filterCategory === "all" || addr.category === filterCategory
    const matchesStatus = filterStatus === "all" || addr.status === filterStatus
    const matchesBlockchain = filterBlockchain === "all" || addr.blockchain === filterBlockchain
    const matchesSearch =
      addr.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addr.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addr.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesStatus && matchesBlockchain && matchesSearch
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {addressStats.map((stat, index) => (
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
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH_RISK">High Risk</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={filterBlockchain} onValueChange={setFilterBlockchain}>
              <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Show All" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Show All</SelectItem>
                <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                <SelectItem value="Ethereum">Ethereum</SelectItem>
                <SelectItem value="Litecoin">Litecoin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search addresses, labels, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />
          </div>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Monitored Address</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new blockchain address to the monitoring system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Blockchain</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-800 border-gray-600 mt-1">
                      <SelectValue placeholder="Select blockchain..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="bitcoin">Bitcoin</SelectItem>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="litecoin">Litecoin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400">Category</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-800 border-gray-600 mt-1">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high_risk">High Risk</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-400">Address</Label>
                <Input className="bg-gray-800 border-gray-600 mt-1" placeholder="Enter blockchain address..." />
              </div>
              <div>
                <Label className="text-gray-400">Label</Label>
                <Input className="bg-gray-800 border-gray-600 mt-1" placeholder="Enter descriptive label..." />
              </div>
              <div>
                <Label className="text-gray-400">Monitoring Reason</Label>
                <Select>
                  <SelectTrigger className="bg-gray-800 border-gray-600 mt-1">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="sanctions">Sanctions screening</SelectItem>
                    <SelectItem value="pep">PEP association</SelectItem>
                    <SelectItem value="criminal">Criminal activity</SelectItem>
                    <SelectItem value="mixer">Mixing service</SelectItem>
                    <SelectItem value="investigation">Investigation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Alert Threshold (USD)</Label>
                <Input
                  type="number"
                  className="bg-gray-800 border-gray-600 mt-1"
                  placeholder="Enter alert threshold..."
                />
              </div>
              <div>
                <Label className="text-gray-400">Notes</Label>
                <Textarea className="bg-gray-800 border-gray-600 mt-1" placeholder="Add monitoring notes..." rows={3} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="alerts" />
                <Label htmlFor="alerts" className="text-gray-400">
                  Enable alerts for this address
                </Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Add Address</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Addresses Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Monitored Addresses ({filteredAddresses.length})</CardTitle>
          <CardDescription>Blockchain addresses under continuous compliance monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Address</TableHead>
                <TableHead className="text-gray-400">Label</TableHead>
                <TableHead className="text-gray-400">Category</TableHead>
                <TableHead className="text-gray-400">Risk Score</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Activity</TableHead>
                <TableHead className="text-gray-400">Volume</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAddresses.map((address) => (
                <TableRow key={address.id} className="border-gray-700 hover:bg-gray-800">
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getBlockchainColor(address.blockchain)}`}></div>
                        <code className="text-blue-400 text-sm font-mono">
                          {address.address.slice(0, 12)}...{address.address.slice(-8)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(address.address)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-400">{address.blockchain}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{address.label}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {address.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {address.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{address.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(address.category)}>{address.category.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getRiskScoreColor(address.riskScore)} text-white`}>{address.riskScore}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(address.status)}>{address.status}</Badge>
                      {address.alertsEnabled && <Bell className="h-3 w-3 text-yellow-400" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white">{address.totalTransactions} txns</span>
                      <span className="text-xs text-gray-400">{address.lastActivity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{address.totalVolume}</span>
                      <span className="text-xs text-gray-400">Total volume</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAddress(address)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Target className="h-5 w-5 text-blue-400" />
                              Address Monitoring - {selectedAddress?.id}
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Comprehensive monitoring and analysis for blockchain address
                            </DialogDescription>
                          </DialogHeader>
                          {selectedAddress && (
                            <div className="space-y-6">
                              {/* Address Header */}
                              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-400">Category</span>
                                    <Badge className={getCategoryColor(selectedAddress.category)}>
                                      {selectedAddress.category.replace("_", " ")}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-400">Risk Score</span>
                                    <Badge
                                      className={`${getRiskScoreColor(selectedAddress.riskScore)} text-white text-lg px-3 py-1`}
                                    >
                                      {selectedAddress.riskScore}/100
                                    </Badge>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-400">Status</span>
                                    <Badge className={getStatusColor(selectedAddress.status)}>
                                      {selectedAddress.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-400">Added</div>
                                  <div className="text-white">{selectedAddress.dateAdded}</div>
                                </div>
                              </div>

                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-5 bg-gray-800">
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                                  <TabsTrigger value="settings">Settings</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-6">
                                    <Card className="bg-gray-800 border-gray-700">
                                      <CardHeader>
                                        <CardTitle className="text-white text-lg">Address Information</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div>
                                          <Label className="text-gray-400 text-sm">Full Address</Label>
                                          <div className="flex items-center gap-2 mt-1">
                                            <code className="text-blue-400 text-sm bg-gray-900 p-2 rounded border break-all">
                                              {selectedAddress.address}
                                            </code>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0"
                                              onClick={() => copyToClipboard(selectedAddress.address)}
                                            >
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div>
                                          <Label className="text-gray-400 text-sm">Label</Label>
                                          <p className="text-white mt-1">{selectedAddress.label}</p>
                                        </div>
                                        <div>
                                          <Label className="text-gray-400 text-sm">Blockchain</Label>
                                          <div className="flex items-center gap-2 mt-1">
                                            <div
                                              className={`w-3 h-3 rounded-full ${getBlockchainColor(selectedAddress.blockchain)}`}
                                            ></div>
                                            <span className="text-white">{selectedAddress.blockchain}</span>
                                          </div>
                                        </div>
                                        <div>
                                          <Label className="text-gray-400 text-sm">Tags</Label>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedAddress.tags.map((tag, index) => (
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
                                        <CardTitle className="text-white text-lg">Monitoring Details</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div>
                                          <Label className="text-gray-400 text-sm">Monitoring Reason</Label>
                                          <p className="text-white mt-1">{selectedAddress.monitoringReason}</p>
                                        </div>
                                        <div>
                                          <Label className="text-gray-400 text-sm">Added By</Label>
                                          <p className="text-white mt-1">{selectedAddress.addedBy}</p>
                                        </div>
                                        <div>
                                          <Label className="text-gray-400 text-sm">Date Added</Label>
                                          <p className="text-white mt-1">{selectedAddress.dateAdded}</p>
                                        </div>
                                        <div>
                                          <Label className="text-gray-400 text-sm">Alert Threshold</Label>
                                          <p className="text-white mt-1">
                                            ${selectedAddress.alertThreshold.toLocaleString()}
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader>
                                      <CardTitle className="text-white text-lg">Activity Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-3 gap-6">
                                        <div className="text-center">
                                          <div className="flex items-center justify-center gap-2 mb-2">
                                            <Activity className="h-5 w-5 text-blue-400" />
                                            <span className="text-gray-400">Total Transactions</span>
                                          </div>
                                          <div className="text-2xl font-bold text-white">
                                            {selectedAddress.totalTransactions.toLocaleString()}
                                          </div>
                                        </div>
                                        <div className="text-center">
                                          <div className="flex items-center justify-center gap-2 mb-2">
                                            <DollarSign className="h-5 w-5 text-green-400" />
                                            <span className="text-gray-400">Total Volume</span>
                                          </div>
                                          <div className="text-2xl font-bold text-white">
                                            {selectedAddress.totalVolume}
                                          </div>
                                        </div>
                                        <div className="text-center">
                                          <div className="flex items-center justify-center gap-2 mb-2">
                                            <Clock className="h-5 w-5 text-yellow-400" />
                                            <span className="text-gray-400">Last Activity</span>
                                          </div>
                                          <div className="text-2xl font-bold text-white">
                                            {selectedAddress.lastActivity}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader>
                                      <CardTitle className="text-white text-lg">Notes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-white">{selectedAddress.notes}</p>
                                    </CardContent>
                                  </Card>
                                </TabsContent>

                                <TabsContent value="transactions" className="space-y-4">
                                  <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader>
                                      <CardTitle className="text-white text-lg">Recent Transactions</CardTitle>
                                      <CardDescription>Latest transactions involving this address</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-center py-8">
                                        <div className="text-gray-400 mb-4">
                                          Transaction history would be rendered here
                                        </div>
                                        <div className="bg-gray-900 rounded-lg p-8 border-2 border-dashed border-gray-600">
                                          <div className="text-gray-500">Transaction analysis including:</div>
                                          <ul className="text-sm text-gray-400 mt-2 space-y-1">
                                            <li>• Transaction hashes and amounts</li>
                                            <li>• Counterparty addresses</li>
                                            <li>• Risk scores and flags</li>
                                            <li>• Timeline visualization</li>
                                          </ul>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>

                                <TabsContent value="alerts" className="space-y-4">
                                  <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader>
                                      <CardTitle className="text-white text-lg flex items-center gap-2">
                                        <Bell className="h-5 w-5" />
                                        Alert Configuration
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <Label className="text-white">Enable Alerts</Label>
                                          <p className="text-sm text-gray-400">
                                            Receive notifications when this address has activity
                                          </p>
                                        </div>
                                        <Switch checked={selectedAddress.alertsEnabled} />
                                      </div>
                                      <div>
                                        <Label className="text-gray-400">Alert Threshold (USD)</Label>
                                        <Input
                                          type="number"
                                          value={selectedAddress.alertThreshold}
                                          className="bg-gray-900 border-gray-600 mt-1"
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <Label className="text-gray-400">Alert Types</Label>
                                        <div className="space-y-2">
                                          <div className="flex items-center space-x-2">
                                            <Switch id="incoming" defaultChecked />
                                            <Label htmlFor="incoming" className="text-white">
                                              Incoming transactions
                                            </Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Switch id="outgoing" defaultChecked />
                                            <Label htmlFor="outgoing" className="text-white">
                                              Outgoing transactions
                                            </Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Switch id="large" defaultChecked />
                                            <Label htmlFor="large" className="text-white">
                                              Large transactions (above threshold)
                                            </Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Switch id="suspicious" defaultChecked />
                                            <Label htmlFor="suspicious" className="text-white">
                                              Suspicious patterns
                                            </Label>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader>
                                      <CardTitle className="text-white text-lg">Recent Alerts</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-3">
                                        {[
                                          {
                                            type: "Large Transaction",
                                            message: "Transaction of $25,000 detected",
                                            time: "2 hours ago",
                                            severity: "high",
                                          },
                                          {
                                            type: "Suspicious Pattern",
                                            message: "Rapid transaction sequence detected",
                                            time: "6 hours ago",
                                            severity: "medium",
                                          },
                                          {
                                            type: "New Counterparty",
                                            message: "Transaction to unknown high-risk address",
                                            time: "1 day ago",
                                            severity: "high",
                                          },
                                        ].map((alert, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-900 rounded border"
                                          >
                                            <div className="flex items-center gap-3">
                                              <AlertCircle
                                                className={`h-5 w-5 ${
                                                  alert.severity === "high" ? "text-red-400" : "text-yellow-400"
                                                }`}
                                              />
                                              <div>
                                                <div className="text-white font-medium">{alert.type}</div>
                                                <div className="text-sm text-gray-400">{alert.message}</div>
                                              </div>
                                            </div>
                                            <div className="text-sm text-gray-400">{alert.time}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>

                                <TabsContent value="analysis" className="space-y-4">
                                  <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader>
                                      <CardTitle className="text-white text-lg">Risk Analysis</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-400">Sanctions Risk</span>
                                          <div className="flex items-center gap-2">
                                            <div className="w-32 bg-gray-700 rounded-full h-2">
                                              <div
                                                className="bg-red-500 h-2 rounded-full"
                                                style={{ width: "95%" }}
                                              ></div>
                                            </div>
                                            <span className="text-white">95%</span>
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-400">Money Laundering Risk</span>
                                          <div className="flex items-center gap-2">
                                            <div className="w-32 bg-gray-700 rounded-full h-2">
                                              <div
                                                className="bg-orange-500 h-2 rounded-full"
                                                style={{ width: "78%" }}
                                              ></div>
                                            </div>
                                            <span className="text-white">78%</span>
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-400">Privacy Risk</span>
                                          <div className="flex items-center gap-2">
                                            <div className="w-32 bg-gray-700 rounded-full h-2">
                                              <div
                                                className="bg-yellow-500 h-2 rounded-full"
                                                style={{ width: "65%" }}
                                              ></div>
                                            </div>
                                            <span className="text-white">65%</span>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>

                                <TabsContent value="settings" className="space-y-4">
                                  <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader>
                                      <CardTitle className="text-white text-lg">Address Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div>
                                        <Label className="text-gray-400">Status</Label>
                                        <Select defaultValue={selectedAddress.status.toLowerCase()}>
                                          <SelectTrigger className="bg-gray-900 border-gray-600 mt-1">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-gray-800 border-gray-700">
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="paused">Paused</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-gray-400">Category</Label>
                                        <Select defaultValue={selectedAddress.category.toLowerCase()}>
                                          <SelectTrigger className="bg-gray-900 border-gray-600 mt-1">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-gray-800 border-gray-700">
                                            <SelectItem value="critical">Critical</SelectItem>
                                            <SelectItem value="high_risk">High Risk</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-gray-400">Update Notes</Label>
                                        <Textarea
                                          className="bg-gray-900 border-gray-600 mt-1"
                                          defaultValue={selectedAddress.notes}
                                          rows={3}
                                        />
                                      </div>
                                      <div className="flex justify-between pt-4">
                                        <Button variant="destructive">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Remove Address
                                        </Button>
                                        <Button className="bg-blue-600 hover:bg-blue-700">
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Save Changes
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
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
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
