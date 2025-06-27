
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

const transactions = [
  { hash: "0x123...abc", type: "in", from: "0x456...def", to: "Self", amount: "10.5 ETH", value: "$35,000" },
  { hash: "0x789...ghi", type: "out", from: "Self", to: "0xabc...123", amount: "2.1 ETH", value: "$7,000" },
  { hash: "0xdef...456", type: "in", from: "0x123...abc", to: "Self", amount: "5.0 ETH", value: "$17,500" },
  { hash: "0xabc...123", type: "out", from: "Self", to: "0x789...ghi", amount: "1.0 ETH", value: "$3,500" },
]

const counterparties = [
  { address: "0x456...def", risk: 85, exposure: "$175,000", tags: ["Hacker", "Sanctions"] },
  { address: "0xabc...123", risk: 20, exposure: "$35,000", tags: ["Exchange"] },
  { address: "0x123...abc", risk: 92, exposure: "$52,500", tags: ["Sanctions"] },
]

const alerts = [
  { id: 1, description: "Transaction to Sanctioned Entity", timestamp: "2 days ago", severity: "High" },
  { id: 2, description: "Funds received from known Hacker address", timestamp: "3 days ago", severity: "High" },
  { id: 3, description: "Large withdrawal to a new address", timestamp: "5 days ago", severity: "Medium" },
]

export function DataTabs() {
  return (
    <Tabs defaultValue="transactions">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        <TabsTrigger value="counterparties">Counterparties</TabsTrigger>
        <TabsTrigger value="alerts">Alerts</TabsTrigger>
      </TabsList>
      <TabsContent value="transactions">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction Hash</TableHead>
              <TableHead className="text-center">Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.hash}>
                <TableCell className="font-mono">{tx.hash}</TableCell>
                <TableCell className="flex justify-center">
                  {tx.type === "in" ? (
                    <ArrowDownLeft className="h-5 w-5 text-green-400" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-red-400" />
                  )}
                </TableCell>
                <TableCell className="font-mono">{tx.from}</TableCell>
                <TableCell className="font-mono">{tx.to}</TableCell>
                <TableCell className="text-right">
                  <div>{tx.amount}</div>
                  <div className="text-xs text-muted-foreground">{tx.value}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="counterparties">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead className="text-center">Risk</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Exposure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {counterparties.map((c) => (
              <TableRow key={c.address}>
                <TableCell className="font-mono">{c.address}</TableCell>
                <TableCell className="text-center font-bold">
                  <span className={c.risk > 80 ? "text-red-400" : c.risk > 50 ? "text-yellow-400" : "text-green-400"}>
                    {c.risk}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((tag) => (
                      <Badge key={tag} variant={tag === "Sanctions" || tag === "Hacker" ? "destructive" : "secondary"}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">{c.exposure}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="alerts">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>{alert.description}</TableCell>
                <TableCell>
                  <Badge variant={alert.severity === "High" ? "destructive" : "secondary"}>{alert.severity}</Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{alert.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  )
} 