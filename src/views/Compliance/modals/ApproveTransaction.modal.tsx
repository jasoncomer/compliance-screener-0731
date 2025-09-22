import { FC } from 'react';
import { Button, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { colors } from '@/design-system/tokens'

interface ApproveTransactionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApprove: () => void;
  loading?: boolean;
}

export const ApproveTransactionModal: FC<ApproveTransactionModalProps> = ({
  isVisible,
  onClose,
  onApprove,
  loading = false
}) => {
  return (
    <Modal
      title={null}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={450}
      className="modern-transaction-modal"
      centered
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{
          paddingBottom: '16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExclamationCircleOutlined style={{ color: colors.semantic.warning, fontSize: '18px' }} />
            <h3 style={{ margin: 0, fontWeight: 600 }}>Approve Transaction</h3>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 0px', flexGrow: 1 }}>
          <p style={{ margin: 0, lineHeight: '1.5' }}>
            Are you sure you want to approve this transaction?
            <br /><br />
            Approved transactions will no longer appear in the transaction table.
          </p>
        </div>

        {/* Actions */}
        <div style={{
          paddingTop: '24px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <Button
            key="cancel"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            key="approve"
            type="primary"
            loading={loading}
            onClick={onApprove}
            style={{ backgroundColor: colors.semantic.success, borderColor: colors.semantic.success }}
          >
            Confirm Approve
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApproveTransactionModal;
