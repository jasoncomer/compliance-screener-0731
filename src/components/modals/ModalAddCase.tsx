import { FC, useState } from 'react';
import { Button, Form, Input, Modal as AntModal, Spin } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { ICase, ICaseCreate } from '../../typings/interfaces';
import { ECaseStatus } from '../../typings/enums';
import { api } from '../../api/api';
import styled from 'styled-components';

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
  const [loading, setLoading] = useState<boolean>(false);

  const clearData = () => {
    setClientEmail('');
    setClientName('');
    setBlockchainAddress('');
    setNotes('');
  };

  const handleCreateCase = async () => {
    if (loading) return;

    if (!clientEmail || !clientName || !blockchainAddress) {
      console.log('Please fill all fields');
      return;
    }

    setLoading(true);
    const newCase: ICaseCreate = {
      clientEmail,
      clientName,
      addresses: [blockchainAddress],
      notes,
      status: ECaseStatus.ACTIVE,
    };

    let success = false;
    await api.cases.create(newCase)
      .then(res => {
        setCase(res);
        success = true;
        console.log('res', res, success);
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    
    if (success) {
      console.log('close modal')
      setIsModalOpen(false);
      clearData();
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
              type='text'
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Input
              required
              placeholder="Client Email"
              type='email'
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Input
              required
              placeholder="Address of interest (BTC/ETH)"
              type='text'
              value={blockchainAddress}
              onChange={(e) => setBlockchainAddress(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <TextArea
              placeholder="Case Notes"
              rows={10}
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