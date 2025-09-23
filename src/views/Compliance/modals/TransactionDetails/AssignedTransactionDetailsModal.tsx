import React, { useMemo, useState } from 'react';
import { IComplianceTransaction, EComplianceTransactionStatus } from '../../../../typings/compliance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { selectTransactionById, updateTransactionStatus } from '../../../../store/slices/complianceTransactionsSlice';
import { selectActiveOrgMembersMap } from '../../../../store/slices/organizationsSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { useAttribution } from '../../../../context/AttributionContext';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';
import { getUserDisplayName } from '../../../../utils/display-labels';
import { getComplianceReportStatusClassName } from '../../utils/compliance.utils';
import EntityQuickView from '../../../../components/EntityQuickView';
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
  Globe,
  BarChart3,
  GitBranch,
  Database,
  History
} from "lucide-react";

interface AssignedTransactionDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  transactionId: string | null;
  transactionData?: IComplianceTransaction | null;
  onReassign?: (reviewerId: string, notes?: string) => void;
  calculatedRiskScore?: number;
}

const AssignedTransactionDetailsModal: React.FC<AssignedTransactionDetailsModalProps> = ({
  isVisible,
  onClose,
  transactionId,
  transactionData,
  onReassign,
  calculatedRiskScore
}) => {
  const dispatch = useAppDispatch();
  const { attributions } = useAttribution();
  const { getPrice, prices } = useCryptoPrices();
  
  // Safety checks for undefined values
  const safeAttributions = attributions || {};
  const safePrices = prices || {};
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [selectedReviewer, setSelectedReviewer] = useState<string>('');
  const [transactionNotes, setTransactionNotes] = useState<string>('');
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedEntityForPreview, setSelectedEntityForPreview] = useState<any>(null);
  const [isEntityPreviewOpen, setIsEntityPreviewOpen] = useState(false);
  const [isAssignmentHistoryOpen, setIsAssignmentHistoryOpen] = useState(false);
  
  const organizationMembersMap = useAppSelector(selectActiveOrgMembersMap) || {};
  const { itemsMap } = useSelector((state: RootState) => state.sot);
  const transaction = useAppSelector((state) => {
    if (!transactionId) return null;
    try {
      return selectTransactionById(state, transactionId);
    } catch (error) {
      console.warn('Error selecting transaction by ID:', error);
      return null;
    }
  });
  
  // Use transactionData if provided, otherwise use transaction from store
  const currentTransaction = transactionData || transaction;
  
  // Convert organization members map to array for the dropdown, excluding current assignee
  const teamMembers = useMemo(() => {
    const currentAssigneeId = currentTransaction?.reviewerId;
    return Object.values(organizationMembersMap)
      .filter(member => member.userId !== currentAssigneeId) // Exclude current assignee
      .map(member => ({
        id: member.userId || '',
        name: getUserDisplayName(member)
      }));
  }, [organizationMembersMap, currentTransaction?.reviewerId]);

  // Get current assignee info
  const currentAssignee = currentTransaction?.reviewerId ? organizationMembersMap[currentTransaction.reviewerId] : null;
  const currentAssigneeName = currentAssignee ? getUserDisplayName(currentAssignee) : 'Unknown';

  // Get BTC price
  React.useEffect(() => {
    if (safePrices && safePrices.BTC && safePrices.BTC.price) {
      setBtcPrice(safePrices.BTC.price);
    } else if (getPrice) {
      // getPrice returns a number | null, not a Promise
      const price = getPrice('BTC');
      if (price) {
        setBtcPrice(price);
      }
    }
  }, [safePrices, getPrice]);

  // Fetch price when component mounts
  React.useEffect(() => {
    if (isVisible && btcPrice === 0 && getPrice) {
      // getPrice returns a number | null, not a Promise
      const price = getPrice('BTC');
      if (price) {
        setBtcPrice(price);
      }
    }
  }, [isVisible, btcPrice, getPrice]);

  // Clear transaction notes when switching between transactions
  React.useEffect(() => {
    setTransactionNotes('');
    setSelectedReviewer('');
    setSelectedStatus('');
  }, [transactionId]);

  // Get risk level and color
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'HIGH', color: 'text-red-400' };
    if (score >= 50) return { level: 'MEDIUM', color: 'text-yellow-400' };
    return { level: 'LOW', color: 'text-green-400' };
  };

  const riskScore = calculatedRiskScore !== undefined ? calculatedRiskScore : (currentTransaction?.riskScores?.[0] || 0);
  const riskInfo = getRiskLevel(riskScore);

  // Handle reassignment
  const handleReassign = async () => {
    if (!selectedReviewer || !onReassign) return;
    
    try {
      await onReassign(selectedReviewer);
      setSelectedReviewer('');
    } catch (error) {
      console.error('Error reassigning transaction:', error);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!currentTransaction || !transactionId) return;
    
    try {
      await dispatch(updateTransactionStatus({
        transactionId,
        status: newStatus
      })).unwrap();
      
      console.log('Transaction status updated successfully');
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  };

  // Handle saving transaction notes
  const handleSaveNotes = async () => {
    if (!currentTransaction || !transactionId) return;
    
    try {
      // TODO: Implement API call to save transaction notes
      // For now, just log the notes
      console.log('Saving transaction notes:', transactionNotes);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Transaction notes saved successfully');
    } catch (error) {
      console.error('Error saving transaction notes:', error);
    }
  };

  // Handle VASP preview
  const handleQuickView = (e: React.MouseEvent, entityId: string) => {
    console.log('handleQuickView called with entityId:', entityId);
    e.stopPropagation();
    const entityData = safeAttributions[entityId];
    console.log('entityData:', entityData);
    
    // Look up SOT data from itemsMap using the entity ID
    const sotData = Object.values(itemsMap).find(sot => sot.entity_id === entityData?.entity);
    
    if (sotData) {
      console.log('Opening VASP preview for:', sotData.proper_name);
      setSelectedEntityForPreview({
        entity: {
          _id: sotData._id,
          proper_name: sotData.proper_name,
          entity_id: sotData.entity_id
        },
        sot: sotData
      });
      setIsEntityPreviewOpen(true);
    } else {
      console.log('No SOT data found for entityId:', entityId);
    }
  };

  const handleViewFullProfile = (sot: any) => {
    // Navigate to VASP Explorer with the entity
    window.open(`/home/blockham?entity=${sot.entity_id}`, '_blank');
    setIsEntityPreviewOpen(false);
  };

  // Navigation functions with automatic status change to "In Review"
  const navigateToBlockExplorer = async () => {
    // Update status to "In Review" before navigation
    if (currentTransaction?.status !== EComplianceTransactionStatus.IN_REVIEW) {
      await handleStatusUpdate(EComplianceTransactionStatus.IN_REVIEW);
    }
    window.open(`/home/block-explorer/transaction/${currentTransaction?.txId}`, '_blank');
  };

  const navigateToRiskDashboard = async () => {
    // Update status to "In Review" before navigation
    if (currentTransaction?.status !== EComplianceTransactionStatus.IN_REVIEW) {
      await handleStatusUpdate(EComplianceTransactionStatus.IN_REVIEW);
    }
    window.open('/home/risk-dashboard', '_blank');
  };

  const navigateToFlowTrace = async () => {
    // Update status to "In Review" before navigation
    if (currentTransaction?.status !== EComplianceTransactionStatus.IN_REVIEW) {
      await handleStatusUpdate(EComplianceTransactionStatus.IN_REVIEW);
    }
    window.open('/home/flow-trace', '_blank');
  };

  const navigateToVASPExplorer = async () => {
    // Update status to "In Review" before navigation
    if (currentTransaction?.status !== EComplianceTransactionStatus.IN_REVIEW) {
      await handleStatusUpdate(EComplianceTransactionStatus.IN_REVIEW);
    }
    window.open('/home/blockham', '_blank');
  };

  // Status options
  const statusOptions = [
    { value: EComplianceTransactionStatus.UNASSIGNED, label: 'Unassigned' },
    { value: EComplianceTransactionStatus.UNREVIEWED, label: 'Unreviewed' },
    { value: EComplianceTransactionStatus.IN_REVIEW, label: 'In Review' },
    { value: EComplianceTransactionStatus.APPROVED, label: 'Approved' },
    { value: EComplianceTransactionStatus.HOLD, label: 'Hold' },
    { value: EComplianceTransactionStatus.CLOSED_WITH_NOTE, label: 'Approved with Note' },
    { value: EComplianceTransactionStatus.CLOSED_WITH_SAR, label: 'Closed with SAR' },
  ];

  // Function to get display label for status
  const getStatusDisplayLabel = (status: EComplianceTransactionStatus) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  // Early return if modal is not visible or no transaction details
  if (!isVisible || !transactionId) {
    return null;
  }

  // Early return if no transaction data available
  if (!currentTransaction) {
    return null;
  }

  return (
    <>
      <Dialog open={isVisible} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
          <DialogHeader>
            <div className="flex flex-col space-y-3 text-center sm:text-left">
              <div className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200">
                <DialogTitle className="tracking-tight text-xl font-semibold text-gray-900">
                  Case Details
                </DialogTitle>
                <div className="flex items-center gap-3">
                  <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Reassign to..." />
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
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2 text-right">
                        Transaction ID
                      </Label>
                      <a 
                        href={`https://app-staging.blockscout.ai/home/block-explorer/transaction/${currentTransaction.txId}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-gray-900 break-all hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer block text-right"
                      >
                        {currentTransaction.txId}
                      </a>
                    </div>
                    
                    <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2 text-right">
                        Client ID
                      </Label>
                      <p className="text-sm text-gray-900 text-right w-3/5 ml-auto">{currentTransaction.clientId || 'N/A'}</p>
                    </div>
                    
                    <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2 text-right">
                        Blockchain
                      </Label>
                      <div className="flex items-center gap-2 justify-end">
                        <Bitcoin className="w-5 h-5 text-orange-500" />
                        <p className="text-sm text-gray-900 capitalize">{currentTransaction.blockchain}</p>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2 text-right">
                        Timestamp
                      </Label>
                      <p className="text-sm text-gray-900 text-right">
                        {currentTransaction.timestamp ? new Date(currentTransaction.timestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="border-b border-gray-300 dark:border-gray-600 pb-3">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2 text-right">
                        Amount
                      </Label>
                      <p className="text-sm text-gray-900 text-right">
                        {(currentTransaction.amount / 100000000).toFixed(8)} BTC
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2 text-right">
                        USD Value
                      </Label>
                      <p className="text-sm font-semibold text-green-400 text-right">
                        {btcPrice > 0 
                          ? `$${((currentTransaction.amount / 100000000) * btcPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'Loading price...'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status and Navigation Controls */}
              <Card className="bg-gray-50 border-gray-200 w-3/4 ml-auto">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px]">
                      Status:
                    </Label>
                    <Select 
                      value={currentTransaction?.status || selectedStatus} 
                      onValueChange={(value) => {
                        setSelectedStatus(value);
                        // If selecting "Approved with Note", check if notes exist
                        if (value === EComplianceTransactionStatus.CLOSED_WITH_NOTE) {
                          if (!transactionNotes.trim()) {
                            // Force user to add a note
                            alert('Please add a note before approving with note.');
                            return;
                          }
                        }
                        // If selecting "Approved" and notes exist, automatically change to "Approved with Note"
                        if (value === EComplianceTransactionStatus.APPROVED && transactionNotes.trim()) {
                          handleStatusUpdate(EComplianceTransactionStatus.CLOSED_WITH_NOTE);
                        } else {
                          handleStatusUpdate(value);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Navigation Links */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateToBlockExplorer}
                      className="flex items-center gap-2 justify-start"
                    >
                      <Globe className="h-4 w-4" />
                      Block Explorer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateToRiskDashboard}
                      className="flex items-center gap-2 justify-start"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Risk Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateToFlowTrace}
                      className="flex items-center gap-2 justify-start"
                    >
                      <GitBranch className="h-4 w-4" />
                      FlowTrace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateToVASPExplorer}
                      className="flex items-center gap-2 justify-start"
                    >
                      <Database className="h-4 w-4" />
                      VASP Explorer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Risk, Counterparty, and Assignment */}
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
                    <Badge 
                      className={`${getComplianceReportStatusClassName(currentTransaction.status)} flex items-center gap-1`}
                    >
                      <Clock className="h-3 w-3" />
                      {getStatusDisplayLabel(currentTransaction.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Risk Level</span>
                    <span className={`font-semibold ${riskInfo.color}`}>
                      {riskInfo.level}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transaction Risk Score</span>
                    <div className="flex gap-1 items-center w-2/5 justify-end">
                      <span className={`font-semibold ${riskInfo.color}`}>
                        {riskScore}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsRiskModalOpen(true)}
                        className="ml-2 p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Assignment */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-4 w-4" />
                      Current Assignment
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAssignmentHistoryOpen(true)}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      <History className="h-4 w-4" />
                      View History
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-gray-600">Assigned To:</span>
                    <span className="font-semibold text-gray-900 w-2/5 text-right">{currentAssigneeName}</span>
                  </div>
                  {currentTransaction.reviewTimestamp && (
                    <div className="flex items-center gap-2 mt-2 justify-end">
                      <span className="text-gray-600">Assigned On:</span>
                      <span className="text-sm text-gray-900 text-right">
                        {new Date(currentTransaction.reviewTimestamp).toLocaleString()}
                      </span>
                    </div>
                  )}
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
                    {currentTransaction.counterpartyEntities?.map((entityId, index) => {
                      // Get entity name from attributions
                      const entityName = safeAttributions[entityId]?.entity || entityId;
                      
                      // Find SOT data for this entity
                      const getEntitySot = (entityId: string): any => {
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
                      
                      if (!entitySot) {
                        return (
                          <div key={index} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-gray-100 dark:bg-gray-700">
                            <EntityDisplayCard
                              entityId={entityId}
                              onQuickView={(e) => handleQuickView(e, entityId)}
                            />
                          </div>
                        );
                      }
                      
                      return (
                        <div key={index} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-gray-100 dark:bg-gray-700">
                          <EntityDisplayCard
                            entityId={entitySot.entity_id}
                            entityName={entitySot.proper_name}
                            entityType={entitySot.entity_type || 'unknown'}
                            logoUrl={entitySot.logo_url}
                            onQuickView={(e) => handleQuickView(e, entitySot.entity_id)}
                            onViewFull={() => {
                              handleViewFullProfile(entitySot);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Notes */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-4 w-4" />
                    Transaction Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={transactionNotes}
                    onChange={(e) => setTransactionNotes(e.target.value)}
                    placeholder="Add notes about this transaction..."
                    rows={3}
                    className="min-h-[80px]"
                  />
                </CardContent>
              </Card>



              {/* Action Buttons */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={async () => {
                    // Save transaction notes if they exist
                    if (transactionNotes.trim()) {
                      try {
                        await handleSaveNotes();
                      } catch (error) {
                        console.error('Failed to save transaction notes:', error);
                        return; // Don't close if saving notes fails
                      }
                    }
                    
                    // If there's a selected reviewer, save the reassignment
                    if (selectedReviewer && onReassign) {
                      try {
                        await handleReassign();
                      } catch (error) {
                        console.error('Failed to reassign transaction:', error);
                        return; // Don't close if reassignment fails
                      }
                    }
                    
                    // Close the modal
                    onClose();
                  }}
                  className="px-6"
                >
                  Save and Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Risk Modal */}
      {isRiskModalOpen && (
        <TransactionRiskModal
          visible={isRiskModalOpen}
          onClose={() => setIsRiskModalOpen(false)}
          transaction={currentTransaction}
          storedRiskScores={calculatedRiskScore !== undefined ? [calculatedRiskScore] : undefined}
        />
      )}

      {/* Entity Quick View Modal */}
      {isEntityPreviewOpen && selectedEntityForPreview && (
        <Dialog open={isEntityPreviewOpen} onOpenChange={setIsEntityPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>VASP Preview</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <EntityQuickView
                entity={selectedEntityForPreview.entity}
                sot={selectedEntityForPreview.sot}
                onViewFull={handleViewFullProfile}
                onQuickView={() => {}}
                popoverPlacement="right"
                popoverWidth={600}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Case Assignment History Modal */}
      <CaseAssignmentHistoryModal
        isVisible={isAssignmentHistoryOpen}
        onClose={() => setIsAssignmentHistoryOpen(false)}
        transaction={currentTransaction}
      />
    </>
  );
};

export default AssignedTransactionDetailsModal;