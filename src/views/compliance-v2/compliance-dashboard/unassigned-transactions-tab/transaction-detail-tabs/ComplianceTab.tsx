import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Transaction } from "../../components/types"

interface ComplianceTabProps {
  transaction: Transaction
}

export default function ComplianceTab({ transaction: _transaction }: ComplianceTabProps) {
  const complianceChecks = [
    { check: "OFAC Sanctions List", status: "MATCH", severity: "critical" },
    { check: "EU Sanctions List", status: "CLEAR", severity: "safe" },
    { check: "PEP Database", status: "CLEAR", severity: "safe" },
    { check: "Adverse Media", status: "POTENTIAL", severity: "warning" },
    { check: "Internal Watchlist", status: "CLEAR", severity: "safe" },
  ]

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Compliance Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceChecks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded border">
                <span className="text-white">{check.check}</span>
                <Badge
                  variant={
                    check.severity === "critical"
                      ? "destructive"
                      : check.severity === "warning"
                        ? "secondary"
                        : "outline"
                  }
                  className={check.severity === "safe" ? "text-green-400 border-green-400" : ""}
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
              <span className="text-sm text-gray-400">Notes are automatically saved</span>
              <Button size="sm" variant="outline" className="border-gray-600">
                Add Evidence
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}