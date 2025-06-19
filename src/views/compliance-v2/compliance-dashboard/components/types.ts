export interface Transaction {
  id: string
  clientId: string
  counterpartyEntities: string
  blockchain: string
  amount: string
  convertedAmount: string
  timestamp: string
  riskScore: number
  status: string
}