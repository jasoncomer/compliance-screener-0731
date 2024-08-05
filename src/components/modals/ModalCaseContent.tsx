import React from 'react';
import { Modal } from 'antd';
import { ICase } from '../../typings/interfaces';

interface ModalCaseContentProps {
  userCase: ICase;
  open: boolean;
  close: () => void;
}

const ModalCaseContent: React.FC<ModalCaseContentProps> = ({ userCase, open, close }) => {
  const { addresses, caseId, clientEmail, clientName, status, userId, blockchain, key, notes } = userCase;
  return (
    <Modal
      title={`Case Details: ${caseId.toUpperCase()}`}
      centered
      open={open}
      onOk={() => close()}
      onCancel={() => close()}
      width={1000}
    >
      <div>
        <p>Client Name: {clientName}</p>
        <p>Client Email: {clientEmail}</p>
        <p>Blockchain: {blockchain}</p>
        <p>Key: {key}</p>
        <p>Notes: {notes}</p>
        <p>Status: {status}</p>
        <p>User ID: {userId}</p>
        <p>Addresses: {addresses}</p>
      </div>
    </Modal>
  );
};

export default ModalCaseContent;