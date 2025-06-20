import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search } from "lucide-react"

interface TransactionFiltersProps {
  filterStatus: string
  setFilterStatus: (status: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export default function TransactionFilters({
  filterStatus,
  setFilterStatus,
  searchTerm,
  setSearchTerm,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
            <SelectItem value="FLAGGED">Flagged</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2 flex-1">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by transaction ID or client ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border-gray-700"
        />
      </div>
    </div>
  )
}