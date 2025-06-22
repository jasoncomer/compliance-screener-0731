import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AddressSummaryProps {
  balance: string
  scriptType: string
  firstBlock: string
  totalReceived: string
  lastBlock: string
  totalSpent: string
}

export function AddressSummary({
  balance,
  scriptType,
  firstBlock,
  totalReceived,
  lastBlock,
  totalSpent,
}: AddressSummaryProps) {
  return (
    <Card className="h-full flex flex-col bg-background">
      <CardHeader className="pb-2">
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm flex-grow">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Balance:</span>
          <span className="font-mono">{balance}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Script Type:</span>
          <span className="font-mono">{scriptType}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">First block:</span>
          <span className="font-mono">{firstBlock}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total received:</span>
          <span className="font-mono">{totalReceived}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Last block:</span>
          <span className="font-mono">{lastBlock}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total spent:</span>
          <span className="font-mono">{totalSpent}</span>
        </div>
      </CardContent>
    </Card>
  )
} 