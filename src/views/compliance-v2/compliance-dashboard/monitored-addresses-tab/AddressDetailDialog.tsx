import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Bell,
  Copy,
  Target,
  Activity,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Trash2,
} from "lucide-react"
import { Address } from "./types"
import { getCategoryColor, getStatusColor, getRiskScoreColor, getBlockchainColor, copyToClipboard } from "./utils"

interface AddressDetailDialogProps {
  address: Address | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddressDetailDialog({ address, open, onOpenChange }: AddressDetailDialogProps) {
  if (!address) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-400" />
            Address Monitoring - {address.id}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Comprehensive monitoring and analysis for blockchain address
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Address Header */}
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Category</span>
                <Badge className={getCategoryColor(address.category)}>
                  {address.category.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Risk Score</span>
                <Badge
                  className={`${getRiskScoreColor(address.riskScore)} text-white text-lg px-3 py-1`}
                >
                  {address.riskScore}/100
                </Badge>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Status</span>
                <Badge className={getStatusColor(address.status)}>
                  {address.status}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Added</div>
              <div className="text-white">{address.dateAdded}</div>
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
                          {address.address}
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
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Label</Label>
                      <p className="text-white mt-1">{address.label}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Blockchain</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-3 h-3 rounded-full ${getBlockchainColor(address.blockchain)}`}
                        ></div>
                        <span className="text-white">{address.blockchain}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {address.tags.map((tag, index) => (
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
                      <p className="text-white mt-1">{address.monitoringReason}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Added By</Label>
                      <p className="text-white mt-1">{address.addedBy}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Date Added</Label>
                      <p className="text-white mt-1">{address.dateAdded}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Alert Threshold</Label>
                      <p className="text-white mt-1">
                        ${address.alertThreshold.toLocaleString()}
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
                        {address.totalTransactions.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-green-400" />
                        <span className="text-gray-400">Total Volume</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {address.totalVolume}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-yellow-400" />
                        <span className="text-gray-400">Last Activity</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {address.lastActivity}
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
                  <p className="text-white">{address.notes}</p>
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
                    <Switch checked={address.alertsEnabled} />
                  </div>
                  <div>
                    <Label className="text-gray-400">Alert Threshold (USD)</Label>
                    <Input
                      type="number"
                      value={address.alertThreshold}
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
                    <Select defaultValue={address.status.toLowerCase()}>
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
                    <Select defaultValue={address.category.toLowerCase()}>
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
                      defaultValue={address.notes}
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
      </DialogContent>
    </Dialog>
  )
}