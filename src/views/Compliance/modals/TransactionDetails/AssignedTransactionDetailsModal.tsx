import React, { useEffect, useMemo, useState } from 'react';

import {
  AlertCircle,
  BarChart3,
  Bitcoin,
  Building2,
  Database,
  FileText,
  GitBranch,
  Globe,
  Hash,
  Shield,
  Upload,
  User,
  X} from "lucide-react";
import { useSelector } from 'react-redux';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TruncatedTransactionLink } from "@/components/ui/truncated-transaction-link";

import { useAttribution } from '../../../../context/AttributionContext';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTransactionById, updateTransactionStatus } from '../../../../store/slices/complianceTransactionsSlice';
import { selectActiveOrgMembersMap } from '../../../../store/slices/organizationsSlice';
import { fetchSOT } from '../../../../store/slices/sotSlice';
import { calculateDetailedRiskAnalysis } from '../../../../services/inputTransactionRiskService';
import { blockchain } from '../../../../api/blockchain';
import { RootState } from '../../../../store/store';
import { EComplianceTransactionStatus, IComplianceTransaction } from '../../../../typings/compliance';
import { getUserDisplayName } from '../../../../utils/display-labels';
import { TransactionRiskModal } from '../../components/modals/TransactionRiskModal';
import CaseAssignmentHistoryModal from '../CaseAssignmentHistoryModal';
import { CaseReportSection } from '../../../../components/CaseReportSection';

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
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isAssignmentHistoryOpen, setIsAssignmentHistoryOpen] = useState(false);
  const [riskData, setRiskData] = useState<any>(null);
  const [riskDataLoading, setRiskDataLoading] = useState(false);
  
  const organizationMembersMap = useAppSelector(selectActiveOrgMembersMap) || {};
  const { itemsMap } = useSelector((state: RootState) => state.sot);
  
  // Fetch SOT data when modal opens
  useEffect(() => {
    if (isVisible && Object.keys(itemsMap).length === 0) {
      console.log('Fetching SOT data for AssignedTransactionDetailsModal');
      dispatch(fetchSOT());
    }
  }, [isVisible, dispatch]); // Removed itemsMap from dependencies to prevent infinite loops

  const transaction = useAppSelector((state) => {
    if (!transactionId) return null;
    try {
      return selectTransactionById(state, transactionId);
    } catch (error) {
      // Handle error silently
      return null;
    }
  });
  
  // Use transactionData if provided, otherwise use transaction from store
  const currentTransaction = transactionData || transaction;

  // Fetch risk data when modal opens
  useEffect(() => {
    const fetchRiskData = async () => {
      if (!isVisible || !currentTransaction?.txId || riskData) return;

      setRiskDataLoading(true);
      try {
        // Fetch transaction details to get input addresses
        const txData = await blockchain.getTransaction(currentTransaction.txId);
        const inputAddresses = txData.inputs
          .map(input => input.addr)
          .filter(Boolean);

        if (inputAddresses.length > 0) {
          // Calculate detailed risk analysis
          const riskAnalysis = await calculateDetailedRiskAnalysis(inputAddresses);
          setRiskData(riskAnalysis);
        }
      } catch (error) {
        console.error('Error fetching risk data:', error);
      } finally {
        setRiskDataLoading(false);
      }
    };

    fetchRiskData();
  }, [isVisible, currentTransaction?.txId]); // Removed riskData from dependencies to prevent infinite loops
  
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
    // Clear attached images and revoke URLs
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setAttachedImages([]);
    setImagePreviewUrls([]);
  }, [transactionId]);

  // Cleanup image URLs on unmount
  React.useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  // Get risk level and color

  const riskScore = calculatedRiskScore !== undefined ? calculatedRiskScore : (currentTransaction?.riskScores?.[0] || 0);

  // Handle reassignment
  const handleReassign = async () => {
    if (!selectedReviewer || !onReassign) return;
    
    try {
      await onReassign(selectedReviewer);
      setSelectedReviewer('');
    } catch (error) {
      // Handle reassignment error
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!currentTransaction || !transactionId) return;
    
    try {
      // Automatically apply CLOSED_WITH_NOTE if user selects APPROVED and notes exist
      let finalStatus = newStatus;
      if (newStatus === EComplianceTransactionStatus.APPROVED && transactionNotes.trim()) {
        finalStatus = EComplianceTransactionStatus.CLOSED_WITH_NOTE;
      }
      
      await dispatch(updateTransactionStatus({
        transactionId,
        status: finalStatus
      })).unwrap();
    } catch (error) {
      // Handle status update error
    }
  };

  // Handle saving transaction notes
  const handleSaveNotes = async () => {
    if (!currentTransaction || !transactionId) return;
    
    try {
      // Save transaction notes via API
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      // Handle save notes error
      throw error;
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    // Limit to 5 images max
    const newImages = [...attachedImages, ...imageFiles].slice(0, 5);
    setAttachedImages(newImages);
    
    // Create preview URLs
    const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls].slice(0, 5));
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    const newImages = attachedImages.filter((_, i) => i !== index);
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setAttachedImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };


  // Handle VASP preview


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
    window.open('/home/vasp-explorer', '_blank');
  };

  // Status options (CLOSED_WITH_NOTE is automatic when notes exist)
  const statusOptions = [
    { value: EComplianceTransactionStatus.UNASSIGNED, label: 'Unassigned' },
    { value: EComplianceTransactionStatus.UNREVIEWED, label: 'Unreviewed' },
    { value: EComplianceTransactionStatus.IN_REVIEW, label: 'In Review' },
    { value: EComplianceTransactionStatus.APPROVED, label: 'Approved' },
    { value: EComplianceTransactionStatus.HOLD, label: 'Hold' },
    { value: EComplianceTransactionStatus.CLOSED_WITH_SAR, label: 'Closed with SAR' },
  ];


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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
          <DialogHeader>
            <div className="flex flex-col space-y-3 text-center sm:text-left">
              <div className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                <DialogTitle className="tracking-tight text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Transaction Details
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
                      <TruncatedTransactionLink txId={currentTransaction.txId} />
                          </div>
                    </div>
                    
                        <div>
                          <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                        Client ID
                      </Label>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentTransaction.clientId || 'N/A'}</p>
                    </div>
                    
                        <div>
                          <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                        Blockchain
                      </Label>
                      <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                              <Bitcoin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{currentTransaction.blockchain}</p>
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
                        {currentTransaction.timestamp ? new Date(currentTransaction.timestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    
                        <div>
                          <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                        Amount
                      </Label>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {(currentTransaction.amount / 100000000).toFixed(8)} BTC
                      </p>
                    </div>
                    
                        <div>
                          <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                        USD Value
                      </Label>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {btcPrice > 0 
                          ? `$${((currentTransaction.amount / 100000000) * btcPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'Loading price...'
                        }
                      </p>
                    </div>
                  </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Section */}
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
                    {/* Status Management */}
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                        Update Status to:
                    </Label>
                    <Select 
                      value={currentTransaction?.status || selectedStatus} 
                      onValueChange={(value) => {
                        setSelectedStatus(value);
                        handleStatusUpdate(value);
                      }}
                    >
                        <SelectTrigger className="w-48 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
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

                    {/* Navigation Actions */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                        Navigation Tools
                      </Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button
                      variant="outline"
                      onClick={navigateToBlockExplorer}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium">Block Explorer</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={navigateToRiskDashboard}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium">Risk Dashboard</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={navigateToFlowTrace}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                          <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium">FlowTrace</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={navigateToVASPExplorer}
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
                        {riskScore}<span className="text-base font-normal">/100</span>
                  </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${riskScore}%` }}
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

                {/* Risk Factors Tabs */}
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
                        {riskDataLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Loading entity risk factors...</div>
                          </div>
                        ) : riskData?.entityRisk?.factors?.length > 0 ? (
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
                                {riskData.entityRisk.factors.map((factor: any, index: number) => {
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
                                          <User className="h-4 w-4 text-gray-400" />
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
                          <div className="flex items-center justify-center py-8">
                            <div className="text-sm text-gray-500 dark:text-gray-400">No entity risk factors available</div>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="jurisdiction-risk" className="mt-4">
                        {riskDataLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Loading jurisdiction risk factors...</div>
                          </div>
                        ) : riskData?.jurisdictionRisk?.factors?.length > 0 ? (
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
                                {riskData.jurisdictionRisk.factors.map((factor: any, index: number) => {
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
                          <div className="flex items-center justify-center py-8">
                            <div className="text-sm text-gray-500 dark:text-gray-400">No jurisdiction risk factors available</div>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="transaction-risk" className="mt-4">
                        {riskDataLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Loading transaction risk factors...</div>
                          </div>
                        ) : riskData?.transactionRisk?.factors?.length > 0 ? (
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
                                {riskData.transactionRisk.factors.map((factor: any, index: number) => {
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
                          <div className="flex items-center justify-center py-8">
                            <div className="text-sm text-gray-500 dark:text-gray-400">No transaction risk factors available</div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

              </div>

              {/* Quick Actions Section */}
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
                    {/* Status Management */}
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                        Update Status to:
                      </Label>
                      <Select 
                        value={currentTransaction?.status || selectedStatus} 
                        onValueChange={(value) => {
                          setSelectedStatus(value);
                          handleStatusUpdate(value);
                        }}
                      >
                        <SelectTrigger className="w-48 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
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

                    {/* Navigation Actions */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                        Navigation Tools
                      </Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button
                          variant="outline"
                          onClick={navigateToBlockExplorer}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium">Block Explorer</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={navigateToRiskDashboard}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium">Risk Dashboard</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={navigateToFlowTrace}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium">FlowTrace</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={navigateToVASPExplorer}
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

                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-4">
                    {!currentTransaction.counterpartyEntities || currentTransaction.counterpartyEntities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No counterparty information available</p>
                      </div>
                    ) : (
                      currentTransaction.counterpartyEntities.map((entityId, index) => {
                      const entityName = safeAttributions[entityId]?.entity || entityId;
                      
                      const getEntitySot = (searchId: string): any => {
                        if (!itemsMap || Object.keys(itemsMap).length === 0) {
                          console.log('No itemsMap available');
                          return null;
                        }
                        
                        // First try direct lookup by entity_id
                        if (itemsMap[searchId]) {
                          console.log('Found entity by direct lookup:', searchId);
                          return itemsMap[searchId];
                        }
                        
                        // Try to find by entity_id in the SOT records
                        const foundByEntityId = Object.values(itemsMap).find(sot => 
                          sot.entity_id === searchId
                        );
                        if (foundByEntityId) {
                          console.log('Found entity by entity_id search:', searchId);
                          return foundByEntityId;
                        }
                        
                        // Try to find by proper_name
                        const foundByName = Object.values(itemsMap).find(sot => 
                          sot.proper_name?.toLowerCase() === searchId.toLowerCase()
                        );
                        if (foundByName) {
                          console.log('Found entity by name search:', searchId);
                          return foundByName;
                        }
                        
                        console.log('Entity not found:', searchId, 'Available entities:', Object.keys(itemsMap));
                        return null;
                      };
                      
                      // Try both the original entityId and the entityName
                      const entitySot = getEntitySot(entityId) || getEntitySot(entityName);
                      
                      if (!entitySot) {
                        return (
                          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                    {entityName}
                                  </h4>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Entity ID: {entityId}
                                  </div>
                                </div>
                              </div>
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                  <div>
                                    <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                      Limited Information Available
                                    </h5>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                      Basic entity information is available, but detailed SOT (Source of Truth) data is not loaded for this entity.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50">
                          <div className="space-y-6">
                            {/* OFAC Sanction Warning */}
                            {entitySot.ofac && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                                      SANCTIONED ENTITY
                                    </h3>
                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                      This entity is listed on OFAC sanctions lists. Exercise extreme caution when conducting business.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Header with Logo and Basic Info */}
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <img 
                                  src={entitySot.logo_url || `https://storage.googleapis.com/entity-logos/${entitySot.entity_id}.jpg`}
                                  alt={`${entitySot.proper_name} logo`}
                                  className="w-14 h-14 rounded-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                {entitySot.ofac && (
                                  <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 capitalize">{entitySot.proper_name}</h4>
                                  {entitySot.ofac && (
                                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-semibold">
                                      SANCTIONED
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{entitySot.entity_type || 'Unknown'}</div>
                              </div>
                            </div>
                            
                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Left Column */}
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                    Entity ID
                                  </Label>
                                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">{entitySot.entity_id}</span>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                    Description
                                  </Label>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {entitySot.description_merged || 'No description available'}
                                  </p>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                    Contact Information
                                  </Label>
                                  <div className="space-y-2">
                                    {entitySot.contact_email && (
                                      <div className="text-sm">
                                        <strong>Email:</strong> {entitySot.contact_email}
                                      </div>
                                    )}
                                    {entitySot.contact_address && (
                                      <div className="text-sm">
                                        <strong>Address:</strong> {entitySot.contact_address}
                                      </div>
                                    )}
                                    {entitySot.contact_phone && (
                                      <div className="text-sm">
                                        <strong>Phone:</strong> {entitySot.contact_phone}
                                      </div>
                                    )}
                                    {entitySot.legal_info_url && (
                                      <div className="text-sm">
                                        <strong>Legal Info:</strong> 
                                        <a 
                                          href={`https://${entitySot.legal_info_url}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                                        >
                                          <Globe className="h-3 w-3 inline mr-1" />
                                          View Legal Information
                                        </a>
                                      </div>
                                    )}
                                    {!entitySot.contact_email && !entitySot.contact_address && !entitySot.contact_phone && !entitySot.legal_info_url && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">No contact information available</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right Column */}
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                    Websites
                                  </Label>
                                  <div className="space-y-2">
                                    {entitySot.url && (
                                      <a 
                                        href={`https://${entitySot.url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                      >
                                        <Globe className="h-3 w-3" />
                                        {entitySot.url}
                                      </a>
                                    )}
                                    {!entitySot.url && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">No websites available</div>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                    Social Media Profiles
                                  </Label>
                                  <div className="space-y-2">
                                    {entitySot.contact_twitter && (
                                      <a 
                                        href={`https://twitter.com/${entitySot.contact_twitter.replace('@', '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                                      >
                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                        </svg>
                                        {entitySot.contact_twitter}
                                      </a>
                                    )}
                                    {entitySot.social_media_profile && (
                                      <a 
                                        href={`https://${entitySot.social_media_profile}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                                      >
                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                        {entitySot.social_media_profile}
                                      </a>
                                    )}
                                    {!entitySot.contact_twitter && !entitySot.social_media_profile && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">No social media profiles available</div>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                    Additional Information
                                  </Label>
                                  <div className="space-y-2">
                                    {entitySot.year_founded && (
                                      <div className="text-sm">
                                        <strong>Founded:</strong> {entitySot.year_founded}
                                      </div>
                                    )}
                                    {(entitySot.associate_country_1 || entitySot.associate_country_2 || entitySot.associate_country_3) && (
                                      <div className="text-sm">
                                        <strong>Associated Countries:</strong>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {[entitySot.associate_country_1, entitySot.associate_country_2, entitySot.associate_country_3, entitySot.associate_country_4, entitySot.associate_country_5, entitySot.associate_country_6]
                                            .filter(country => country && country.trim())
                                            .map((country: string, countryIndex: number) => (
                                            <Badge key={countryIndex} className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs">
                                              {country}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {!entitySot.year_founded && !entitySot.associate_country_1 && !entitySot.associate_country_2 && !entitySot.associate_country_3 && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">No additional information available</div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Balances Table */}
                                {entitySot.balances && entitySot.balances.length > 0 && (
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                                      {entitySot.proper_name} Balances:
                                    </Label>
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                      <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                          <tr>
                                            <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-3 py-2">Chain</th>
                                            <th className="text-left font-medium text-gray-500 dark:text-gray-400 px-3 py-2">BTC Balance</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {entitySot.balances.map((balance: any, balanceIndex: number) => (
                                            <tr key={balanceIndex} className="border-t border-gray-200 dark:border-gray-600">
                                              <td className="px-3 py-2">
                                                <img 
                                                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" 
                                                  alt="BTC" 
                                                  className="h-6 w-6"
                                                />
                                              </td>
                                              <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{balance.amount} BTC</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions Section */}
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
                    {/* Status Management */}
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                        Update Status to:
                      </Label>
                      <Select 
                        value={currentTransaction?.status || selectedStatus} 
                        onValueChange={(value) => {
                          setSelectedStatus(value);
                          handleStatusUpdate(value);
                        }}
                      >
                        <SelectTrigger className="w-48 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
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

                    {/* Navigation Actions */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                        Navigation Tools
                      </Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Button
                          variant="outline"
                          onClick={navigateToBlockExplorer}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium">Block Explorer</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={navigateToRiskDashboard}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium">Risk Dashboard</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={navigateToFlowTrace}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium">FlowTrace</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={navigateToVASPExplorer}
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
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              {/* Notes Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes & Comments</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add notes and track transaction history</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="transaction-notes" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                        Add a note:
                      </Label>
                  <Textarea
                        id="transaction-notes"
                    value={transactionNotes}
                    onChange={(e) => setTransactionNotes(e.target.value)}
                    placeholder="Add notes about this transaction..."
                        rows={4}
                        className="min-h-[120px] resize-none bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600"
                      />
                    </div>

                    {/* Image Upload Section */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                        Attach Screenshots or Images:
                      </Label>
                      
                      {/* File Input */}
                      <div className="mb-4">
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="image-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <Upload className="h-4 w-4" />
                          Choose Images
                        </label>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          (Max 5 images, PNG, JPG, GIF)
                        </span>
                      </div>

                      {/* Image Previews */}
                      {imagePreviewUrls.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          {imagePreviewUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                              />
                              <button
                                onClick={() => handleRemoveImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {attachedImages[index]?.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveNotes}
                        disabled={!transactionNotes.trim() && attachedImages.length === 0}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-6"
                      >
                        Save Note {attachedImages.length > 0 && `(${attachedImages.length} image${attachedImages.length > 1 ? 's' : ''})`}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Section */}
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
                    {/* Status Management */}
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                        Update Status to:
                      </Label>
                      <Select 
                        value={currentTransaction?.status || selectedStatus} 
                        onValueChange={(value) => {
                          setSelectedStatus(value);
                          handleStatusUpdate(value);
                        }}
                      >
                        <SelectTrigger className="w-48 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
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

                    {/* Navigation Actions */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                        Navigation Tools
                      </Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Button
                          variant="outline"
                          onClick={navigateToBlockExplorer}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium">Block Explorer</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={navigateToRiskDashboard}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium">Risk Dashboard</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={navigateToFlowTrace}
                          className="h-12 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium">FlowTrace</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={navigateToVASPExplorer}
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

            </TabsContent>

            <TabsContent value="case-report" className="space-y-6">
              {/* Case Report Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Case Report</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Generate and manage compliance case reports</p>
                  </div>
                </div>

                <CaseReportSection
                  caseId={currentTransaction?._id || 'default-case-id'}
                  transactionId={currentTransaction?.txId || transactionId || 'default-tx-id'}
                  organizationId={currentTransaction?.organizationId || 'default-org-id'}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Apple-style Save/Close buttons - visible on all tabs */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Close
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  if (transactionNotes.trim()) {
                    try {
                      await handleSaveNotes();
                    } catch (error) {
                      console.error('Error saving notes:', error);
                    }
                  }
                  
                  if (selectedReviewer && onReassign) {
                    try {
                      await handleReassign();
                    } catch (error) {
                      console.error('Error reassigning:', error);
                    }
                  }
                }}
                className="px-6"
              >
                Save
              </Button>
              <Button
                onClick={async () => {
                  if (transactionNotes.trim()) {
                    try {
                      await handleSaveNotes();
                    } catch (error) {
                      return;
                    }
                  }
                  
                  if (selectedReviewer && onReassign) {
                    try {
                      await handleReassign();
                    } catch (error) {
                      return;
                    }
                  }
                  
                  onClose();
                }}
                className="px-6"
              >
                Save and Close
              </Button>
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