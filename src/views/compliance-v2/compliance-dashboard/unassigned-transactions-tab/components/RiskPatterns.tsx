import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const riskPatterns = [
  { name: "Rapid Transaction Velocity", count: 23, severity: "high" },
  { name: "Unusual Amount Patterns", count: 15, severity: "medium" },
  { name: "Sanctioned Entity Interaction", count: 8, severity: "critical" },
  { name: "Privacy Coin Usage", count: 12, severity: "medium" },
  { name: "Cross-Chain Bridging", count: 31, severity: "low" },
]

export default function RiskPatterns() {
  return (
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
  )
}