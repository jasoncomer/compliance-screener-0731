import React from 'react';
import { Modal } from 'antd';
import { useTheme } from '../../../context/ThemeContext';
import { colors } from '@/design-system/tokens'
import { IComplianceTransaction } from '../../../typings/compliance';

interface EntityModalProps {
  visible: boolean;
  onClose: () => void;
  entity: IComplianceTransaction | null;
}

export const EntityModal: React.FC<EntityModalProps> = ({ visible, onClose, entity }) => {
  const { theme } = useTheme();

  return (
    <Modal
      title={`Entity Explorer: ${entity ? entity.counterpartyEntities : ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      {entity ? (
        <div style={{ color: theme === 'light' ? colors.black : colors.white }}>
          <h2>{entity.counterpartyEntities}</h2>
          <p><strong>Address:</strong> {entity.counterpartyEntities}</p>
          <p><strong>Blockchain:</strong> {entity.blockchain}</p>
          <p><strong>Risk Score:</strong> {entity.riskScores}</p>
          <p><strong>Status:</strong> {entity.status}</p>
        </div>
      ) : null}
    </Modal>
  );
};
