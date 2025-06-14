import React from 'react';
import { Modal } from 'antd';
import MonitoredAddressChangeHistory from './MonitoredAddressChangeHistory';

interface MonitoredAddressHistoryModalProps {
  visible: boolean;
  onCancel: () => void;
  addressId: string | null;
  organizationId?: string;
  refreshKey?: number;
}

const MonitoredAddressHistoryModal: React.FC<MonitoredAddressHistoryModalProps> = ({
  visible,
  onCancel,
  addressId,
  organizationId,
  refreshKey,
}) => {
  return (
    <Modal
      title="Address Change History"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      {addressId && (
        <MonitoredAddressChangeHistory 
          addressId={addressId} 
          organizationId={organizationId}
          refreshKey={refreshKey} 
        />
      )}
    </Modal>
  );
};

export default MonitoredAddressHistoryModal; 