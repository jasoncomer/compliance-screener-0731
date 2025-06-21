import React, { useState, useMemo } from 'react';
import { Card, Typography, Button, Tabs, Alert } from 'antd';
import { ColumnDef } from '@tanstack/react-table';
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
  const [txTab, setTxTab] = useState<'all' | 'in' | 'out'>('all');

  // Function to open BlockScout explorer
  const handleViewInBlockScout = () => {
    if (address) {
      // Open in the internal block explorer
      const blockExplorerUrl = `/home/block-explorer/address/${address}`;
      window.open(blockExplorerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Define columns using TanStack React Table
  const columns: ColumnDef<TransformedTransaction>[] = useMemo(() => [
    {
      accessorKey: 'time',
      header: 'Time',
      cell: ({ getValue }) => (
        <span className="text-gray-500 text-xs">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'direction',
      header: 'Direction',
      cell: ({ getValue }) => {
        const direction = getValue() as string;
        return (
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
            direction === 'inflow' 
              ? 'bg-green-900 text-green-300' 
              : 'bg-red-900 text-red-300'
          }`}>
            {direction === 'inflow' ? '↗' : '↘'}
          </span>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Amount',
      cell: ({ getValue }) => (
        <span className="text-white text-xs font-mono">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'from',
      header: 'From',
      cell: ({ getValue }) => {
        const from = getValue() as string;
        const displayText = from === 'Unknown' ? from : truncateStringMiddle(from, 16);
        return (
          <span className="text-gray-400 text-xs" title={from}>{displayText}</span>
        );
      },
    },
    {
      accessorKey: 'to',
      header: 'To',
      cell: ({ getValue }) => {
        const to = getValue() as string;
        const displayText = to === 'Unknown' ? to : truncateStringMiddle(to, 16);
        return (
          <span className="text-gray-400 text-xs" title={to}>{displayText}</span>
        );
      },
    },
    {
      accessorKey: 'usd',
      header: 'USD',
      cell: ({ getValue }) => (
        <span className="text-gray-500 text-xs">{getValue() as string}</span>
      ),
    },
  ], []);

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
        className="bg-gray-800 rounded-2xl border-gray-700 h-full flex flex-col"
        title={
          <Title level={5} className="text-white m-0">Transaction History</Title>
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
        <div className="border-b border-gray-700">
          <Tabs 
            activeKey={txTab} 
            onChange={k => setTxTab(k as any)} 
            className="
              px-4
              [&_.ant-tabs-nav]:mb-0
              [&_.ant-tabs-tab]:py-3
              [&_.ant-tabs-tab]:text-sm
              [&_.ant-tabs-tab-btn]:text-gray-400 
              [&_.ant-tabs-tab-btn]:hover:text-white
              [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-blockscout-orange
              [&_.ant-tabs-ink-bar]:bg-blockscout-orange
            "
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