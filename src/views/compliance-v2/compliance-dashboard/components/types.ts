export interface Transaction {
  id: string
  txId: string // Bitcoin transaction hash
  clientId: string
  counterpartyEntities: string
  blockchain: string
  amount: string
  convertedAmount: string
  timestamp: string
  riskScore: number
  status: string
}