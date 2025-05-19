import { Button, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { ETransactionStatus } from '../../../../typings/compliance';
import { useState } from 'react';
import { selectTransactionById, updateTransactionStatus, fetchComplianceTransactions } from '../../../../store/slices/complianceTransactionsSlice';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import ApproveTransactionModal from '../ApproveTransaction.modal';
import { SearchOff } from '@mui/icons-material';


interface TransactionDetailsFooterProps {
  transactionId: string;
  onClose: () => void;
  onHighlightAssignSelector?: () => void;
}
export const TransactionDetailsFooter = ({ transactionId, onClose, onHighlightAssignSelector }: TransactionDetailsFooterProps) => {
  const dispatch = useAppDispatch();
  const transactionDetails = useAppSelector(state => selectTransactionById(state, transactionId));
  const filters = useAppSelector(state => state.complianceTransactions.filters);
  const { page, limit } = useAppSelector(state => state.complianceTransactions);
  const [modalLoading, setModalLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  if (!transactionDetails) return null;

  const handleApproveTransaction = async () => {
    try {
      setModalLoading(true);
      
      // Update transaction status via Redux action
      await dispatch(updateTransactionStatus({ 
        transactionId: transactionDetails._id, 
        status: ETransactionStatus.APPROVED 
      })).unwrap();
      
      // Re-fetch transactions with current filters to update the list
      const mergedFilters = { 
        ...filters,
        page,
        limit,
      };
      dispatch(fetchComplianceTransactions(mergedFilters));
      
      message.success('Transaction approved successfully');
      setShowApproveModal(false);
      onClose();
    } catch (error) {
      console.error('Failed to approve transaction:', error);
      message.error('Failed to approve transaction');
    } finally {
      setModalLoading(false);
    }
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
          icon={<SearchOff />}
          onClick={handleReviewTransaction}
        >
          Review Transaction
        </Button>
      </div>
      <ApproveTransactionModal
        isVisible={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onApprove={handleApproveTransaction}
        loading={modalLoading}
      />
    </>
  );
};
