import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ArchivedCasesTab() {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Archived Cases</CardTitle>
        <CardDescription>Completed and archived compliance cases</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400">Archived cases interface would be implemented here.</p>
      </CardContent>
    </Card>
  )
}