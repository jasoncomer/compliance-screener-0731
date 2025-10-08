import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { AddressStat } from "./types"

interface StatsCardsProps {
  stats: AddressStat[]
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
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
  )
}