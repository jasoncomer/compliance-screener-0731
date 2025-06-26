
import { useState } from "react"
import { StatsCards } from "./StatsCards"
import { FiltersSection } from "./FiltersSection"
import { AddAddressDialog } from "./AddAddressDialog"
import { AddressTable } from "./AddressTable"
import { AddressDetailDialog } from "./AddressDetailDialog"
import { mockMonitoredAddresses, addressStats } from "./mockData"
import { Address } from "./types"

export default function MonitoredAddresses() {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterBlockchain, setFilterBlockchain] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const filteredAddresses = mockMonitoredAddresses.filter((addr) => {
    const matchesCategory = filterCategory === "all" || addr.category === filterCategory
    const matchesStatus = filterStatus === "all" || addr.status === filterStatus
    const matchesBlockchain = filterBlockchain === "all" || addr.blockchain === filterBlockchain
    const matchesSearch =
      addr.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addr.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addr.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesStatus && matchesBlockchain && matchesSearch
  })

  const handleViewAddress = (address: Address) => {
    setSelectedAddress(address)
    setShowDetailDialog(true)
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={addressStats} />

      <FiltersSection
        filterCategory={filterCategory}
        filterStatus={filterStatus}
        filterBlockchain={filterBlockchain}
        searchTerm={searchTerm}
        onCategoryChange={setFilterCategory}
        onStatusChange={setFilterStatus}
        onBlockchainChange={setFilterBlockchain}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddDialog(true)}
      />

      <AddressTable addresses={filteredAddresses} onViewAddress={handleViewAddress} />

      <AddAddressDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

      <AddressDetailDialog
        address={selectedAddress}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </div>
  )
}