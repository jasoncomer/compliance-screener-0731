import { Button, Form, Input, Modal } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';
import CasesTable from './CasesTable';
import useData from '../hooks/useData';
import { ICase } from '../typings/interfaces';

const { TextArea } = Input;

interface Props { }

const CaseWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 800px;
  max-width: 90%;
  height: 500px;
  margin: calc(50vh - 250px) auto;
  border-radius: 8px;
  padding: 2em;
`;

const ButtonDiv = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2em;
`;

const Cases: React.FC<Props> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [blockchainAddress, setBlockchainAddress] = useState('');
  const [notes, setNotes] = useState('');
  const { cases, setCases } = useData();

  const handleCreateCase = (values: object) => {
    console.log('create case', values);
    console.log('create case', { clientEmail, clientName, blockchainAddress, notes });

    if (!clientEmail || !clientName || !blockchainAddress) {
      console.log('Please fill all fields');
      return;
    }
    const newCase: ICase = {
      clientEmail,
      clientName,
      blockchainAddress,
      notes,
      id: `blk-${Math.random() * 10000}`.slice(0, 8),
      status: 'pending',
    };
    setCases([...cases, newCase]);
    setIsModalOpen(false);
  };

  return (
    <>
      <CaseWrapper>
        <ButtonDiv>
          <Button type="primary" onClick={() => setIsModalOpen(prev => !prev)}>Add Case</Button>
        </ButtonDiv>
        <CasesTable cases={cases} />
      </CaseWrapper>

      <Modal
        title="New Case"
        centered
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
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
    </>
  );
};

export default Cases;