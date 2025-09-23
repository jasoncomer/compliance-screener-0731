import { Bell, Copy, ExternalLink,Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Address } from "./types"
import { copyToClipboard,getBlockchainColor, getCategoryColor, getRiskScoreColor, getStatusColor } from "./utils"

interface AddressTableProps {
  addresses: Address[]
  onViewAddress: (address: Address) => void
}

export function AddressTable({ addresses, onViewAddress }: AddressTableProps) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Monitored Addresses ({addresses.length})</CardTitle>
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
            {addresses.map((address) => (
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewAddress(address)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
  )
}