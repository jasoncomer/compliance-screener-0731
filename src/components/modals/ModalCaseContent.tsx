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
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/variables';
import '../../styles/theme-overrides.css';

const { Title: AntTitle, Text } = Typography;

interface ModalCaseContentProps {
  userCase: ICase;
  open: boolean;
  close: () => void;
  refreshCases?: () => void;
}

interface ThemedProps {
  theme: 'light' | 'dark';
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

const InfoSection = styled.div<ThemedProps>`
  background-color: ${props => props.theme === 'light' ? '#f5f5f5' : colors.gray[800]};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Label = styled(Text)<ThemedProps>`
  font-weight: bold;
  margin-right: 8px;
  color: ${props => props.theme === 'light' ? colors.gray[800] : colors.white};
`;

const Value = styled(Text)<ThemedProps>`
  color: ${props => props.theme === 'light' ? '#1890ff' : '#69c0ff'};
`;

const AddressList = styled.ul`
  list-style-type: none;
  padding-left: 0;
  margin: 0;
`;

const Title = styled(AntTitle)<ThemedProps>`
  margin-top: 0;
  color: ${props => props.theme === 'light' ? colors.gray[800] : colors.white};
`;

const SummarySection = styled(InfoSection)`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
`;

const TransactionSection = styled(InfoSection)`
  margin-top: 16px;
`;

const StyledTable = styled(Table)<ThemedProps>`
  &.light-theme-table .ant-table {
    background-color: #fff !important;
  }
  
  &.light-theme-table .ant-table-thead > tr > th {
    background-color: #fafafa !important;
    color: #000 !important;
  }
  
  &.light-theme-table .ant-table-tbody > tr > td {
    background-color: #fff !important;
    color: #000 !important;
  }
`;

const DownloadButton = styled(Button)`
  margin-top: 16px;
`;

const Textarea = styled.textarea<ThemedProps>`
  width: 100%;
  height: 100px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#d9d9d9' : colors.gray[700]};
  background-color: ${props => props.theme === 'light' ? colors.white : colors.gray[900]};
  color: ${props => props.theme === 'light' ? colors.gray[800] : colors.white};
  margin-top: 16px;
`;

const FormLabel = ({ children, theme }: { children: React.ReactNode; theme: 'light' | 'dark' }) => (
  <Label theme={theme}>{children}</Label>
);

const ModalCaseContent: React.FC<ModalCaseContentProps> = ({ userCase, open, close, refreshCases }) => {
  const { addresses: addressesString, caseId, clientEmail, clientName, status, userId, blockchain, notes } = userCase;
  const addresses = useMemo(() => Array.isArray(addressesString) ? addressesString : [addressesString], [addressesString]);
  const { theme } = useTheme();

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
      title={<Title level={3} theme={theme}>{`Case Details: ${caseId.toUpperCase()}`}</Title>}
      centered
      open={open}
      onOk={() => close()}
      onCancel={() => close()}
      width={1000}
      className={theme === 'light' ? 'light-theme-view' : ''}
    >
      <Wrapper>
        <GridContainer>
          <InfoSection theme={theme}>
            <Title level={4} theme={theme}>Client Information</Title>
            <p><Label theme={theme}>Name:</Label><Value theme={theme}>{clientName}</Value></p>
            <p><Label theme={theme}>Email:</Label><Value theme={theme}>{clientEmail}</Value></p>
            <p><Label theme={theme}>Blockchain:</Label><Value theme={theme}>{blockchain}</Value></p>
          </InfoSection>
          <InfoSection theme={theme}>
            <Title level={4} theme={theme}>Case Details</Title>
            <p><Label theme={theme}>Status:</Label><Value theme={theme}>{status}</Value></p>
            <p><Label theme={theme}>User ID:</Label><Value theme={theme}>{userId}</Value></p>
          </InfoSection>
        </GridContainer>

        <InfoSection theme={theme}>
          <Title level={4} theme={theme}>Addresses</Title>
          <AddressList>
            {addresses.map((address, index) => (
              <li key={index}><Value theme={theme}>{address.trim()}</Value></li>
            ))}
          </AddressList>
        </InfoSection>

        {summary && (
          <SummarySection theme={theme}>
            <section>
              <Title level={4} theme={theme}>Case Summary</Title>
              <p><Label theme={theme}>Address Balance:</Label><Value theme={theme}>{summary.balance}</Value></p>
              <p><Label theme={theme}>Total Transactions:</Label><Value theme={theme}>{transactions.length}</Value></p>
              <p><Label theme={theme}>Total BTC Transacted:</Label><Value theme={theme}>{summary.total_received + summary.total_spent}</Value></p>
              <p><Label theme={theme}>Total Received:</Label><Value theme={theme}>{summary.total_received}</Value></p>
              <p><Label theme={theme}>Total Sent:</Label><Value theme={theme}>{summary.total_spent}</Value></p>
            </section>
            <section>
              {/* Support for multiple addresses is not implemented yet */}
              <DownloadButton type="primary" onClick={() => downloadPdfReport(addresses[0])}>
                Download PDF Report
              </DownloadButton>
            </section>
          </SummarySection>
        )}

        <TransactionSection theme={theme}>
          <Title level={4} theme={theme}>Transactions</Title>
          <StyledTable 
            columns={columns} 
            dataSource={transactions} 
            rowKey="txid"
            theme={theme}
            className={theme === 'light' ? 'light-theme-table' : ''}
          />
        </TransactionSection>

        {/* Status History Section */}
        <InfoSection theme={theme}>
          <Title level={4} theme={theme}>Status History</Title>
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading status history...</div>
          ) : statusHistory.length === 0 ? (
            <p><Label theme={theme}>No status changes recorded yet.</Label></p>
          ) : (
            <Timeline
              items={statusHistory.map((item, index) => ({
                key: index.toString(),
                children: (
                  <>
                    <p><Value theme={theme}>{`${ECaseStatusDisplayNames[item.oldStatus]} → ${ECaseStatusDisplayNames[item.newStatus]}`}</Value></p>
                    <p><Label theme={theme}>User:</Label> <Value theme={theme}>{item.changedBy}</Value></p>
                    <p><Label theme={theme}>Notes:</Label> <Value theme={theme}>{item.notes || 'No notes provided'}</Value></p>
                    <p><Label theme={theme}>Date:</Label> <Value theme={theme}>{new Date(item.changeDate).toLocaleString()}</Value></p>
                  </>
                )
              }))}
            />
          )}
        </InfoSection>

        {/* Status Change Form */}
        {statusTransitions[status as ECaseStatus]?.length > 0 && (
          <InfoSection theme={theme}>
            <Title level={4} theme={theme}>Update Status</Title>
            <Form 
              form={form}
              layout="vertical"
              onFinish={handleStatusChange}
              initialValues={{ newStatus: '', notes: '' }}
            >
              <Form.Item
                name="newStatus"
                label={<FormLabel theme={theme}>New Status</FormLabel>}
                rules={[{ required: true, message: 'Please select a new status' }]}
              >
                <Select placeholder="Select new status">
                  {statusTransitions[status as ECaseStatus].map(s => (
                    <Select.Option key={s} value={s}>
                      <Space>
                        <Tag color={ECaseStatusColors[s]}>{ECaseStatusDisplayNames[s]}</Tag>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="notes"
                label={<FormLabel theme={theme}>Notes (optional)</FormLabel>}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  Update Status
                </Button>
              </Form.Item>
            </Form>
          </InfoSection>
        )}

        <InfoSection theme={theme}>
          <Title level={4} theme={theme}>Case Notes</Title>
          <Textarea readOnly value={notes || ''} theme={theme} />
        </InfoSection>
      </Wrapper>
    </Modal>
  );
};

export default ModalCaseContent;