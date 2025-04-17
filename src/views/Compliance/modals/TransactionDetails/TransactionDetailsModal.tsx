import { FC, useEffect } from 'react';
import { Modal } from 'antd';
import { IComplianceTransaction } from '../../../../typings/compliance';
import TransactionDetailsHeader from './TransactionDetailsHeader';
import LeftPanel, { RightPanel } from './TransactionDetailsPanel';
import { TransactionDetailsFooter } from './TransactionDetailsFooter';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { selectTransactionById, fetchComplianceTransactions } from '../../../../store/slices/complianceTransactionsSlice';
import { useAttribution } from '../../../../context/AttributionContext';
import { currencySymbols } from '../../components/CurrencySelector';

interface TransactionDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  transactionId: string | null;
  openCaseModal: (transaction: IComplianceTransaction) => void;
}

export const TransactionDetailsModal: FC<TransactionDetailsModalProps> = ({
  isVisible,
  onClose,
  transactionId,
  openCaseModal,
}) => {
  const dispatch = useAppDispatch();
  const { attributions } = useAttribution();
  const transactionDetails = useAppSelector(state => 
    transactionId ? selectTransactionById(state, transactionId) : null
  );

  useEffect(() => {
    console.log('transactionDetails', transactionDetails);
  }, [transactionDetails]);

  // Refresh transaction data when modal opens
  useEffect(() => {
    if (isVisible && transactionId) {
      dispatch(fetchComplianceTransactions({}));
    }
  }, [isVisible, transactionId, dispatch]);

  if (!transactionDetails || !transactionId) return null;

  // Entity click handler
  const handleEntityClick = (record: IComplianceTransaction) => {
    // Add your entity click handling logic here
    console.log('Entity clicked:', record);
  };

  return (
    <>
      {/* Main Transaction Details Modal */}
      <Modal
        title={null}
        open={isVisible}
        onCancel={onClose}
        footer={null}
        width={900}
        style={{ top: 40 }}
        className="modern-transaction-modal"
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <TransactionDetailsHeader
            transactionDetails={transactionDetails}
          />

          {/* Content Section */}
          <div style={{ padding: '16px 0px', flexGrow: 1, display: 'flex', gap: '24px' }}>
            <LeftPanel
              transactionDetails={transactionDetails}
              currencySymbols={currencySymbols}
              attributions={attributions}
              onEntityClick={handleEntityClick}
              onClose={onClose}
            />
            <RightPanel transactionId={transactionId} />
          </div>

          <TransactionDetailsFooter
            transactionId={transactionId}
            openCaseModal={openCaseModal}
            onClose={onClose}
          />
        </div>
      </Modal>
    </>
  );
};
