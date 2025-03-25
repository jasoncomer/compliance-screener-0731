import React, { useState } from 'react';
import { Table, Button, Space, Popover, Tag } from 'antd';
import { colors } from '../../../styles/variables';
import { FolderAddOutlined, EllipsisOutlined, CheckOutlined } from '@ant-design/icons';
import { IComplianceTransaction } from '../../../typings/compliance';
import { conversionRates, currencySymbols } from './CurrencySelector';
import ModalCreateCaseFromTransaction from '../../../components/modals/ModalCreateCaseFromTransaction';
import { useAttribution } from '../../../context/AttributionContext';
import { truncateAddress } from '../../../utils/crypto';


interface TransactionsTableProps {
  transactions: IComplianceTransaction[];
  totalTransactions: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  denom: string;
  onTableChange: (pagination: any) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onEntityClick: (record: IComplianceTransaction) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  totalTransactions,
  currentPage,
  pageSize,
  loading,
  denom,
  onTableChange,
  onStatusChange,
  onEntityClick,
}) => {
  // const navigate = useNavigate();
  const { attributions } = useAttribution();
  const [selectedTransaction, setSelectedTransaction] = useState<IComplianceTransaction | null>(null);
  const [isCaseModalVisible, setIsCaseModalVisible] = useState(false);

  console.log({ transactions, totalTransactions, currentPage, pageSize, loading, denom, onTableChange, onStatusChange, onEntityClick });

  // Function to handle the create case action
  const handleCreateCase = (record: IComplianceTransaction, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    setSelectedTransaction(record);
    setIsCaseModalVisible(true);
  };

  // Function to get risk score color
  const getRiskScoreColor = (score: number) => {
    if (score > 70) return colors.danger;
    if (score > 40) return colors.warning;
    return colors.success;
  };

  // const getCryptocurrencyPrice = (cryptocurrency: string) => {
  //   const price = conversionRates[cryptocurrency];
  //   return price ? price.toFixed(2) : 'N/A';
  // };

  console.log({ denom, currencySymbols, conversionRates, transactions });

  const columns = [
    {
      title: 'Counterparty Entity',
      dataIndex: 'counterpartyEntities',
      key: 'counterpartyEntities',
      width: 200,
      onFilter: (value: any, record: IComplianceTransaction) =>
        record.counterpartyEntities.includes(String(value)),
      render: (counterpartyEntities: string[], record: IComplianceTransaction) => {
        if (!counterpartyEntities) return null;
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
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => {
        console.log({ a, b });
        return a.txId.localeCompare(b.txId);
      },
      onFilter: (value: any, record: IComplianceTransaction) =>
        record.txId.includes(String(value)),
      render: (txId: string) => {
        if (!txId) return null;
        return (
          <a href={`/home/block-explorer/transaction/${txId}`} target="_blank" rel="noopener noreferrer">
            {truncateAddress(txId)}
          </a>
        )
      }
    },
    // {
    //   title: 'Account Owner',
    //   dataIndex: 'monitoredAddressId',
    //   key: 'monitoredAddressId',
    //   sorter: (a: IComplianceTransaction, b: IComplianceTransaction) =>
    //     a.monitoredAddressId.localeCompare(b.monitoredAddressId),
    //   render: (monitoredAddress: IComplianceTransaction['monitoredAddressId']) =>
    //     <span>{monitoredAddress?.notes || monitoredAddress?.address}</span>
    // },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      width: 120,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => a.blockchain.localeCompare(b.blockchain),
      onFilter: (value: any, record: IComplianceTransaction) => record.blockchain.includes(String(value))
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) =>
        a.amount - b.amount,
      onFilter: (value: any, record: IComplianceTransaction) =>
        record.amount === Number(value),
      render: (amount: number) => (
        <span>
          BTC {(amount / 100000000)}
        </span>
      )
    },
    {
      title: 'Converted Amount',
      key: 'convertedAmount',
      width: 110,
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
      width: 120,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      onFilter: (value: any, record: IComplianceTransaction) => record.timestamp.toLocaleString().includes(String(value))
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScores',
      key: 'riskScores',
      width: 80,
      onFilter: (value: any, record: IComplianceTransaction) => record.riskScores.includes(Number(value)),
      render: (scores: number[]) => {
        const score = scores.reduce((acc, curr) => acc + curr, 0) / scores.length;
        return (
          <Tag color={getRiskScoreColor(score)} style={{ fontWeight: 'bold' }}>
            {score}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: IComplianceTransaction) => (
        <Popover
          content={
            <Space direction="vertical" size="small" style={{ display: 'flex', flexDirection: 'column' }}>
              <Button
                size="middle"
                icon={<CheckOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(record._id, 'approved');
                }}
                title="Approve Transaction"
                style={{ color: colors.success, width: '100%' }}
              >

                Approve Transaction
              </Button>
              <Button
                icon={<FolderAddOutlined />}
                // type="primary"
                size="middle"
                onClick={(e) => handleCreateCase(record, e)}
                title="Create Case"
                style={{ width: '100%' }}
              >
                Move To Active Case
              </Button>
              {/* <Button
                icon={<EyeOutlined />}
                size="middle"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/home/block-explorer/transaction/${record.txId}`);
                }}
                title="View in Blockexplorer"
                style={{ width: '100%' }}
              >
                View in Blockexplorer
              </Button> */}
            </Space>
          }
          trigger="hover"
          placement="left"
        >
          <Button size="small" type="text" icon={<EllipsisOutlined />} />
        </Popover>
      )
    }
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
          onClick: () => onEntityClick(record),
        })}
      />

      <ModalCreateCaseFromTransaction
        isVisible={isCaseModalVisible}
        onClose={() => setIsCaseModalVisible(false)}
        transaction={selectedTransaction}
      />
    </>
  );
};

export default TransactionsTable; 