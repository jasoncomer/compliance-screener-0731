
import { useEffect, useState } from "react"

import {
  BarChart3,
  Bitcoin,
  Building2,
  Database,
  FileText,
  GitBranch,
  Globe,
  Hash,
  Plus,
  Shield,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { TruncatedTransactionLink } from "@/components/ui/truncated-transaction-link"
import { IComplianceTransaction } from "@/typings/compliance"

import { useAppContext } from "../../../../context/AppContext"
import { useAttribution } from "../../../../context/AttributionContext"
import { useCryptoPrices } from "../../../../hooks/useCryptoPrices"
import { useAppDispatch, useAppSelector } from "../../../../store/hooks"
import { fetchSOT, selectSotItemsMap } from "../../../../store/slices/sotSlice"
import { SOT } from "../../../../typings/interfaces"
import { TransactionRiskModal } from "../modals/TransactionRiskModal"
import { CaseReportBuilderModal } from "../../../../components/modals/CaseReportBuilderModal"


interface UnassignedTransactionModalProps {
  transaction: IComplianceTransaction | null
  isOpen: boolean
  onClose: () => void
  onAssign: (reviewerId: string, notes?: string, status?: string) => void
  teamMembers: { id: string; name: string; role: string }[]
  onTransactionUpdate?: (updatedTransaction: IComplianceTransaction) => void
  calculatedRiskScore?: number
}

export function UnassignedTransactionModal({
  transaction,
  isOpen,
  onClose,
  onAssign,
  teamMembers,
  onTransactionUpdate,
  calculatedRiskScore,
}: UnassignedTransactionModalProps) {

  const itemsMap = useAppSelector(selectSotItemsMap) || {};
  const { attributions } = useAttribution();
  const { user: currentUser } = useAppContext();
  const dispatch = useAppDispatch();
  const { prices } = useCryptoPrices();

  // Fetch SOT data when modal opens
  useEffect(() => {
    if (isOpen && Object.keys(itemsMap).length === 0) {
      console.log('Fetching SOT data for modal');
      dispatch(fetchSOT());
    }
  }, [isOpen, dispatch]); // Removed itemsMap from dependencies to prevent infinite loops

  const [selectedReviewer, setSelectedReviewer] = useState<string>("")
  const [assignmentNotes, setAssignmentNotes] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false)
  const [detailedRiskData, setDetailedRiskData] = useState<any>(null)
  const [riskDataLoading, setRiskDataLoading] = useState(false)
  const [isCaseReportModalOpen, setIsCaseReportModalOpen] = useState(false)

  // Debug: Log when risk modal opens
  useEffect(() => {
    console.log('Risk modal state changed:', {
      isRiskModalOpen,
      transactionId: transaction?.txId,
      hasTransaction: !!transaction
    });
  }, [isRiskModalOpen, transaction?.txId]);

  // Debug: Log transaction data
  useEffect(() => {
    if (transaction) {
      console.log('Transaction data:', {
        txId: transaction.txId,
        counterpartyEntities: transaction.counterpartyEntities,
        riskScores: transaction.riskScores,
        itemsMapKeys: Object.keys(itemsMap),
        attributionsKeys: Object.keys(attributions)
      });
    }
  }, [transaction, itemsMap, attributions]);

  // Reset assignment notes, selected reviewer, and selected status when transaction changes
  useEffect(() => {
    if (transaction) {
      setAssignmentNotes("");
      setSelectedReviewer("");
      setSelectedStatus("");
    }
  }, [transaction?.txId]);

  // Fetch detailed risk data when modal opens
  useEffect(() => {
    const fetchDetailedRiskData = async () => {
      if (isOpen && transaction && !detailedRiskData) {
        setRiskDataLoading(true);
        try {
          // Simulate API call - in real implementation, this would call the risk analysis service
          // For now, we'll create mock data based on the transaction's risk scores
          const mockRiskData = {
            entityRisk: {
              factors: [
                {
                  id: 'entity-type',
                  score: 0.3,
                  description: 'Risk based on entity type fund'
                },
                {
                  id: 'kyc',
                  score: 0.0,
                  description: 'This entity has KYC requirements'
                }
              ]
            },
            jurisdictionRisk: {
              factors: [
                {
                  id: 'jurisdiction-compliance',
                  score: 0.25,
                  description: 'Jurisdiction compliance risk assessment'
                }
              ]
            },
            transactionRisk: {
              factors: [
                {
                  id: 'transaction-amount',
                  score: 0.15,
                  description: 'Transaction amount risk analysis'
                },
                {
                  id: 'transaction-frequency',
                  score: 0.1,
                  description: 'Transaction frequency risk'
                }
              ]
            }
          };
          
          setDetailedRiskData(mockRiskData);
        } catch (error) {
          console.error('Error fetching detailed risk data:', error);
        } finally {
          setRiskDataLoading(false);
        }
      }
    };

    fetchDetailedRiskData();
  }, [isOpen, transaction, detailedRiskData]);



  const getChainTicker = (blockchain: string) => {
    const tickerMap: Record<string, string> = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'litecoin': 'LTC',
      'bitcoin-cash': 'BCH',
      'dogecoin': 'DOGE',
      'ripple': 'XRP',
      'cardano': 'ADA',
      'polkadot': 'DOT',
      'chainlink': 'LINK',
      'uniswap': 'UNI'
    }
    return tickerMap[blockchain.toLowerCase()] || blockchain.toUpperCase()
  }



  const formatCurrency = (amount: number, blockchain: string) => {
    // Get the most recent recorded price (even if stale) from the prices object
    const btcPriceData = prices['BTC'];
    const ethPriceData = prices['ETH'];

    // Check if we have price data available
    if (blockchain.toLowerCase() === "bitcoin" && !btcPriceData?.price) {
      return "Pricing Currently Unavailable";
    } else if (blockchain.toLowerCase() === "ethereum" && !ethPriceData?.price) {
      return "Pricing Currently Unavailable";
    }

    const btcPrice = btcPriceData?.price;
    const ethPrice = ethPriceData?.price;

    let usdValue = amount
    if (blockchain.toLowerCase() === "bitcoin") {
      // Convert from satoshis to BTC first, then to USD
      usdValue = (amount / 100000000) * btcPrice
    } else if (blockchain.toLowerCase() === "ethereum") {
      // For Ethereum, amount is already in ETH units
      usdValue = amount * ethPrice
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(usdValue)
  }

  const handleAssign = () => {
    // If no reviewer is selected, use the current user
    const reviewerId = selectedReviewer || currentUser?._id;
    
    if (reviewerId) {
      onAssign(reviewerId, assignmentNotes, selectedStatus)
      setSelectedReviewer("")
      setAssignmentNotes("")
      setSelectedStatus("")
      onClose()
    }
  }

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <div className="flex flex-col space-y-3 text-center sm:text-left">
            <div className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="tracking-tight text-xl font-semibold text-gray-900 dark:text-gray-100">
                Transaction Details
              </DialogTitle>
          <div className="flex items-center gap-3">
            <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                  <SelectTrigger className="w-48">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
                  <SelectContent>
                {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="transaction-info" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="transaction-info">Transaction Information</TabsTrigger>
            <TabsTrigger value="transaction-risk">Transaction Risk</TabsTrigger>
            <TabsTrigger value="counterparty-info">Counterparty Information</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="case-report">Case Report</TabsTrigger>
          </TabsList>

          <TabsContent value="transaction-info" className="space-y-6">
            {/* Transaction Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction Information</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Complete transaction details and metadata</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                          Transaction ID
                        </Label>
                        <div className="flex items-center gap-2">
                    <TruncatedTransactionLink txId={transaction.txId} />
                        </div>
                  </div>

                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                          Client ID
                        </Label>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{transaction.clientId}</p>
                  </div>

                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                          Blockchain
                        </Label>
                    <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                            <Bitcoin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{transaction.blockchain}</p>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                          Timestamp
                        </Label>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {transaction.timestamp.toLocaleString()}
                        </p>
                  </div>

                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                          Amount
                        </Label>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {(transaction.amount / 100000000).toFixed(8)} {getChainTicker(transaction.blockchain)}
                    </p>
                  </div>

                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                          USD Value
                        </Label>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(transaction.amount, transaction.blockchain)}
                    </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assignment</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Assign this transaction to a reviewer</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Assignment Notes
                      </Label>
                      <Textarea
                        placeholder="Add notes for the assigned reviewer..."
                        value={assignmentNotes}
                        onChange={(e) => setAssignmentNotes(e.target.value)}
                        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                        rows={3}
                      />
                  </div>
                </div>
                    </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                    <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage status and navigate to related tools</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">Update Status to:</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-48 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNREVIEWED">Unreviewed</SelectItem>
                          <SelectItem value="IN_REVIEW">In Review</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="HOLD">Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">Navigation Tools</Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => window.open(`/home/block-explorer/transaction/${transaction.txId}`, '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium">Block Explorer</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/home/risk-dashboard', '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium">Risk Dashboard</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/home/flow-trace', '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium">FlowTrace</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/home/vasp-explorer', '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Database className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-medium">VASP Explorer</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transaction-risk" className="space-y-6">
            {/* Risk Analysis Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction Risk Analysis</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Comprehensive risk assessment and scoring</p>
                </div>
          </div>

              {/* Risk Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Risk Score</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {calculatedRiskScore !== undefined ? calculatedRiskScore : (transaction.riskScores[0] || 0)}<span className="text-base font-normal">/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${calculatedRiskScore !== undefined ? calculatedRiskScore : (transaction.riskScores[0] || 0)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Risk</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">15<span className="text-base font-normal">/100</span></div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Entity Risk</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">23<span className="text-base font-normal">/100</span></div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: '23%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Jurisdiction Risk</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">25<span className="text-base font-normal">/100</span></div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Factors Analysis */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Factors Analysis</h4>
                  </div>
                  
                  <Tabs defaultValue="entity-risk" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <TabsTrigger value="entity-risk" className="text-xs">Entity Risk</TabsTrigger>
                      <TabsTrigger value="jurisdiction-risk" className="text-xs">Jurisdiction Risk</TabsTrigger>
                      <TabsTrigger value="transaction-risk" className="text-xs">Transaction Risk</TabsTrigger>
                    </TabsList>

                    <TabsContent value="entity-risk" className="mt-4">
                      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Risk Factor</th>
                              <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Risk Score</th>
                              <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-900 dark:text-gray-100">entity-type</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className="h-2 rounded-full bg-yellow-500" style={{ width: '30%' }}></div>
                                  </div>
                                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                    30%
                                  </Badge>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Risk based on entity type fund</td>
                            </tr>
                            <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-900 dark:text-gray-100">kyc</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className="h-2 rounded-full bg-green-500" style={{ width: '0%' }}></div>
                                  </div>
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                    0%
                                  </Badge>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">This entity has KYC requirements</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>

                    <TabsContent value="jurisdiction-risk" className="mt-4">
                      {riskDataLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Loading jurisdiction risk factors...</div>
                        </div>
                      ) : detailedRiskData?.jurisdictionRisk?.factors?.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Risk Factor</th>
                                <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Risk Score</th>
                                <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedRiskData.jurisdictionRisk.factors.map((factor: any, index: number) => {
                                const percentage = Math.round(factor.score * 100);
                                const getRiskColor = (score: number) => {
                                  if (score < 30) return 'bg-green-500';
                                  if (score < 70) return 'bg-yellow-500';
                                  return 'bg-red-500';
                                };
                                const getBadgeColor = (score: number) => {
                                  if (score < 30) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                                  if (score < 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                                  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                                };
                                
                                return (
                                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900 dark:text-gray-100">{factor.id}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                          <div className={`h-2 rounded-full ${getRiskColor(percentage)}`} style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <Badge className={`text-xs ${getBadgeColor(percentage)}`}>{percentage}%</Badge>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{factor.description}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No jurisdiction risk factors found</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="transaction-risk" className="mt-4">
                      {riskDataLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Loading transaction risk factors...</div>
                        </div>
                      ) : detailedRiskData?.transactionRisk?.factors?.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Risk Factor</th>
                                <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Risk Score</th>
                                <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedRiskData.transactionRisk.factors.map((factor: any, index: number) => {
                                const percentage = Math.round(factor.score * 100);
                                const getRiskColor = (score: number) => {
                                  if (score < 30) return 'bg-green-500';
                                  if (score < 70) return 'bg-yellow-500';
                                  return 'bg-red-500';
                                };
                                const getBadgeColor = (score: number) => {
                                  if (score < 30) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                                  if (score < 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                                  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                                };
                                
                                return (
                                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900 dark:text-gray-100">{factor.id}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                          <div className={`h-2 rounded-full ${getRiskColor(percentage)}`} style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <Badge className={`text-xs ${getBadgeColor(percentage)}`}>{percentage}%</Badge>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{factor.description}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No transaction risk factors found</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage status and navigate to related tools</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">Update Status to:</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-48 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNREVIEWED">Unreviewed</SelectItem>
                          <SelectItem value="IN_REVIEW">In Review</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="HOLD">Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">Navigation Tools</Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                          onClick={() => window.open(`/home/block-explorer/transaction/${transaction.txId}`, '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium">Block Explorer</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/home/risk-dashboard', '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium">Risk Dashboard</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/home/flow-trace', '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium">FlowTrace</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/home/vasp-explorer', '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Database className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-medium">VASP Explorer</span>
                  </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="counterparty-info" className="space-y-6">
            {/* Counterparty Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Counterparty Information</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Entity details and counterparty analysis</p>
                </div>
              </div>

              <div className="space-y-4">
                  {transaction.counterpartyEntities.map((entity, index) => {
                    // Find SOT data for this entity
                    const getEntitySot = (entityId: string): SOT | null => {
                      if (!itemsMap || Object.keys(itemsMap).length === 0) {
                        return null;
                      }
                      // First try direct lookup by entity_id (since that's how it's indexed)
                      if (itemsMap[entityId]) {
                        return itemsMap[entityId];
                      }
                      // Fallback: search by proper_name if direct lookup fails
                      return Object.values(itemsMap).find(sot =>
                        sot.proper_name?.toLowerCase() === entityId.toLowerCase()
                      ) || null;
                    };

                  // Try to find SOT data first, then fall back to attributions
                  let entitySot = getEntitySot(entity);
                  if (!entitySot) {
                    // If not found by entity ID, try with attribution name
                    const entityName = attributions[entity]?.entity;
                    if (entityName) {
                      entitySot = getEntitySot(entityName);
                    }
                  }

                    return (
                    <div key={index} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <div className="space-y-4">
                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50">
                          <div className="space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                            {entitySot?.logo && (
                              <img
                                src={entitySot.logo}
                                alt={`${entitySot.proper_name} logo`}
                                    className="w-14 h-14 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 capitalize">
                              {entitySot?.proper_name || attributions[entity]?.entity || entity}
                            </h4>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                  {entitySot?.entity_type || 'Unknown'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Entity ID</Label>
                                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                    {entitySot?.entity_id || entity}
                                  </span>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Description</Label>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {entitySot?.description_merged || 'No description available for this entity.'}
                                  </p>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Contact Information</Label>
                                  <div className="space-y-2">
                                    {entitySot?.contact_email && (
                                      <div className="text-sm">
                                        <strong>Email:</strong> {entitySot.contact_email}
                                      </div>
                                    )}
                                    {entitySot?.contact_address && (
                                      <div className="text-sm">
                                        <strong>Address:</strong> {entitySot.contact_address}
                          </div>
                                    )}
                                    {entitySot?.legal_info_url && (
                                      <div className="text-sm">
                                        <strong>Legal Info:</strong>
                                        <a 
                                          href={entitySot.legal_info_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                                        >
                                          <Globe className="h-3 w-3 inline mr-1" />
                                          View Legal Information
                                        </a>
                        </div>
                                    )}
                                  </div>
                                </div>
                            </div>
                      
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Websites</Label>
                                  <div className="space-y-2">
                                    {entitySot?.url && (
                                      <a 
                                        href={entitySot.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                      >
                                        <Globe className="h-3 w-3" />
                                        {entitySot.url.replace(/^https?:\/\//, '')}
                                      </a>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Social Media Profiles</Label>
                                  <div className="space-y-2">
                                    {entitySot?.contact_twitter && (
                                      <a 
                                        href={entitySot.contact_twitter} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                                      >
                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path>
                                        </svg>
                                        {entitySot.contact_twitter}
                                      </a>
                                    )}
                                    {entitySot?.social_media_profile && (
                                      <a 
                                        href={entitySot.social_media_profile} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                                      >
                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
                                        </svg>
                                        {entitySot.social_media_profile}
                                      </a>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Additional Information</Label>
                                  <div className="space-y-2">
                                    {entitySot?.year_founded && (
                                      <div className="text-sm">
                                        <strong>Founded:</strong> {entitySot.year_founded}
                                      </div>
                                    )}
                                    {entitySot?.associate_country_1 && (
                                      <div className="text-sm">
                                        <strong>Associated Countries:</strong>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            {entitySot.associate_country_1}
                                </Badge>
                                          {entitySot.associate_country_2 && (
                                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                              {entitySot.associate_country_2}
                                            </Badge>
                                          )}
                            </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                    );
                  })}
                </div>

              {/* Quick Actions */}
              <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage status and navigate to related tools</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">Update Status to:</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-48 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNREVIEWED">Unreviewed</SelectItem>
                          <SelectItem value="IN_REVIEW">In Review</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="HOLD">Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">Navigation Tools</Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => window.open(`/home/block-explorer/transaction/${transaction.txId}`, '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium">Block Explorer</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/home/risk-dashboard', '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium">Risk Dashboard</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/home/flow-trace', '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium">FlowTrace</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/home/vasp-explorer', '_blank')}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Database className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-medium">VASP Explorer</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            {/* Notes Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction Notes</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add and manage notes for this transaction</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Notes</h4>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">Initial Review</h5>
                        <Badge variant="secondary" className="text-xs">General</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Transaction appears to be a standard exchange transfer. No immediate red flags identified.
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>By John Smith</span>
                        <span>{new Date().toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">Risk Assessment</h5>
                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Risk</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Low risk transaction based on counterparty verification and amount. Proceeding with standard processing.
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>By Sarah Johnson</span>
                        <span>{new Date(Date.now() - 3600000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="case-report" className="space-y-6">
            {/* Case Report Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generate Case Report</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Create a comprehensive compliance report for this transaction</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">Generate Case Report</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Create a comprehensive compliance report for this transaction</p>
                    </div>
                    <Button 
                      onClick={() => {
                        alert('🚀 Generate Report button clicked! Check console for details.');
                        console.log('🔘 Generate Report button clicked!');
                        console.log('📋 Current transaction:', transaction?.txId);
                        console.log('🔧 Setting modal state to true');
                        setIsCaseReportModalOpen(true);
                        console.log('✅ Modal state set to true');
                      }}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      🚀 TEST Generate Report
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">Report Status</h4>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">No report generated yet</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">Report Preview</h4>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <div className="aspect-video bg-white dark:bg-gray-800 rounded border flex items-center justify-center">
                        <div className="text-center">
                          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No report generated yet</p>
                          <p className="text-xs text-gray-400">Click "Generate Report" to create a comprehensive case report</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          <div className="flex gap-3">
            <Button onClick={handleAssign} disabled={!selectedReviewer && !currentUser?._id}>
                  Assign Transaction
                </Button>
          </div>
        </div>
      </DialogContent>

      {/* Input Transaction Risk Modal */}
      <TransactionRiskModal
        visible={isRiskModalOpen}
        onClose={() => {
          console.log('Closing risk modal');
          setIsRiskModalOpen(false);
        }}
        transaction={transaction}
        loading={false}
        showCounterPartyDetails={true}
        counterpartyEntities={transaction?.counterpartyEntities || []}
        attributions={attributions}
        itemsMap={itemsMap}
        storedRiskScores={transaction?.riskScores}
        title="Input Transaction Risk Analysis"
        onRiskScoreUpdate={(riskData) => {
          // Update the transaction's risk scores with the new calculated values
          if (transaction && riskData) {
            const newRiskScores = [
              Math.round(riskData.overallRisk),
              Math.round(riskData.entityRisk.aggregateScore),
              Math.round(riskData.jurisdictionRisk.aggregateScore),
              Math.round(riskData.transactionRisk.aggregateScore)
            ];

            // Create updated transaction object
            const updatedTransaction = {
              ...transaction,
              riskScores: newRiskScores
            };


            // Notify parent component of the update
            if (onTransactionUpdate) {
              console.log('Calling onTransactionUpdate with:', updatedTransaction);
              onTransactionUpdate(updatedTransaction);
            } else {
              console.log('No onTransactionUpdate callback provided');
            }
          } else {
            console.log('Risk score update skipped - missing transaction or riskData');
          }
        }}
      />

      {/* Case Report Builder Modal */}
      <CaseReportBuilderModal
        isOpen={isCaseReportModalOpen}
        onClose={() => setIsCaseReportModalOpen(false)}
        transaction={transaction}
        onReportGenerated={(report) => {
          console.log('Report generated:', report);
          // You can add additional logic here to handle the generated report
        }}
      />
    </Dialog>
  )
}
