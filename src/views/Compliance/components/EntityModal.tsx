import React from 'react';
import { Modal } from 'antd';
import { useTheme } from '../../../context/ThemeContext';
import { colors } from '../../../styles/variables';
import { TransactionRecord } from '../../../typings/compliance';

interface EntityModalProps {
  visible: boolean;
  onClose: () => void;
  entity: TransactionRecord | null;
}

const EntityModal: React.FC<EntityModalProps> = ({ visible, onClose, entity }) => {
  const { theme } = useTheme();

  return (
    <Modal
      title={`Entity Explorer: ${entity ? entity.counterpartyEntity : ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      {entity ? (
        <div style={{ color: theme === 'light' ? colors.black : colors.white }}>
          <h2>{entity.counterpartyEntity}</h2>
          <p><strong>Address:</strong> {entity.counterpartyAddress}</p>
          <p><strong>Blockchain:</strong> {entity.blockchain}</p>
          <p><strong>Risk Score:</strong> {entity.riskScore}</p>
          <p><strong>Status:</strong> {entity.status}</p>
        </div>
      ) : null}
    </Modal>
  );
};

export default EntityModal; 