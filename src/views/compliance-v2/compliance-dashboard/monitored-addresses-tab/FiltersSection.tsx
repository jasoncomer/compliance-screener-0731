import { Filter, Plus,Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FiltersSectionProps {
  filterCategory: string
  filterBlockchain: string
  searchTerm: string
  onCategoryChange: (value: string) => void
  onBlockchainChange: (value: string) => void
  onSearchChange: (value: string) => void
  onAddClick: () => void
}

export function FiltersSection({
  filterCategory,
  filterBlockchain,
  searchTerm,
  onCategoryChange,
  onBlockchainChange,
  onSearchChange,
  onAddClick,
}: FiltersSectionProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={filterCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH_RISK">High Risk</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={filterBlockchain} onValueChange={onBlockchainChange}>
            <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Show All" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">Show All</SelectItem>
              <SelectItem value="Bitcoin">Bitcoin</SelectItem>
              <SelectItem value="Ethereum">Ethereum</SelectItem>
              <SelectItem value="Litecoin">Litecoin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search addresses, labels, or tags..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-gray-800 border-gray-700"
          />
        </div>
      </div>
      <Button className="bg-blue-600 hover:bg-blue-700" onClick={onAddClick}>
        <Plus className="h-4 w-4 mr-2" />
        Add Address
      </Button>
    </div>
  )
}