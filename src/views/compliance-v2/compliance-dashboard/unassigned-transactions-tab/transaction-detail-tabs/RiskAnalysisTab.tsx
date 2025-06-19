import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { Transaction } from "../../components/types"

interface RiskAnalysisTabProps {
  transaction: Transaction
}

export default function RiskAnalysisTab({ transaction: _transaction }: RiskAnalysisTabProps) {
  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "bg-red-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  const riskFactors = [
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
  ]

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Risk Factors Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskFactors.map((risk, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-white font-medium">{risk.factor}</span>
                    <Badge className={`${getRiskScoreColor(risk.score)} text-white`}>+{risk.score}</Badge>
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
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                </div>
                <span className="text-white">75%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Terrorist Financing Risk</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                </div>
                <span className="text-white">45%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Sanctions Evasion Risk</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
                <span className="text-white">85%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}