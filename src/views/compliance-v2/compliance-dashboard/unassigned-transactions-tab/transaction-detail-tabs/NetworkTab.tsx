import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Transaction } from "../../components/types"

interface NetworkTabProps {
  transaction: Transaction
}

export default function NetworkTab({ transaction: _transaction }: NetworkTabProps) {
  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "bg-red-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  const relatedTransactions = [
    { hash: "7f425a88c3d47bef...", amount: "BTC 0.05", risk: 65, time: "2 hours ago" },
    { hash: "1f80a9b6c7d2fa43...", amount: "BTC 0.12", risk: 45, time: "5 hours ago" },
    { hash: "9a8b7c6d5e4f3a2b...", amount: "BTC 0.08", risk: 72, time: "1 day ago" },
  ]

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Transaction Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">Network visualization would be rendered here</div>
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
            {relatedTransactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded border">
                <div className="flex items-center gap-3">
                  <code className="text-blue-400 text-sm">{tx.hash}</code>
                  <span className="text-white">{tx.amount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getRiskScoreColor(tx.risk)} text-white`}>{tx.risk}</Badge>
                  <span className="text-gray-400 text-sm">{tx.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}