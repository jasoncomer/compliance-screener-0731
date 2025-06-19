import { FC, useRef } from 'react';
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

export const TransactionDetailsModal: FC<TransactionDetailsModalProps> = ({
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
  
  const transactionDetails = transactionData || transactionFromStore;

  console.log('TransactionDetailsModal render:', { 
    isVisible, 
    transactionId, 
    transactionData: !!transactionData,
    transactionFromStore: !!transactionFromStore,
    transactionDetails: !!transactionDetails
  });

  if (!transactionDetails || !transactionId) {
    console.log('Modal returning null because:', { 
      hasTransactionData: !!transactionData,
      hasTransactionFromStore: !!transactionFromStore,
      hasTransactionDetails: !!transactionDetails, 
      hasTransactionId: !!transactionId 
    });
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
};
