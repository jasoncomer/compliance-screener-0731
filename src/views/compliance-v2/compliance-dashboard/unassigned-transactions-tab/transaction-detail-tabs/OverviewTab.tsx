import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import { Transaction } from "../../components/types"

interface OverviewTabProps {
  transaction: Transaction
}

export default function OverviewTab({ transaction }: OverviewTabProps) {
  return (
    <div className="space-y-4">
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
                    {transaction.id}
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
                  <div className="text-white font-medium">ID: {transaction.clientId}</div>
                  <div className="text-sm text-gray-400">Verified Customer</div>
                </div>
              </div>

              <div>
                <Label className="text-gray-400 text-sm">Blockchain Network</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-white">{transaction.blockchain}</span>
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
                  <div className="text-white text-lg font-semibold">{transaction.amount}</div>
                  <div className="text-gray-400">{transaction.convertedAmount}</div>
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

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Address Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400 text-sm">From Address</Label>
              <div className="flex items-center justify-between mt-1 p-3 bg-gray-900 rounded border">
                <code className="text-blue-400 text-sm">1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</code>
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
                <code className="text-blue-400 text-sm">3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy</code>
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
    </div>
  )
}