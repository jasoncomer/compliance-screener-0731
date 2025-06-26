import React, { useState, useMemo } from 'react';
import { Card, Typography, Button, Tabs, Alert } from 'antd';
import { useTheme } from '../../../../context/ThemeContext';
import { DataTable } from '../../../../components/DataTable';
import { TransformedTransaction } from '../../../../utils/transactionTransformers';
import { truncateStringMiddle } from '../../../../utils/generic';

const { Title } = Typography;

interface TransactionHistoryProps {
  transactions: TransformedTransaction[];
  loading?: boolean;
  error?: Error | null;
  address?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  transactions, 
  loading = false, 
  error = null,
  address = ''
}) => {
  const { theme } = useTheme();
  const [txTab, setTxTab] = useState<'all' | 'in' | 'out'>('all');

  // Function to open BlockScout explorer
  const handleViewInBlockScout = () => {
    if (address) {
      // Open in the internal block explorer
      const blockExplorerUrl = `/home/block-explorer/address/${address}`;
      window.open(blockExplorerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Define columns using the new DataTable structure
  const columns = useMemo(() => [
    {
      key: 'time',
      title: 'Time',
      width: 130,
      render: (value: string) => (
        <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-500'} text-xs whitespace-nowrap`}>{value}</span>
      ),
    },
    {
      key: 'direction',
      title: 'Direction',
      width: 70,
      render: (value: string) => (
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
          value === 'inflow' 
            ? 'bg-green-900 text-green-300' 
            : 'bg-red-900 text-red-300'
        }`}>
          {value === 'inflow' ? '↗' : '↘'}
        </span>
      ),
    },
    {
      key: 'description',
      title: 'Amount',
      width: 110,
      render: (value: string) => (
        <span className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} text-xs font-mono`}>{value}</span>
      ),
    },
    {
      key: 'from',
      title: 'From',
      width: 110,
      render: (value: string) => {
        const displayText = value === 'Unknown' ? value : truncateStringMiddle(value, 16);
        return (
          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-xs`} title={value}>{displayText}</span>
        );
      },
    },
    {
      key: 'to',
      title: 'To',
      width: 110,
      render: (value: string) => {
        const displayText = value === 'Unknown' ? value : truncateStringMiddle(value, 16);
        return (
          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-xs`} title={value}>{displayText}</span>
        );
      },
    },
    {
      key: 'usd',
      title: 'USD',
      width: 70,
      render: (value: string) => (
        <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-500'} text-xs`}>{value}</span>
      ),
    },
  ], [theme]);

  // Filtered tx data
  const filteredTx = useMemo(() => {
    // If no transactions are available, show some mock data for testing
    const transactionsToUse = transactions.length > 0 ? transactions : [
      {
        time: '2024-01-15 14:30:00',
        from: 'bc1qxy2kgdygjrsqtzqzn0yrf2493p83kkfjhx0wlh',
        to: 'bc1qxy2kgdygjrsqtzqzn0yrf2493p83kkfjhx0wlh',
        value: 0.00123456,
        token: 'BTC',
        usd: '$43.21',
        type: 'in' as const,
        txid: 'mock-tx-1',
        direction: 'inflow' as const,
        description: '0.00123456 BTC'
      },
      {
        time: '2024-01-14 09:15:00',
        from: 'bc1qxy2kgdygjrsqtzqzn0yrf2493p83kkfjhx0wlh',
        to: 'bc1qxy2kgdygjrsqtzqzn0yrf2493p83kkfjhx0wlh',
        value: 0.00087654,
        token: 'BTC',
        usd: '$30.68',
        type: 'out' as const,
        txid: 'mock-tx-2',
        direction: 'outflow' as const,
        description: '0.00087654 BTC'
      },
      {
        time: '2024-01-13 16:45:00',
        from: 'bc1qxy2kgdygjrsqtzqzn0yrf2493p83kkfjhx0wlh',
        to: 'bc1qxy2kgdygjrsqtzqzn0yrf2493p83kkfjhx0wlh',
        value: 0.00234567,
        token: 'BTC',
        usd: '$82.10',
        type: 'in' as const,
        txid: 'mock-tx-3',
        direction: 'inflow' as const,
        description: '0.00234567 BTC'
      }
    ];
    
    return txTab === 'all' ? transactionsToUse : transactionsToUse.filter(tx => tx.type === txTab);
  }, [transactions, txTab]);

  return (
    <div className="flex-1 min-w-[320px] flex flex-col justify-stretch">
      <Card 
        className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-2xl h-full flex flex-col`}
        title={
          <Title level={5} className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} m-0`}>Transaction History</Title>
        }
        extra={
          <Button 
            size="small"
            type="primary" 
            className="rounded-lg bg-blockscout-orange border-none"
            onClick={handleViewInBlockScout}
            disabled={!address}
          >
            View in BlockScout Explorer
          </Button>
        }
        headStyle={{ padding: '16px', borderBottom: 0 }}
        bodyStyle={{
          padding: '0',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className={`border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
          <Tabs 
            activeKey={txTab} 
            onChange={k => setTxTab(k as any)} 
            className={`
              px-4
              [&_.ant-tabs-nav]:mb-0
              [&_.ant-tabs-tab]:py-3
              [&_.ant-tabs-tab]:text-sm
              [&_.ant-tabs-tab-btn]:${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}
              [&_.ant-tabs-tab-btn]:hover:${theme === 'light' ? 'text-gray-900' : 'text-white'}
              [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-blockscout-orange
              [&_.ant-tabs-ink-bar]:bg-blockscout-orange
            `}
            items={[
              { key: 'all', label: 'All Transactions' },
              { key: 'in', label: 'Inflows (Received)' },
              { key: 'out', label: 'Outflows (Sent)' },
            ]} 
          />
        </div>
        
        <div className="flex-1 px-4 pt-4 pb-4 min-h-0">
          {error ? (
            <Alert
              message="Error loading transactions"
              description={error.message}
              type="error"
              showIcon
            />
          ) : (
            <DataTable
              data={filteredTx}
              columns={columns}
              loading={loading}
              searchable={false}
              pagination={true}
              pageSize={5}
              pageSizeOptions={[5, 8, 12]}
              emptyText="No transactions found"
              className="h-full"
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default TransactionHistory; 