import React from 'react';
import { Modal, Form } from 'antd';
import { MonitoredAddress } from '../../../typings/compliance';
import AddressForm from './AddressForm';

interface AddressFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  editingAddress: MonitoredAddress | null;
  form: any;
  confirmLoading?: boolean;
}

const AddressFormModal: React.FC<AddressFormModalProps> = ({
  visible,
  onCancel,
  onOk,
  editingAddress,
  form,
  confirmLoading,
}) => {
  return (
    <Modal
      title={editingAddress ? 'Edit Address' : 'Add Address'}
      open={visible}
      onOk={onOk}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
      confirmLoading={confirmLoading}
    >
      <AddressForm form={form} initialValues={editingAddress || undefined} />
    </Modal>
  );
};

export default AddressFormModal; 