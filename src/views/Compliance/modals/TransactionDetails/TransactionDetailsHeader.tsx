import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Select, message } from 'antd';
import { InfoCircleOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import { ETransactionStatus } from '../../../../typings/compliance';
import { IComplianceTransaction } from '../../../../typings/compliance';
import { selectActiveOrgMembers } from '../../../../store/slices/organizationsSlice';
import { useAppSelector } from '../../../../store/hooks';
import { EMemberStatus, IOrganizationMember } from '../../../../typings/organization';
import { getUserDisplayName } from '../../../../utils/display-labels';
import { useUpdateTransactionAssignee, useUpdateTransactionStatus } from '../../../../hooks/useComplianceTransactions';

// CSS styles
const highlightStyles = `
.highlight-selector {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
  animation: pulse 1.5s infinite !important;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(24, 144, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
  }
}`;

interface TransactionDetailsHeaderProps {
  transactionDetails: IComplianceTransaction;
  modalOpen?: boolean; // New prop to track modal state
}

const TransactionDetailsHeader = forwardRef<{ highlightAssignSelector: () => void }, TransactionDetailsHeaderProps>(({
  transactionDetails,
  modalOpen = true,
}, ref) => {
  const organizationMembers = useAppSelector(selectActiveOrgMembers);
  const selectRef = useRef<any>(null);
  
  // React Query mutations
  const updateAssigneeMutation = useUpdateTransactionAssignee();
  const updateStatusMutation = useUpdateTransactionStatus();

  // Initialize selectedUserId with the reviewerId from the transaction details
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    transactionDetails?.reviewerId || null
  );
  const [assigningUser, setAssigningUser] = useState(false);
  
  // Update selectedUserId when transactionDetails changes
  useEffect(() => {
    if (transactionDetails?.reviewerId) {
      setSelectedUserId(transactionDetails.reviewerId);
    } else {
      setSelectedUserId(null);
    }
  }, [transactionDetails]);
  
  // Reset selectedUserId when modal is closed
  useEffect(() => {
    if (!modalOpen) {
      setSelectedUserId(null);
    }
  }, [modalOpen]);
  
  // Add styles to the document on mount
  useEffect(() => {
    // Add the styles to the document once
    const styleElement = document.createElement('style');
    styleElement.innerHTML = highlightStyles;
    document.head.appendChild(styleElement);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Expose the highlightAssignSelector function to parent components
  useImperativeHandle(ref, () => ({
    highlightAssignSelector: () => {
      if (selectRef.current) {
        selectRef.current.focus();
        // Add a temporary highlight effect
        const selectElement = selectRef.current.selectRef;
        if (selectElement) {
          selectElement.classList.add('highlight-selector');
          setTimeout(() => {
            selectElement.classList.remove('highlight-selector');
          }, 2000);
        }
      }
    }
  }));
  
  if (!transactionDetails || !organizationMembers) return null;

  const handleAssignTransaction = async (userId: any) => {
    setAssigningUser(true);
    
    // First update the assignee
    updateAssigneeMutation.mutate(
      {
        transactionId: transactionDetails._id,
        assignee: userId
      },
      {
        onSuccess: () => {
          // Then update status to IN_REVIEW
          updateStatusMutation.mutate(
            {
              transactionId: transactionDetails._id,
              status: ETransactionStatus.IN_REVIEW
            },
            {
              onSuccess: () => {
                message.success('Transaction assigned successfully');
                setSelectedUserId(userId);
                setAssigningUser(false);
              },
              onError: (error) => {
                console.error('Failed to update transaction status:', error);
                message.error('Failed to update transaction status');
                setAssigningUser(false);
              }
            }
          );
        },
        onError: (error) => {
          console.error('Failed to assign transaction:', error);
          message.error('Failed to assign transaction');
          setAssigningUser(false);
        }
      }
    );
  };

  return (
    <>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 'auto 5px' }}>Transaction Details</h2>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <Select
            ref={selectRef}
            style={{ width: 230 }}
            size="middle"
            placeholder="Assign to..."
            value={selectedUserId}
            loading={assigningUser || updateAssigneeMutation.isPending || updateStatusMutation.isPending}
            disabled={assigningUser || updateAssigneeMutation.isPending || updateStatusMutation.isPending}
            dropdownRender={(menu) => (
              <div>
                <div style={{ padding: '8px 8px 0' }}>
                  <span style={{ fontWeight: 500 }}>Team Members</span>
                </div>
                {menu}
                <div style={{
                  padding: '4px 8px 8px',
                  color: '#8c8c8c',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <InfoCircleOutlined />
                  Status changes to 'Assigned'
                </div>
              </div>
            )}
            onSelect={handleAssignTransaction}
            suffixIcon={assigningUser ? <LoadingOutlined /> : <UserOutlined />}
          >
            {organizationMembers.map(member => {
              const isDisabled = member.status === EMemberStatus.REMOVED || member.status === EMemberStatus.PENDING;
              return (
                <Select.Option key={member.userId} value={member.userId} disabled={isDisabled} className="capitalize">
                  {getUserDisplayName(member as IOrganizationMember)}
                </Select.Option>
              )
            })}
          </Select>
        </div>
      </div>
    </>
  );
});

export default TransactionDetailsHeader;
