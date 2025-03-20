import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Typography, Button, Table, Timeline, Select, Form, Input, message, Tag, Space } from 'antd';
import { ICase, ICaseStatusChange } from '../../typings/interfaces';
import styled from 'styled-components';
import { api } from '../../api/api';
import { IBtcAddressSummary } from '../../typings/BtcAddress';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { satsToBTC, getTransactionAmountOfAddress } from '../../utils/crypto';
import { ECaseStatus, ECaseStatusDisplayNames, ECaseStatusColors } from '../../typings/enums';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Title: AntTitle, Text } = Typography;

interface ModalCaseContentProps {
  userCase: ICase;
  open: boolean;
  close: () => void;
  refreshCases?: () => void;
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
  display: flex;
  justify-content: space-between;
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

const Textarea = styled.textarea`
  width: 100%;
  height: 100px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  margin-top: 16px;
`;

const ModalCaseContent: React.FC<ModalCaseContentProps> = ({ userCase, open, close, refreshCases }) => {
  const { addresses: addressesString, caseId, clientEmail, clientName, status, userId, blockchain, notes } = userCase;
  const addresses = useMemo(() => Array.isArray(addressesString) ? addressesString : [addressesString], [addressesString]);

  const [summary, setSummary] = useState<IBtcAddressSummary>();
  const [transactions, setTransactions] = useState<BtcTransaction[]>([]);
  const [statusHistory, setStatusHistory] = useState<ICaseStatusChange[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // For status change form
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Status options for the dropdown - filtered based on current status
  const statusTransitions: Record<ECaseStatus, ECaseStatus[]> = {
    [ECaseStatus.NEW]: [ECaseStatus.UNDER_REVIEW, ECaseStatus.PENDING_INFO, ECaseStatus.CLOSED],
    [ECaseStatus.UNDER_REVIEW]: [ECaseStatus.ESCALATED, ECaseStatus.PENDING_INFO, ECaseStatus.CLOSED],
    [ECaseStatus.ESCALATED]: [ECaseStatus.UNDER_REVIEW, ECaseStatus.PENDING_INFO, ECaseStatus.CLOSED],
    [ECaseStatus.PENDING_INFO]: [ECaseStatus.UNDER_REVIEW, ECaseStatus.CLOSED],
    [ECaseStatus.CLOSED]: [ECaseStatus.ARCHIVED],
    [ECaseStatus.ARCHIVED]: [],
  };

  // Load case data when modal opens
  useEffect(() => {
    if (open) {
      const addrTmp = "16va6NxJrMGe5d2LP6wUzuVnzBBoKQZKom";
      api.blockchain.getAddressSummary(addrTmp)
        .then(data => setSummary(data))
        .catch(console.error);
      api.blockchain.getAddressTransactions(addrTmp, { page: 1, limit: 100 })
        .then(data => {
          const txs = data.txs.map((tx) => ({
            ...tx,
            amount: satsToBTC(getTransactionAmountOfAddress(tx, addrTmp)),
            date: new Date(tx.timestamp * 1000).toLocaleString(),
          }));
          setTransactions(txs);
        })
        .catch(console.error);
      
      // Load status history
      setIsLoadingHistory(true);
      api.cases.getCaseStatusHistory(userCase._id)
        .then(history => {
          setStatusHistory(history);
        })
        .catch(error => {
          console.error('Failed to load status history:', error);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    }
  }, [open, caseId, addresses, userCase._id]);
  
  // Handle status change form submission
  const handleStatusChange = async (values: { newStatus: ECaseStatus; notes: string }) => {
    setIsSubmitting(true);
    try {
      await api.cases.updateStatus(userCase._id, values.newStatus, values.notes);
      message.success(`Status updated to ${ECaseStatusDisplayNames[values.newStatus]}`);
      form.resetFields();
      
      // Refresh cases list and close modal
      if (refreshCases) {
        refreshCases();
      }
      close();
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPdfReport = async (address: string) => {
    console.log('Downloading PDF report for address:', address);
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Transaction Hash',
      dataIndex: 'txid',
      key: 'txid',
    },
    {
      title: 'Amount (BTC)',
      dataIndex: 'amount',
      key: 'amount',
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
            {addresses.map((address, index) => (
              <li key={index}><Value>{address.trim()}</Value></li>
            ))}
          </AddressList>
        </InfoSection>

        {summary && (
          <SummarySection>
            <section>
              <Title level={4}>Case Summary</Title>
              <p><Label>Address Balance:</Label><Value>hh{summary.balance}</Value></p>
              <p><Label>Total Transactions:</Label><Value>{transactions.length}</Value></p>
              <p><Label>Total BTC Transacted:</Label><Value>{summary.total_received + summary.total_spent}</Value></p>
              <p><Label>Total Received:</Label><Value>{summary.total_received}</Value></p>
              <p><Label>Total Sent:</Label><Value>{summary.total_spent}</Value></p>
            </section>
            <section>
              {/* Support for multiple addresses is not implemented yet */}
              <DownloadButton type="primary" onClick={() => downloadPdfReport(addresses[0])}>
                Download PDF Report
              </DownloadButton>
            </section>
          </SummarySection>
        )}

        <TransactionSection>
          <Title level={4}>Transactions</Title>
          <StyledTable dataSource={transactions} columns={columns} />
        </TransactionSection>

        {/* Status History Section */}
        <InfoSection>
          <Title level={4}>Status History</Title>
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading status history...</div>
          ) : statusHistory.length > 0 ? (
            <Timeline
              mode="left"
              items={statusHistory.map(item => ({
                color: ECaseStatusColors[item.newStatus],
                children: (
                  <div>
                    <Space direction="vertical">
                      <Space>
                        <Tag color={ECaseStatusColors[item.oldStatus]}>
                          {ECaseStatusDisplayNames[item.oldStatus]}
                        </Tag>
                        <ArrowRightOutlined />
                        <Tag color={ECaseStatusColors[item.newStatus]}>
                          {ECaseStatusDisplayNames[item.newStatus]}
                        </Tag>
                      </Space>
                      <Text type="secondary">
                        {new Date(item.changeDate).toLocaleString()} by {item.changedBy}
                      </Text>
                      {item.notes && <Text>{item.notes}</Text>}
                    </Space>
                  </div>
                ),
              }))}
            />
          ) : (
            <Text>No status changes recorded yet.</Text>
          )}
        </InfoSection>

        {/* Status Change Form */}
        {statusTransitions[status as ECaseStatus]?.length > 0 && (
          <InfoSection>
            <Title level={4}>Update Status</Title>
            <Form 
              form={form}
              onFinish={handleStatusChange}
              layout="vertical"
            >
              <Form.Item
                name="newStatus"
                label="Change status to:"
                rules={[{ required: true, message: 'Please select a new status' }]}
              >
                <Select placeholder="Select new status">
                  {statusTransitions[status as ECaseStatus].map(availableStatus => (
                    <Select.Option key={availableStatus} value={availableStatus}>
                      <Space>
                        <Tag color={ECaseStatusColors[availableStatus]}>
                          {ECaseStatusDisplayNames[availableStatus]}
                        </Tag>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="notes"
                label="Notes for this status change"
                rules={[{ required: true, message: 'Please provide notes explaining this status change' }]}
              >
                <Input.TextArea rows={4} placeholder="Explain why you are changing the status" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  Update Status
                </Button>
              </Form.Item>
            </Form>
          </InfoSection>
        )}

        <InfoSection>
          <Title level={4}>Case Notes</Title>
          <Textarea readOnly value={notes || ''} />
        </InfoSection>

      </Wrapper>
    </Modal>
  );
};

export default ModalCaseContent;