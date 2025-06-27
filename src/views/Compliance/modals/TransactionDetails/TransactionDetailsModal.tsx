import React, { FC, useRef, useMemo } from 'react';
import { Modal } from 'antd';
import { IComplianceTransaction } from '../../../../typings/compliance';
import TransactionDetailsHeader from './TransactionDetailsHeader';
import LeftPanel, { RightPanel } from './TransactionDetailsPanel';
import { TransactionDetailsFooter } from './TransactionDetailsFooter';
import { useAppSelector } from '../../../../store/hooks';
import { selectTransactionById } from '../../../../store/slices/complianceTransactionsSlice';
import { useAttribution } from '../../../../context/AttributionContext';
import { currencySymbols } from '../../components/CurrencySelector';

interface TransactionDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  transactionId: string | null;
  transactionData?: IComplianceTransaction | null;
}

export const TransactionDetailsModal: FC<TransactionDetailsModalProps> = React.memo(({
  isVisible,
  onClose,
  transactionId,
  transactionData,
}) => {
  const { attributions } = useAttribution();
  const headerRef = useRef<{ highlightAssignSelector: () => void }>(null);
  
  // Try to get transaction from props first, then fall back to Redux store
  const transactionFromStore = useAppSelector(state => 
    transactionId ? selectTransactionById(state, transactionId) : null
  );
  
  // Memoize transaction details to prevent unnecessary re-renders
  const transactionDetails = useMemo(() => {
    return transactionData || transactionFromStore;
  }, [transactionData, transactionFromStore]);

  // Early return if modal is not visible or no transaction details
  if (!isVisible || !transactionDetails || !transactionId) {
    return null;
  }

  // Entity click handler
  const handleEntityClick = (record: IComplianceTransaction) => {
    // Add your entity click handling logic here
    console.log('Entity clicked:', record);
  };

  // Handler to highlight the assignee selector
  const handleHighlightAssignSelector = () => {
    if (headerRef.current) {
      headerRef.current.highlightAssignSelector();
    }
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
            ref={headerRef}
            transactionDetails={transactionDetails}
            modalOpen={isVisible}
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
            onClose={onClose}
            onHighlightAssignSelector={handleHighlightAssignSelector}
          />
        </div>
      </Modal>
    </>
  );
});
