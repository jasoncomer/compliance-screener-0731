import React, { useState } from 'react';

import { EyeOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Tag } from 'antd';

import { colors } from '@/design-system/tokens'

import { useTheme } from '../../../context/ThemeContext';
import { calculateSimpleRiskScore } from '../../../services/inputTransactionRiskService';
import { IComplianceTransaction } from '../../../typings/compliance';
import { TransactionRiskModal } from '../components/modals/TransactionRiskModal';

interface EntityModalProps {
  visible: boolean;
  onClose: () => void;
  entity: IComplianceTransaction | null;
}

export const EntityModal: React.FC<EntityModalProps> = ({ visible, onClose, entity }) => {
  const { theme } = useTheme();
  const [isRiskModalVisible, setIsRiskModalVisible] = useState(false);

  const renderRiskScore = () => {
    if (!entity?.riskScores || entity.riskScores.length === 0) return 'N/A';
    const overallScore = entity.riskScores[0] || 0;
    const riskData = calculateSimpleRiskScore([overallScore]);
    
    return (
      <Space>
        <Tag color={riskData.color} style={{ fontWeight: 'bold' }}>
          {overallScore}
        </Tag>
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setIsRiskModalVisible(true)}
          title="View detailed risk analysis"
        />
      </Space>
    );
  };

  return (
    <>
      <Modal
        title={`Entity Explorer: ${entity ? entity.counterpartyEntities : ''}`}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={600}
      >
        {entity ? (
          <div style={{ color: theme === 'light' ? colors.black : colors.white }}>
            <h2>{entity.counterpartyEntities}</h2>
            <p><strong>Address:</strong> {entity.counterpartyEntities}</p>
            <p><strong>Blockchain:</strong> {entity.blockchain}</p>
            <p><strong>Risk Score:</strong> {renderRiskScore()}</p>
            <p><strong>Status:</strong> {entity.status}</p>
            <p><strong>Transaction ID:</strong> {entity.txId}</p>
            <p><strong>Amount:</strong> {entity.amount} satoshis</p>
            <p><strong>Timestamp:</strong> {new Date(entity.timestamp).toLocaleString()}</p>
          </div>
        ) : null}
      </Modal>

      <TransactionRiskModal
        visible={isRiskModalVisible}
        onClose={() => setIsRiskModalVisible(false)}
        transaction={entity}
        title="Entity Risk Analysis"
      />
    </>
  );
};
