import React from 'react';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

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
      onClose={() => {
        onCancel();
        form.resetFields();
      }}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              onCancel();
              form.resetFields();
            }}
            disabled={confirmLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onOk}
            disabled={confirmLoading}
          >
            {confirmLoading ? 'Loading...' : editingAddress ? 'Update' : 'Add'}
          </Button>
        </>
      }
    >
      <AddressForm form={form} initialValues={editingAddress || undefined} />
    </Modal>
  );
};

export default AddressFormModal; 