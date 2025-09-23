import React, { FC, useMemo, useState } from 'react';
import { IComplianceTransaction } from '../../../../typings/compliance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAppSelector } from '../../../../store/hooks';
import { selectTransactionById } from '../../../../store/slices/complianceTransactionsSlice';
import { selectActiveOrgMembersMap } from '../../../../store/slices/organizationsSlice';
import { useAttribution } from '../../../../context/AttributionContext';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';
import { getUserDisplayName } from '../../../../utils/display-labels';
import { getComplianceReportStatusClassName } from '../../utils/compliance.utils';
import EntityDisplayCard from '../../../../components/EntityDisplayCard';
import TransactionRiskModal from '../../components/modals/TransactionRiskModal';
import CaseAssignmentHistoryModal from '../CaseAssignmentHistoryModal';
import { 
  Hash, 
  Building2, 
  Shield, 
  FileText, 
  Bitcoin, 
  Eye,
  Clock,
  User,
  History
} from "lucide-react";

interface TransactionDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  transactionId: string | null;
  transactionData?: IComplianceTransaction | null;
  onAssign?: (reviewerId: string, notes?: string) => void;
  calculatedRiskScore?: number;
}

export const TransactionDetailsModal: FC<TransactionDetailsModalProps> = React.memo(({
  isVisible,
  onClose,
  transactionId,
  transactionData,
  onAssign,
  calculatedRiskScore,
}) => {
  const { attributions } = useAttribution();
  const { getPrice } = useCryptoPrices();
  const organizationMembers = useAppSelector(selectActiveOrgMembersMap);
  
  // State for assignment
  const [selectedReviewer, setSelectedReviewer] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isAssignmentHistoryOpen, setIsAssignmentHistoryOpen] = useState(false);
  
  // Try to get transaction from props first, then fall back to Redux store
  const transactionFromStore = useAppSelector(state => 
    transactionId ? selectTransactionById(state, transactionId) : null
  );
  
  // Memoize transaction details to prevent unnecessary re-renders
  const transaction = useMemo(() => {
    return transactionData || transactionFromStore;
  }, [transactionData, transactionFromStore]);

  // Get team members for assignment
  const teamMembers = useMemo(() => {
    return Object.values(organizationMembers).map(member => ({
      id: member._id,
      name: getUserDisplayName(member),
      role: member.role || 'Reviewer'
    }));
  }, [organizationMembers]);

  // Initialize assignment notes with existing notes if available
  React.useEffect(() => {
    const currentTransaction = transactionData || transactionFromStore;
    if (currentTransaction?.notes) {
      setAssignmentNotes(currentTransaction.notes);
    }
  }, [transactionData?.notes, transactionFromStore?.notes]);

  // Get BTC price for conversion
  const btcPrice = getPrice('BTC') || 0;
  const usdValue = transaction ? (transaction.amount ? ((transaction.amount / 100000000) * btcPrice) : 0) : 0;

  // Handle assignment
  const handleAssign = () => {
    if (selectedReviewer && onAssign) {
      onAssign(selectedReviewer, assignmentNotes);
      setSelectedReviewer('');
      setAssignmentNotes('');
    }
  };

  // Get risk level and color
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'HIGH', color: 'text-red-400' };
    if (score >= 50) return { level: 'MEDIUM', color: 'text-yellow-400' };
    return { level: 'LOW', color: 'text-green-400' };
  };

  const riskScore = calculatedRiskScore !== undefined ? calculatedRiskScore : (transaction?.riskScores?.[0] || 0);
  const riskInfo = getRiskLevel(riskScore);


  // Early return if modal is not visible or no transaction details
  if (!isVisible || !transactionId) {
    return null;
  }

  // Early return if no transaction data available
  if (!transaction) {
    return null;
  }

  return (
    <>
      <Dialog open={isVisible} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-row items-center justify-between space-y-0 pb-4">
              <DialogTitle className="tracking-tight text-xl font-semibold text-gray-900">
                Transaction Details
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id || ''}>
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
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Panel - Transaction Information */}
            <div className="space-y-4">
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Hash className="h-4 w-4" />
                    Transaction Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-5">
                    <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">
                        Transaction ID
                      </Label>
                      <a 
                        href={`https://app-staging.blockscout.ai/home/block-explorer/transaction/${transaction.txId}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-gray-900 break-all hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer block"
                      >
                        {transaction.txId}
                      </a>
                    </div>
                    
                    <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">
                        Client ID
                      </Label>
                      <p className="text-sm text-gray-900">{transaction.clientId || 'N/A'}</p>
                    </div>
                    
                    <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">
                        Blockchain
                      </Label>
                      <div className="flex items-center gap-2">
                        <Bitcoin className="w-5 h-5 text-orange-500" />
                        <p className="text-sm text-gray-900 capitalize">{transaction.blockchain}</p>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">
                        Timestamp
                      </Label>
                      <p className="text-sm text-gray-900">
                        {transaction.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">
                        Amount
                      </Label>
                      <p className="text-sm text-gray-900">
                        {transaction.amount ? `${(transaction.amount / 100000000).toFixed(8)} BTC` : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">
                        USD Value
                      </Label>
                      <p className="text-sm font-semibold text-green-400">
                        ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Risk, Counterparty, Assignment */}
            <div className="flex flex-col space-y-4">
              {/* Transaction Risk */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-4 w-4" />
                    Transaction Risk
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <Badge className={`${getComplianceReportStatusClassName(transaction.status)} flex items-center gap-1`}>
                      <Clock className="h-3 w-3" />
                      {transaction.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Risk Level</span>
                    <span className={`font-semibold ${riskInfo.color}`}>{riskInfo.level}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transaction Risk Score</span>
                    <div className="flex gap-1 items-center">
                      <span className={`font-semibold ${riskInfo.color}`}>{riskScore}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 p-1 h-auto"
                        onClick={() => setIsRiskModalOpen(true)}
                      >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Counterparty Information */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-4 w-4" />
                    Counterparty Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transaction.counterpartyEntities?.map((entityId, index) => {
                      // Get entity data from attributions
                      const entityData = attributions[entityId];
                      const entitySot = entityData?.entity;
                      
                      if (!entitySot) {
                        return (
                          <div key={index} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-gray-100 dark:bg-gray-700">
                            <EntityDisplayCard
                              entityId={entityId}
                              onQuickView={() => {
                                console.log('Quick view entity:', entityId);
                              }}
                            />
                          </div>
                        );
                      }
                      
                      return (
                        <div key={index} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-gray-100 dark:bg-gray-700">
                          <EntityDisplayCard
                            entityId={entityId}
                            entityName={entitySot}
                            onQuickView={() => {
                              console.log('Quick view entity:', entityId);
                            }}
                            onViewFull={() => {
                              console.log('View full entity:', entitySot);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Notes */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-4 w-4" />
                      Assignment Notes
                    </CardTitle>
                    {transaction.reviewerId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAssignmentHistoryOpen(true)}
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                      >
                        <History className="h-4 w-4" />
                        View History
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Show current assignment if exists */}
                  {transaction.reviewerId && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Currently Assigned To
                      </Label>
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          {getUserDisplayName(organizationMembers[transaction.reviewerId || '']) || 'Unknown User'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <Textarea
                    placeholder="Add notes for the assigned reviewer..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    rows={3}
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={handleAssign}
                    disabled={!selectedReviewer}
                    className="w-full"
                  >
                    {transaction.reviewerId ? 'Reassign Transaction' : 'Assign Transaction'}
                  </Button>
                </CardContent>
              </Card>

              <div className="flex-1"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Risk Modal */}
      <TransactionRiskModal
        visible={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        transaction={transaction}
        title="Transaction Risk Analysis"
        attributions={attributions}
        itemsMap={{}}
      />

      {/* Case Assignment History Modal */}
      <CaseAssignmentHistoryModal
        isVisible={isAssignmentHistoryOpen}
        onClose={() => setIsAssignmentHistoryOpen(false)}
        transaction={transaction}
      />
    </>
  );
});
