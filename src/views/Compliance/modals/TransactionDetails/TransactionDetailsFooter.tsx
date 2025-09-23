import { useState } from 'react';

import { CheckOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';

import { useUpdateTransactionStatus } from '../../../../hooks/useComplianceTransactions';
import { useAppSelector } from '../../../../store/hooks';
import { selectTransactionById } from '../../../../store/slices/complianceTransactionsSlice';
import { EComplianceTransactionStatus } from '../../../../typings/compliance';
import ApproveTransactionModal from '../ApproveTransaction.modal';


interface TransactionDetailsFooterProps {
  transactionId: string;
  onClose: () => void;
  onHighlightAssignSelector?: () => void;
}
export const TransactionDetailsFooter = ({ transactionId, onClose, onHighlightAssignSelector }: TransactionDetailsFooterProps) => {
  const transactionDetails = useAppSelector(state => selectTransactionById(state, transactionId));
  const [showApproveModal, setShowApproveModal] = useState(false);
  
  // React Query mutation
  const updateStatusMutation = useUpdateTransactionStatus();

  if (!transactionDetails) return null;

  const handleApproveTransaction = async () => {
    updateStatusMutation.mutate(
      {
        transactionId: transactionDetails._id,
        status: EComplianceTransactionStatus.APPROVED
      },
      {
        onSuccess: () => {
          message.success('Transaction approved successfully');
          setShowApproveModal(false);
          onClose();
        },
        onError: (error) => {
          console.error('Failed to approve transaction:', error);
          message.error('Failed to approve transaction');
        }
      }
    );
  };

  const handleReviewTransaction = () => {
    // Check if transaction has an assignee
    if (!transactionDetails.reviewerId) {
      message.warning('Please assign this transaction to a team member before reviewing');
      // Highlight the assignment dropdown in the header
      if (onHighlightAssignSelector) {
        onHighlightAssignSelector();
      }
      return;
    }
    
    // Proceed with review logic if transaction is assigned
    console.log('Reviewing transaction', transactionDetails);
    onClose();
  };

  return (
    <>
      <div style={{
        paddingTop: '2em',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
      }}>
        <Button key="approve"
          size="middle"
          icon={<CheckOutlined />}
          onClick={() => setShowApproveModal(true)}
        >
          Approve
        </Button>
        <Button
          key="case"
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleReviewTransaction}
        >
          Review Transaction
        </Button>
      </div>
      <ApproveTransactionModal
        isVisible={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onApprove={handleApproveTransaction}
        loading={updateStatusMutation.isPending}
      />
    </>
  );
};
