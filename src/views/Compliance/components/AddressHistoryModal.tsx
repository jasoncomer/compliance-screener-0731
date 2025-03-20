import React from 'react';
import { Modal } from 'antd';
import AddressChangeHistory from '../AddressChangeHistory';

interface AddressHistoryModalProps {
  visible: boolean;
  onCancel: () => void;
  addressId: string | null;
  organizationId?: string;
  refreshKey?: number;
}

const AddressHistoryModal: React.FC<AddressHistoryModalProps> = ({
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
        <AddressChangeHistory 
          addressId={addressId} 
          organizationId={organizationId}
          refreshKey={refreshKey} 
        />
      )}
    </Modal>
  );
};

export default AddressHistoryModal; 