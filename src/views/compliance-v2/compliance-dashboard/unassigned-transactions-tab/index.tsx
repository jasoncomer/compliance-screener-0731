import { useState } from "react"

import { Transaction } from "../components/types"

import RiskPatterns from "./components/RiskPatterns"
import StatsCards from "./components/StatsCards"
import TransactionFilters from "./components/TransactionFilters"
import TransactionsTable from "./components/TransactionsTable"

const mockTransactions: Transaction[] = [
  // Bitcoin Genesis Block transactions (1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)
  {
    id: "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16",
    clientId: "5665456546",
    counterpartyEntities: "Genesis Block Address",
    blockchain: "Bitcoin",
    amount: "BTC 50.0",
    convertedAmount: "$3,250,000.00",
    timestamp: "1/9/2009, 2:54:25 AM",
    riskScore: 0,
    status: "APPROVED",
  },
  {
    id: "a1075db55d416d3ca199f55b6084e2115b9345e016c5b7f7b8c8c8c8c8c8c8c8c",
    clientId: "5665456546",
    counterpartyEntities: "Genesis Block → Mixer Service",
    blockchain: "Bitcoin",
    amount: "BTC 10.0",
    convertedAmount: "$650,000.00",
    timestamp: "8/26/2025, 2:50:00 AM",
    riskScore: 30,
    status: "FLAGGED",
  },
  // Mixer service transactions (3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy)
  {
    id: "b8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8",
    clientId: "5665456546",
    counterpartyEntities: "Mixer Service Input",
    blockchain: "Bitcoin",
    amount: "BTC 25.0",
    convertedAmount: "$1,625,000.00",
    timestamp: "8/25/2025, 8:02:00 PM",
    riskScore: 95,
    status: "UNDER_REVIEW",
  },
  {
    id: "c9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9",
    clientId: "5665456546",
    counterpartyEntities: "Mixer Service Input",
    blockchain: "Bitcoin",
    amount: "BTC 15.0",
    convertedAmount: "$975,000.00",
    timestamp: "8/25/2025, 7:33:00 PM",
    riskScore: 85,
    status: "FLAGGED",
  },
  // Ethereum DeFi exploit transactions (0x742d35Cc6634C0532925a3b8D4C9db96DfB3f681)
  {
    id: "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8",
    clientId: "1234567890",
    counterpartyEntities: "DeFi Exploit Address",
    blockchain: "Ethereum",
    amount: "ETH 5.0",
    convertedAmount: "$12,500.00",
    timestamp: "8/26/2025, 1:15:00 AM",
    riskScore: 75,
    status: "UNDER_REVIEW",
  },
  {
    id: "0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9",
    clientId: "1234567890",
    counterpartyEntities: "DeFi Exploit Address",
    blockchain: "Ethereum",
    amount: "ETH 2.5",
    convertedAmount: "$6,250.00",
    timestamp: "8/25/2025, 6:45:00 PM",
    riskScore: 60,
    status: "APPROVED",
  },
]

export default function MonitoringTab() {
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTransactions = mockTransactions.filter((tx) => {
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus
    const matchesSearch = tx.clientId.includes(searchTerm) || tx.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      <StatsCards />
      <RiskPatterns />
      <TransactionFilters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <TransactionsTable transactions={filteredTransactions} />
    </div>
  )
}