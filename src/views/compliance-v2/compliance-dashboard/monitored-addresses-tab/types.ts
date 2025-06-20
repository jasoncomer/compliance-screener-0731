export interface Address {
  id: string
  address: string
  blockchain: string
  label: string
  category: string
  riskScore: number
  status: string
  alertsEnabled: boolean
  dateAdded: string
  lastActivity: string
  totalTransactions: number
  totalVolume: string
  tags: string[]
  notes: string
  alertThreshold: number
  monitoringReason: string
  addedBy: string
}

export interface AddressStat {
  label: string
  value: string | number
  change: string
  icon: React.ComponentType<{ className?: string }>
}