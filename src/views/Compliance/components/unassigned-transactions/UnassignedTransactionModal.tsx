
import { useEffect, useState } from "react"

import {
  AlertTriangle,
  Bitcoin,
  Building2,
  CheckCircle,
  Clock,
  Coins,
  Eye,
  FileText,
  Hash,
  Shield,
  User,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TruncatedTransactionLink } from "@/components/ui/truncated-transaction-link"
import { useTheme } from "@/context/ThemeContext"
import { EComplianceTransactionStatus, IComplianceTransaction } from "@/typings/compliance"

import EntityQuickView from "../../../../components/EntityQuickView"
import { useAttribution } from "../../../../context/AttributionContext"
import { useCryptoPrices } from "../../../../hooks/useCryptoPrices"
import { useAppDispatch, useAppSelector } from "../../../../store/hooks"
import { fetchSOT, selectSotItemsMap } from "../../../../store/slices/sotSlice"
import { SOT } from "../../../../typings/interfaces"
import { getEntityTags } from "../../../../utils/sotUtils"
import { getComplianceReportStatusClassName } from "../../utils/compliance.utils"
import { TransactionRiskModal } from "../modals/TransactionRiskModal"


interface UnassignedTransactionModalProps {
  transaction: IComplianceTransaction | null
  isOpen: boolean
  onClose: () => void
  onAssign: (reviewerId: string, notes?: string) => void
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
  const dispatch = useAppDispatch();
  const { prices } = useCryptoPrices();

  // Fetch SOT data when modal opens
  useEffect(() => {
    if (isOpen && Object.keys(itemsMap).length === 0) {
      console.log('Fetching SOT data for modal');
      dispatch(fetchSOT());
    }
  }, [isOpen, itemsMap, dispatch]);

  const { theme } = useTheme();
  const [selectedReviewer, setSelectedReviewer] = useState<string>("")
  const [assignmentNotes, setAssignmentNotes] = useState("")
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false)
  const [riskScoreUpdateTrigger, setRiskScoreUpdateTrigger] = useState(0)

  // Debug: Log when risk modal opens
  useEffect(() => {
    console.log('Risk modal state changed:', {
      isRiskModalOpen,
      transactionId: transaction?.txId,
      hasTransaction: !!transaction
    });
  }, [isRiskModalOpen, transaction?.txId]);

  const getStatusIcon = (status: EComplianceTransactionStatus) => {
    switch (status) {
      case EComplianceTransactionStatus.UNASSIGNED:
        return <Clock className="h-3 w-3" />
      case EComplianceTransactionStatus.UNREVIEWED:
        return <User className="h-3 w-3" />
      case EComplianceTransactionStatus.IN_REVIEW:
        return <User className="h-3 w-3" />
      case EComplianceTransactionStatus.APPROVED:
        return <CheckCircle className="h-3 w-3" />
      case EComplianceTransactionStatus.HOLD:
        return <AlertTriangle className="h-3 w-3" />
      case EComplianceTransactionStatus.CLOSED_WITH_NOTE:
        return <X className="h-3 w-3" />
      case EComplianceTransactionStatus.CLOSED_WITH_SAR:
        return <Shield className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: EComplianceTransactionStatus) => {
    return getComplianceReportStatusClassName(status)
  }

  const getRiskLevel = (scores: number[]) => {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    if (avgScore >= 80) return { level: "HIGH", color: "text-red-400" }
    if (avgScore >= 60) return { level: "MEDIUM", color: "text-yellow-400" }
    return { level: "LOW", color: "text-green-400" }
  }

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

  const getBlockchainIcon = (blockchain: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'bitcoin': <Bitcoin className="w-5 h-5 text-orange-500" />,
      'ethereum': <Coins className="w-5 h-5 text-blue-500" />,
      'litecoin': <Coins className="w-5 h-5 text-gray-500" />,
      'bitcoin-cash': <Bitcoin className="w-5 h-5 text-green-500" />,
      'dogecoin': <Coins className="w-5 h-5 text-yellow-500" />,
      'ripple': <Coins className="w-5 h-5 text-blue-600" />,
      'cardano': <Coins className="w-5 h-5 text-blue-700" />,
      'polkadot': <Coins className="w-5 h-5 text-purple-500" />,
      'chainlink': <Coins className="w-5 h-5 text-blue-400" />,
      'uniswap': <Coins className="w-5 h-5 text-pink-500" />
    }
    return iconMap[blockchain.toLowerCase()] || <Coins className="w-5 h-5 text-gray-500" />
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
    if (selectedReviewer) {
      onAssign(selectedReviewer, assignmentNotes)
      setSelectedReviewer("")
      setAssignmentNotes("")
      onClose()
    }
  }

  if (!transaction) return null;

  const riskLevel = getRiskLevel(transaction.riskScores)

  // Theme-based styling
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const borderColor = isDark ? 'border-gray-800' : 'border-gray-200';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const cardBgColor = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const cardBorderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const mutedTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const selectBgColor = isDark ? 'bg-gray-800' : 'bg-white';
  const selectBorderColor = isDark ? 'border-gray-700' : 'border-gray-300';
  const textareaBgColor = isDark ? 'bg-gray-700' : 'bg-white';
  const textareaBorderColor = isDark ? 'border-gray-600' : 'border-gray-300';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-4xl max-h-[90vh] overflow-y-auto ${bgColor} ${borderColor} ${textColor}`}
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className={`text-xl font-semibold ${textColor}`}>Transaction Details</DialogTitle>
          <DialogDescription className="sr-only">
            Detailed view of transaction information, risk analysis, and assignment options
          </DialogDescription>
          <div className="flex items-center gap-3">
            <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
              <SelectTrigger className={`w-48 ${selectBgColor} ${selectBorderColor} ${textColor}`}>
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent className={`${selectBgColor} ${selectBorderColor}`}>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id} className={textColor}>
                    <div className="flex flex-col">
                      <span>{member.name}</span>
                      <span className={`text-xs ${mutedTextColor}`}>{member.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={onClose} variant="ghost" size="icon" className={`${mutedTextColor} hover:${textColor}`}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Main Transaction Info */}
          <div className="space-y-4">
            <Card className={`${cardBgColor} ${cardBorderColor}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 ${textColor} text-lg`}>
                  <Hash className="h-4 w-4" />
                  Transaction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-5">
                <div className="space-y-5">
                  <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                    <Label className={`text-xs font-bold ${mutedTextColor} uppercase tracking-wide block mb-2`}>Transaction ID</Label>
                    <TruncatedTransactionLink txId={transaction.txId} />
                  </div>

                  <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                    <Label className={`text-xs font-bold ${mutedTextColor} uppercase tracking-wide block mb-2`}>Client ID</Label>
                    <p className={`text-sm ${textColor}`}>{transaction.clientId}</p>
                  </div>

                  <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                    <Label className={`text-xs font-bold ${mutedTextColor} uppercase tracking-wide block mb-2`}>Blockchain</Label>
                    <div className="flex items-center gap-2">
                      {getBlockchainIcon(transaction.blockchain)}
                      <p className={`text-sm ${textColor} capitalize`}>{transaction.blockchain}</p>
                    </div>
                  </div>

                  <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                    <Label className={`text-xs font-bold ${mutedTextColor} uppercase tracking-wide block mb-2`}>Timestamp</Label>
                    <p className={`text-sm ${textColor}`}>{transaction.timestamp.toLocaleString()}</p>
                  </div>

                  <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                    <Label className={`text-xs font-bold ${mutedTextColor} uppercase tracking-wide block mb-2`}>Amount</Label>
                    <p className={`text-sm ${textColor}`}>
                      {(transaction.amount / 100000000).toFixed(8)} {getChainTicker(transaction.blockchain)}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Label className={`text-xs font-bold ${mutedTextColor} uppercase tracking-wide block mb-2`}>USD Value</Label>
                    <p className="text-sm font-semibold text-green-400">
                      {formatCurrency(transaction.amount, transaction.blockchain)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>



          </div>

          {/* Sidebar */}
          <div className="flex flex-col space-y-4">
            {/* Status & Risk - Combined */}
            <Card className={`${cardBgColor} ${cardBorderColor}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`flex items-center gap-2 ${textColor} text-lg`}>
                  <Shield className="h-4 w-4" />
                  Transaction Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <div className="flex justify-between items-center">
                  <span className={mutedTextColor}>Status</span>
                  <Badge className={`${getStatusColor(transaction.status)} flex items-center gap-1`}>
                    {getStatusIcon(transaction.status)}
                    {transaction.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className={mutedTextColor}>Risk Level</span>
                  <span className={`font-semibold ${riskLevel.color}`}>{riskLevel.level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={mutedTextColor}>Transaction Risk Score</span>
                  <div className="flex gap-1 items-center">
                    <span key={`overall-${riskScoreUpdateTrigger}`} className="font-semibold text-green-400">
                      {calculatedRiskScore !== undefined ? calculatedRiskScore : (transaction.riskScores[0] || 0)}
                    </span>
                    <button
                      onClick={() => {
                        console.log('Eye icon clicked, opening risk modal for transaction:', transaction?.txId);
                        setIsRiskModalOpen(true);
                      }}
                      className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="View detailed risk analysis"
                    >
                      <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Counterparty Information */}
            <Card className={`${cardBgColor} ${cardBorderColor}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 ${textColor} text-lg`}>
                  <Building2 className="h-4 w-4" />
                  Counterparty Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {transaction.counterpartyEntities.map((entity, index) => {
                    // Get entity name from attributions
                    const entityName = attributions[entity]?.entity || entity;

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

                    const entitySot = getEntitySot(entityName);

                    return (
                      <div key={index} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-gray-100 dark:bg-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3">
                            {entitySot?.logo && (
                              <img
                                src={entitySot.logo}
                                alt={`${entitySot.proper_name} logo`}
                                className="w-[30px] h-[30px] rounded-sm object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {entitySot?.proper_name || entityName}
                              </span>
                              {entitySot && (
                                <EntityQuickView
                                  entity={{
                                    _id: entitySot._id,
                                    proper_name: entitySot.proper_name,
                                    entity_id: entitySot.entity_id
                                  }}
                                  sot={entitySot}
                                  onViewFull={(sot) => {
                                    // Handle view full profile - could navigate to entity details page
                                    console.log('View full profile for entity:', sot.entity_id);
                                  }}
                                  onQuickView={(e, entityId) => {
                                    e.stopPropagation();
                                    // Handle quick view click
                                    console.log('Quick view for entity:', entityId);
                                  }}
                                  popoverPlacement="right"
                                  popoverWidth={450}
                                />
                              )}
                            </div>
                          </div>
                          {entitySot && (
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800 border-blue-200 text-xs"
                            >
                              {entitySot.entity_type}
                            </Badge>
                          )}
                        </div>
                        {entitySot && (() => {
                          const tags = getEntityTags(entitySot);
                          return tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tags.map((tag, tagIndex) => (
                                <Badge
                                  key={tagIndex}
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SAR Information */}
            {transaction.sarSubmitted && (
              <Card className={`${cardBgColor} ${cardBorderColor}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${textColor}`}>
                    <FileText className="h-4 w-4" />
                    SAR Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">SAR Submitted</Badge>
                    {transaction.sarReport && <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{transaction.sarReport}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assignment Section */}
            <Card className={`${cardBgColor} ${cardBorderColor}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`flex items-center gap-2 ${textColor} text-lg`}>
                  <FileText className="h-4 w-4" />
                  Assignment Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Add notes for the assigned reviewer..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className={`${textareaBgColor} ${textareaBorderColor} ${textColor} placeholder-gray-400`}
                  rows={3}
                />
                <Button onClick={handleAssign} className="w-full" disabled={!selectedReviewer}>
                  Assign Transaction
                </Button>
              </CardContent>
            </Card>

            {/* Spacer to push Notes to bottom */}
            <div className="flex-1"></div>

            {/* Notes */}
            {transaction.notes && (
              <Card className={`${cardBgColor} ${cardBorderColor}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${textColor} text-lg`}>
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{transaction.notes}</p>
                </CardContent>
              </Card>
            )}
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

            // Trigger a re-render by updating the trigger state
            setRiskScoreUpdateTrigger(prev => prev + 1);

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
    </Dialog>
  )
}
