import { Button, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { ETransactionStatus, IComplianceTransaction } from '../../../../typings/compliance';
import { useState } from 'react';
import { selectTransactionById, updateTransactionStatus } from '../../../../store/slices/complianceTransactionsSlice';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import ApproveTransactionModal from '../ApproveTransaction.modal';
import { SearchOff } from '@mui/icons-material';


interface TransactionDetailsFooterProps {
  transactionId: string;
  openCaseModal: (transaction: IComplianceTransaction) => void;
  onClose: () => void;
}
export const TransactionDetailsFooter = ({ transactionId, openCaseModal, onClose }: TransactionDetailsFooterProps) => {
  const dispatch = useAppDispatch();
  const transactionDetails = useAppSelector(state => selectTransactionById(state, transactionId));
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
          onClick={() => {
            if (transactionDetails) {
              openCaseModal(transactionDetails);
              onClose();
            }
          }}
        >
          Flag Transaction
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
