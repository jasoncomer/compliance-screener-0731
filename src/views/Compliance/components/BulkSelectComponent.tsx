import React, { useState } from 'react';

import { Checkbox } from '../../../components/ui/checkbox';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useBulkUpdateTransactionAssignee, useBulkUpdateTransactionStatus } from '../../../hooks/useComplianceTransactions';
import { useAppSelector } from '../../../store/hooks';
import { selectActiveOrgMembers } from '../../../store/slices/organizationsSlice';
import { EMemberStatus } from '../../../typings/organization';
import { EComplianceTransactionStatus } from '../../../typings/compliance';
import { getUserDisplayName } from '../../../utils/display-labels';

interface BulkSelectComponentProps {
  selectedRowKeys: React.Key[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  totalItems: number;
  onBulkActionComplete?: () => void;
}

const BulkSelectComponent: React.FC<BulkSelectComponentProps> = ({
  selectedRowKeys,
  onClearSelection,
  onSelectAll,
  totalItems,
  onBulkActionComplete
}) => {
  console.log('🚀🚀🚀 BULK SELECT COMPONENT RENDERED 🚀🚀🚀');
  console.log('🔍 BulkSelectComponent - Component rendered with props:', {
    selectedRowKeysLength: selectedRowKeys.length,
    totalItems,
    onBulkActionCompleteType: typeof onBulkActionComplete
  });
  console.log('🔍 BulkSelectComponent - onBulkActionComplete callback:', typeof onBulkActionComplete);
  const organizationMembers = useAppSelector(selectActiveOrgMembers);
  const bulkUpdateMutation = useBulkUpdateTransactionAssignee();
  const bulkStatusUpdateMutation = useBulkUpdateTransactionStatus();
  
  const [assignModalVisible, setAssignModalVisible] = useState<boolean>(false);
  const [approveModalVisible, setApproveModalVisible] = useState<boolean>(false);
  const [selectedReviewer, setSelectedReviewer] = useState<string | null>(null);

  const isAllSelected = selectedRowKeys.length === totalItems;
  const isIndeterminate = selectedRowKeys.length > 0 && selectedRowKeys.length < totalItems;
  
  console.log('BulkSelectComponent props:', {
    selectedRowKeysLength: selectedRowKeys.length,
    totalItems,
    isAllSelected,
    isIndeterminate
  });

  const openBulkAssignModal = () => {
    console.log('🚀 openBulkAssignModal called with selectedRowKeys:', selectedRowKeys);
    if (selectedRowKeys.length === 0) {
      console.log('🚨 No rows selected, returning early');
      return;
    }
    console.log('🚀 Opening assign modal');
    setAssignModalVisible(true);
  };

  const closeBulkAssignModal = () => {
    setAssignModalVisible(false);
    setSelectedReviewer(null);
  };

  const openBulkApproveModal = () => {
    console.log('🚀 OPEN BULK APPROVE MODAL - Called with selectedRowKeys:', selectedRowKeys);
    if (selectedRowKeys.length === 0) {
      console.log('No rows selected, returning early');
      return;
    }
    console.log('🚀 Opening approve modal');
    setApproveModalVisible(true);
  };

  const closeBulkApproveModal = () => {
    setApproveModalVisible(false);
  };

  const handleBulkAssign = async () => {
    if (!selectedReviewer) {
      console.log('🚨 BulkAssign - No reviewer selected');
      return;
    }

    const transactionIds = selectedRowKeys.map(key => String(key));
    console.log('🚀 BulkAssign - Starting bulk assign with:', {
      transactionIds,
      assignee: selectedReviewer
    });
    
    bulkUpdateMutation.mutate(
      {
        transactionIds,
        assignee: selectedReviewer
      },
      {
        onSuccess: (response) => {
          console.log('🚀 BulkAssign - SUCCESS! Response:', response);
          console.log('🔍 BulkSelectComponent - Bulk assign success, calling onBulkActionComplete');
          onClearSelection();
          closeBulkAssignModal();
          
          if (onBulkActionComplete) {
            console.log('🔍 BulkSelectComponent - Calling onBulkActionComplete callback (assign)');
            try {
              onBulkActionComplete();
              console.log('🔍 BulkSelectComponent - onBulkActionComplete callback executed successfully (assign)');
            } catch (error) {
              console.error('🔍 BulkSelectComponent - Error calling onBulkActionComplete (assign):', error);
            }
          } else {
            console.log('🔍 BulkSelectComponent - onBulkActionComplete is not defined (assign)');
          }
        },
        onError: (error) => {
          console.error('🚨 BulkAssign - ERROR:', error);
          if (onBulkActionComplete) {
            onBulkActionComplete();
          }
        }
      }
    );
  };

  const handleBulkApprove = async () => {
    console.log('handleBulkApprove called with selectedRowKeys:', selectedRowKeys);
    const transactionIds = selectedRowKeys.map(key => String(key));
    console.log('Mapped transactionIds:', transactionIds);
    
    bulkStatusUpdateMutation.mutate(
      {
        transactionIds,
        status: EComplianceTransactionStatus.APPROVED
      },
      {
        onSuccess: () => {
          console.log('🚀 BULK APPROVE SUCCESS - Transaction approved!');
          console.log('🔍 BulkSelectComponent - Bulk approve success, calling onBulkActionComplete');
          onClearSelection();
          closeBulkApproveModal();
          
          if (onBulkActionComplete) {
            console.log('🔍 BulkSelectComponent - Calling onBulkActionComplete callback');
            try {
              onBulkActionComplete();
              console.log('🔍 BulkSelectComponent - onBulkActionComplete callback executed successfully');
            } catch (error) {
              console.error('🔍 BulkSelectComponent - Error calling onBulkActionComplete:', error);
            }
          } else {
            console.log('🔍 BulkSelectComponent - onBulkActionComplete is not defined');
          }
        },
        onError: (error) => {
          console.error('Error approving transactions:', error);
          if (onBulkActionComplete) {
            onBulkActionComplete();
          }
        }
      }
    );
  };

  return (
    <>
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectAll();
              } else {
                onClearSelection();
              }
            }}
          />
          <span className="text-sm font-medium">
            {selectedRowKeys.length === 0 
              ? 'Select all items' 
              : `${selectedRowKeys.length} of ${totalItems || 0} selected`
            }
          </span>
        </div>
        
        {selectedRowKeys.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openBulkAssignModal}
              disabled={bulkUpdateMutation.isPending}
            >
              Assign ({selectedRowKeys.length})
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                console.log('🚀 APPROVE BUTTON CLICKED - Opening modal');
                openBulkApproveModal();
              }}
              disabled={bulkStatusUpdateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve ({selectedRowKeys.length})
            </Button>
            <button
              onClick={onClearSelection}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <Dialog open={assignModalVisible} onOpenChange={setAssignModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Transactions</DialogTitle>
            <DialogDescription>
              Select a team member to assign {selectedRowKeys.length} transaction(s) for review.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <Select
              value={selectedReviewer || ''}
              onValueChange={(value) => setSelectedReviewer(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reviewer" />
              </SelectTrigger>
              <SelectContent>
                {(organizationMembers || [])
                  .filter(member => member.userId)
                  .map(member => {
                    const isDisabled = member.status === EMemberStatus.PENDING;
                    return (
                      <SelectItem
                        key={member.userId}
                        value={member.userId!}
                        disabled={isDisabled}
                      >
                        {getUserDisplayName(member)}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeBulkAssignModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAssign}
              disabled={!selectedReviewer || bulkUpdateMutation.isPending}
            >
              {bulkUpdateMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={approveModalVisible} onOpenChange={setApproveModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Transactions</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedRowKeys.length} transaction(s)?
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <p className="text-sm text-muted-foreground">
              This action will mark the selected transactions as approved and assign them to you for record keeping.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeBulkApproveModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkApprove}
              disabled={bulkStatusUpdateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {bulkStatusUpdateMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkSelectComponent;