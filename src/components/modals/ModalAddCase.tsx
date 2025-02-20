import { FC, useState } from 'react';
import { Button, Form, Modal as AntModal, Spin } from 'antd';
import { ICase, ICaseCreate } from '../../typings/interfaces';
import { ECaseStatus } from '../../typings/enums';
import { api } from '../../api/api';
import styled from 'styled-components';
import Input from '../common/Input';

const Modal = styled(AntModal)`
  .ant-modal-body {
    position: relative;
  }
`;

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  cases: ICase[];
  setCase: (data: ICase) => void;
}

const ModalAddCase: FC<Props> = ({ isModalOpen, setIsModalOpen, setCase }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [blockchainAddress, setBlockchainAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCase = async () => {
    if (!clientName || !clientEmail || !blockchainAddress) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const caseData: ICaseCreate = {
        clientName,
        clientEmail,
        addresses: [blockchainAddress],
        notes,
        status: ECaseStatus.ACTIVE,
      };

      const res = await api.cases.create(caseData);
      if (res) {
        setCase(res);
        setIsModalOpen(false);
        // Reset form
        setClientName('');
        setClientEmail('');
        setBlockchainAddress('');
        setNotes('');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="New Case"
      centered
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      footer={null}
      loading={loading}
    >
      {loading && <Spin style={{ position: 'absolute', left: 'calc(100% - 25px)', top: 'calc(100% - 25px)', zIndex: 9 }} />}
      <Form
        onFinish={handleCreateCase}
      >
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
            required
            placeholder="Address of interest (BTC/ETH)"
            type="text"
            value={blockchainAddress}
            onChange={(e) => setBlockchainAddress(e.target.value)}
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
          <Button type="default" onClick={() => setIsModalOpen(false)}>
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

export default ModalAddCase;