/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect } from 'react';
import { Modal, Typography, Button, Table } from 'antd';
import { ICase } from '../../typings/interfaces';
import styled from 'styled-components';
import { api } from '../../api/api';
import { satsToBTC } from '../../utils/crypto';
import { IBtcAddressSummary } from '../../typings/BtcAddress';

const { Title: AntTitle, Text } = Typography;


interface ITransaction {
  hash: string;
  amount: number;
  date: string;
}

interface ModalCaseContentProps {
  userCase: ICase;
  open: boolean;
  close: () => void;
  // fetchCaseSummary: (caseId: string) => Promise<IAddressSummary>;
  // fetchCaseTransactions: (caseId: string) => Promise<ITransaction[]>;
  // downloadPdfReport: (caseId: string) => void;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const InfoSection = styled.div`
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Label = styled(Text)`
  font-weight: bold;
  margin-right: 8px;
`;

const Value = styled(Text)`
  color: #1890ff;
`;

const AddressList = styled.ul`
  list-style-type: none;
  padding-left: 0;
  margin: 0;
`;

const Title = styled(AntTitle)`
  margin-top: 0;
`;

const SummarySection = styled(InfoSection)`
  margin-top: 16px;
`;

const TransactionSection = styled(InfoSection)`
  margin-top: 16px;
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background-color: #f0f2f5;
  }
`;

const DownloadButton = styled(Button)`
  margin-top: 16px;
`;

const ModalCaseContent: React.FC<ModalCaseContentProps> = ({ userCase, open, close }) => {
  const { addresses: addressesString, caseId, clientEmail, clientName, status, userId, blockchain, notes } = userCase;
  const addresses = Array.isArray(addressesString) ? addressesString.join(',') : addressesString;

  const [summary, setSummary] = useState<IBtcAddressSummary>();
  const [transactions, setTransactions] = useState<ITransaction[]>([]);

  useEffect(() => {
    console.log('transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    if (open) {
      // fetchCaseSummary(caseId).then(setSummary);
      console.log('addresses', addresses);
      const addrTmp = "16va6NxJrMGe5d2LP6wUzuVnzBBoKQZKom";
      api.blockchain.getAddressSummary(addrTmp)
        .then(data => {
          console.log('data', data);
          setSummary(data);
        })
        .catch(console.error);
    }
  }, [open, caseId, addresses]);

  const downloadPdfReport = async (address: string) => {
    const report = await api.blockchain.generateReport(address)
      .catch((error) => console.error(error));

    if (report) {
      const blob = new Blob([report], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${address}.pdf`;
      a.click();
    }
  };

  const columns = [
    {
      title: 'Transaction Hash',
      dataIndex: 'txid',
      key: 'txid',
    },
    {
      title: 'Amount (BTC)',
      dataIndex: 'amount',
      key: 'inamt',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  return (
    <Modal
      title={<Title level={3}>{`Case Details: ${caseId.toUpperCase()}`}</Title>}
      centered
      open={open}
      onOk={() => close()}
      onCancel={() => close()}
      width={1000}
    >
      <Wrapper>
        <GridContainer>
          <InfoSection>
            <Title level={4}>Client Information</Title>
            <p><Label>Name:</Label><Value>{clientName}</Value></p>
            <p><Label>Email:</Label><Value>{clientEmail}</Value></p>
            <p><Label>Blockchain:</Label><Value>{blockchain}</Value></p>
          </InfoSection>
          <InfoSection>
            <Title level={4}>Case Details</Title>
            <p><Label>Status:</Label><Value>{status}</Value></p>
            <p><Label>User ID:</Label><Value>{userId}</Value></p>
          </InfoSection>
        </GridContainer>

        <InfoSection>
          <Title level={4}>Addresses</Title>
          <AddressList>
            {addresses.split(',').map((address, index) => (
              <li key={index}><Value>{address.trim()}</Value></li>
            ))}
          </AddressList>
        </InfoSection>

        {summary && (
          <SummarySection>
            <Title level={4}>Case Summary</Title>
            <p><Label>Address Balance:</Label><Value>{summary.balance}</Value></p>
            <p><Label>Total Transactions:</Label><Value>{summary.txCount}</Value></p>
            <p><Label>Total BTC Transacted:</Label><Value>{summary.totalReceived + summary.totalSent}</Value></p>
            <p><Label>Total Received:</Label><Value>{summary.totalReceived}</Value></p>
            <p><Label>Total Sent:</Label><Value>{summary.totalSent}</Value></p>
          </SummarySection>
        )}

        <TransactionSection>
          <Title level={4}>Transactions</Title>
          <StyledTable dataSource={transactions} columns={columns} />
        </TransactionSection>

        <InfoSection>
          <Title level={4}>Notes</Title>
          <Text>{notes}</Text>
        </InfoSection>

        {/* Support for multiple addresses is not implemented yet */}
        <DownloadButton type="primary" onClick={() => downloadPdfReport(addresses[0])}>
          Download PDF Report
        </DownloadButton>
      </Wrapper>
    </Modal>
  );
};

export default ModalCaseContent;