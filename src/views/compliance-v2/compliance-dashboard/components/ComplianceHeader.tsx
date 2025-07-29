import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

export default function ComplianceHeader() {
  return (
    <header className="border-b border-gray-800 bg-gray-900">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-400" />
          <span className="text-xl font-bold">Compliance Monitor</span>
        </div>
        <nav className="ml-8 flex space-x-6">
          <Button variant="ghost" className="text-blue-400">
            Compliance Screener
          </Button>
          <Button variant="ghost" className="text-gray-400">
            Block Explorer
          </Button>
          <Button variant="ghost" className="text-gray-400">
            WASP Entity Explorer
          </Button>
        </nav>
        <div className="ml-auto">
          <span className="text-sm text-gray-400">bryan</span>
        </div>
      </div>
    </header>
  )
}