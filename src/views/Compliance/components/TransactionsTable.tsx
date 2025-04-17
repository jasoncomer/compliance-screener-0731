import React, { useState } from 'react';
import { Table, Tag } from 'antd';
import { colors } from '../../../styles/variables';
import { ETransactionStatus, IComplianceTransaction } from '../../../typings/compliance';
import { conversionRates, currencySymbols } from './CurrencySelector';
import ModalCreateCaseFromTransaction from '../../../components/modals/ModalCreateCaseFromTransaction';
import { TransactionDetailsModal } from '../modals/TransactionDetails/TransactionDetailsModal';
import { useAttribution } from '../../../context/AttributionContext';
import { truncateAddress } from '../../../utils/crypto';
import { getRiskScoreColor } from '../utils/compliance.utils';
import { getBlockchainLabel } from '../../../utils/display-labels';


interface TransactionsTableProps {
  transactions: IComplianceTransaction[];
  totalTransactions: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  onTableChange: (pagination: any) => void;
  onEntityClick: (record: IComplianceTransaction) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  totalTransactions,
  currentPage,
  pageSize,
  loading,
  onTableChange,
  onEntityClick,
}) => {
  const denom = 'USD';
  const { attributions } = useAttribution();
  const [selectedTransaction, setSelectedTransaction] = useState<IComplianceTransaction | null>(null);
  const [isCaseModalVisible, setIsCaseModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Function to handle row click to show transaction details
  const handleRowClick = (record: IComplianceTransaction) => {
    setSelectedTransactionId(record._id);
    setIsDetailsModalVisible(true);
  };
  
  // Function to open case modal from transaction
  const openCaseModal = (transaction: IComplianceTransaction) => {
    setSelectedTransaction(transaction);
    setIsCaseModalVisible(true);
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      // Remove filter dropdown since we're using the form above
      render: (status: ETransactionStatus) => (
        <Tag color={
          status === ETransactionStatus.APPROVED 
            ? 'green' 
            : status === ETransactionStatus.HOLD 
              ? 'orange' 
              : status === ETransactionStatus.CLOSED_WITH_NOTE || status === ETransactionStatus.CLOSED_WITH_SAR 
                ? 'red' 
                : 'blue'
        }>
          {status.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Client Id',
      dataIndex: 'clientId',
      key: 'clientId',
      width: 100,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => a.clientId.localeCompare(b.clientId),
    },
    {
      title: 'Counterparty Entities',
      dataIndex: 'counterpartyEntities',
      key: 'counterpartyEntities',
      width: 200,
      render: (counterpartyEntities: string[], record: IComplianceTransaction) => {
        if (!counterpartyEntities.length) return (
          <span style={{ color: colors.primaryDark }}>N/A</span>
        );
        return (
          <a onClick={() => onEntityClick(record)} style={{ cursor: 'pointer', color: colors.attributionHover, fontWeight: 'bold' }}>
            {counterpartyEntities.map((entity) => attributions[entity]?.entity || entity).join(', ')}
          </a>
        )
      }
    },
    {
      title: 'Transaction ID',
      dataIndex: 'txId',
      key: 'txId',
      width: 200,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => a.txId.localeCompare(b.txId),
      render: (txId: string) => {
        if (!txId) return null;
        return (
          <a href={`/home/block-explorer/transaction/${txId}`} target="_blank" rel="noopener noreferrer">
            {truncateAddress(txId)}
          </a>
        )
      }
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      width: 120,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => a.blockchain.localeCompare(b.blockchain),
      render: (blockchain: string) => {
        return getBlockchainLabel(blockchain);
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => a.amount - b.amount,
      render: (amount: number) => (
        <span>
          BTC {(amount / 100000000)}
        </span>
      )
    },
    {
      title: 'Converted Amount',
      key: 'convertedAmount',
      width: 140,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) =>
        (a.amount * conversionRates[denom]) - (b.amount * conversionRates[denom]),
      render: (_: any, record: IComplianceTransaction) => (
        <span>
          {currencySymbols[denom]}
          {
            ((record.amount / 100000000) * 83000)
              .toLocaleString(
                'en-US',
                { minimumFractionDigits: 0, maximumFractionDigits: 2 }
              )
          }
        </span>
      )
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 140,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScores',
      key: 'riskScores',
      width: 80,
      render: (scores: number[]) => {
        if (!scores || scores.length === 0) return 'N/A';
        const score = scores.reduce((acc, curr) => acc + curr, 0) / scores.length;
        return (
          <Tag color={getRiskScoreColor(score)} style={{ fontWeight: 'bold' }}>
            {score}
          </Tag>
        );
      }
    },
  ];

  return (
    <>
      <Table
        className="compliance-table"
        dataSource={transactions}
        columns={columns}
        rowKey="_id"
        sticky={{ offsetHeader: 80 }}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalTransactions,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        loading={loading}
        onChange={onTableChange}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
        scroll={{ x: 1400 }}
      />

      <ModalCreateCaseFromTransaction
        isVisible={isCaseModalVisible}
        onClose={() => setIsCaseModalVisible(false)}
        transaction={selectedTransaction}
      />

      <TransactionDetailsModal 
        isVisible={isDetailsModalVisible}
        onClose={() => setIsDetailsModalVisible(false)}
        transactionId={selectedTransactionId}
        openCaseModal={openCaseModal}
      />
    </>
  );
};

export default TransactionsTable; 