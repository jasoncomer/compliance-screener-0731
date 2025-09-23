import { useState } from "react"

import { Transaction } from "../components/types"

import RiskPatterns from "./components/RiskPatterns"
import StatsCards from "./components/StatsCards"
import TransactionFilters from "./components/TransactionFilters"
import TransactionsTable from "./components/TransactionsTable"

const mockTransactions: Transaction[] = [
  {
    id: "5d313966d2f38aec0d5a9df2c7600de80eb10b5df52b7afed6e032079227753e4d",
    clientId: "12312323",
    counterpartyEntities: "N/A",
    blockchain: "Bitcoin",
    amount: "BTC 0.09008105",
    convertedAmount: "$959.48",
    timestamp: "6/12/2025, 2:42:05 PM",
    riskScore: 20,
    status: "UNASSIGNED",
  },
  {
    id: "7f425a88c3d47bef9a8c2e1d5f890ab4c6d20e8f73a9b1c4e5d6f7a8b9c0d1e2f3",
    clientId: "12312323",
    counterpartyEntities: "Suspicious Exchange",
    blockchain: "Bitcoin",
    amount: "BTC 0.02058156",
    convertedAmount: "$2,174.59",
    timestamp: "6/12/2025, 12:50:34 AM",
    riskScore: 85,
    status: "FLAGGED",
  },
  {
    id: "1f80a9b6c7d2fa43c8e9b0a1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
    clientId: "12312323",
    counterpartyEntities: "N/A",
    blockchain: "Bitcoin",
    amount: "BTC 0.02047116",
    convertedAmount: "$2,162.92",
    timestamp: "6/12/2025, 12:50:34 AM",
    riskScore: 21,
    status: "UNASSIGNED",
  },
  {
    id: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7",
    clientId: "45678901",
    counterpartyEntities: "High-Risk Wallet",
    blockchain: "Ethereum",
    amount: "ETH 2.5",
    convertedAmount: "$4,250.00",
    timestamp: "6/12/2025, 3:15:22 PM",
    riskScore: 92,
    status: "UNDER_REVIEW",
  },
  {
    id: "3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1",
    clientId: "78901234",
    counterpartyEntities: "N/A",
    blockchain: "Bitcoin",
    amount: "BTC 0.15",
    convertedAmount: "$1,590.75",
    timestamp: "6/12/2025, 1:30:45 PM",
    riskScore: 15,
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