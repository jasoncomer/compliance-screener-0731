import React, { FC, useState } from 'react';
import { Button, Form, Modal as AntModal, Spin, message } from 'antd';
import { ICaseCreate } from '../../typings/interfaces';
import { ECaseStatus } from '../../typings/enums';
import { api } from '../../api/api';
import styled from 'styled-components';
import Input from '../common/Input';
import { ComplianceTransaction } from '../../typings/compliance';
import { useNavigate } from 'react-router-dom';

const Modal = styled(AntModal)`
  .ant-modal-body {
    position: relative;
  }
`;

interface Props {
  isVisible: boolean;
  onClose: () => void;
  transaction: ComplianceTransaction | null;
}

const ModalCreateCaseFromTransaction: FC<Props> = ({ isVisible, onClose, transaction }) => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-populate notes with transaction information if available
  React.useEffect(() => {
    if (transaction) {
      const transactionInfo = `
Transaction ID: ${transaction.transactionId}
Blockchain: ${transaction.blockchain}
Amount: ${transaction.amount}
Risk Score: ${transaction.riskScore}
Timestamp: ${new Date(transaction.timestamp).toLocaleString()}
Counterparty Address: ${transaction.counterpartyAddress}
Monitored Address ID: ${transaction.monitoredAddressId}
`;
      setNotes(transactionInfo);
    }
  }, [transaction]);

  const handleCreateCase = async () => {
    if (!clientName || !clientEmail || !transaction) {
      message.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const caseData: ICaseCreate = {
        clientName,
        clientEmail,
        addresses: [transaction.counterpartyAddress, transaction.monitoredAddressId],
        notes,
        status: ECaseStatus.NEW,
      };

      const res = await api.cases.create(caseData);
      if (res) {
        message.success(`Case #${res.caseId} created successfully`);
        onClose();
        // Reset form
        setClientName('');
        setClientEmail('');
        setNotes('');
        // Navigate to the cases page
        navigate('/home/cases');
      }
    } catch (err) {
      console.error(err);
      message.error('Error creating case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Case from Transaction"
      centered
      open={isVisible}
      onCancel={onClose}
      footer={null}
      destroyOnClose={true}
    >
      {loading && <Spin style={{ position: 'absolute', left: 'calc(100% - 25px)', top: 'calc(100% - 25px)', zIndex: 9 }} />}
      <Form onFinish={handleCreateCase}>
        <Form.Item>
          <Input
            required
            placeholder="Client Name"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <Input
            required
            placeholder="Client Email"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <Input
            multiline
            rows={10}
            placeholder="Case Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Form.Item>

        <div style={{ display: 'flex', flexDirection: 'row', gap: '1em', justifyContent: 'flex-end' }}>
          <Button type="default" onClick={onClose}>
            Cancel
          </Button>

          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ModalCreateCaseFromTransaction;