import React, { useState, useMemo } from 'react';
import { Card, Typography, Space, Button, Table, Tooltip, Modal, Tabs } from 'antd';

import { TransformedTransaction } from '../../../../utils/transactionTransformers';

const { Title, Text } = Typography;

interface Counterparty {
  entity: string;
  direction: 'inflow' | 'outflow';
  amount: string;
  txns: number;
  address: string;
}

interface TopCounterpartiesProps {
  incoming: Counterparty[];
  outgoing: Counterparty[];
  onCounterpartyClick?: (address: string) => void;
  transactions?: TransformedTransaction[];
}

const TopCounterparties: React.FC<TopCounterpartiesProps> = ({ 
  incoming, 
  outgoing, 
  onCounterpartyClick,
  transactions = []
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [counterpartyMode, setCounterpartyMode] = useState<'volume' | 'txns'>('volume');
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Get transactions for a specific counterparty
  const getCounterpartyTransactions = (address: string) => {
    return transactions.filter(tx => 
      (tx.type === 'in' && tx.from === address) || 
      (tx.type === 'out' && tx.to === address)
    );
  };

  // Handle row click to show transaction details
  const handleRowClick = (record: Counterparty) => {
    if (record.entity && record.address) {
      setSelectedCounterparty(record);
      setModalVisible(true);
    }
  };

  const transactionColumns = [
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: 150,
      render: (text: string) => <span className="text-gray-400 text-xs">{text}</span>
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
      key: 'direction',
      width: 70,
      render: (direction: 'inflow' | 'outflow') => (
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
            direction === 'inflow' 
              ? 'bg-green-900 text-green-300' 
              : 'bg-red-900 text-red-300'
          }`}>
            {direction === 'inflow' ? '↗' : '↘'}
          </span>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <span className="text-white text-xs font-mono">{text}</span>
    },
    {
        title: 'USD Value',
        dataIndex: 'usd',
        key: 'usd',
        render: (text: string) => <span className="text-gray-400 text-xs">{text}</span>
    }
  ];

  // Columns for tables - similar to DataTable structure
  const cpColumns = [
    { 
      title: 'Entity', 
      dataIndex: 'entity', 
      key: 'entity', 
      width: 150,
      render: (text: string, row: any) => {
        if (!row.entity) return <span className="text-gray-500 text-xs">-</span>;
        
        return (
          <Tooltip 
            title={`Address: ${row.address}`}
            placement="top"
          >
            <span 
              className="text-white text-xs cursor-pointer hover:text-blockscout-orange transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onCounterpartyClick?.(row.address);
              }}
              title={`Click to view ${text} address`}
            >
              {text}
            </span>
          </Tooltip>
        );
      }
    },
    { 
      title: 'Direction', 
      dataIndex: 'direction', 
      key: 'direction', 
      width: 80,
      render: (direction: 'inflow' | 'outflow', row: any) => {
        if (!row.entity) return <span className="text-gray-500 text-xs">-</span>;
        
        return (
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
            direction === 'inflow' 
              ? 'bg-green-900 text-green-300' 
              : 'bg-red-900 text-red-300'
          }`}>
            {direction === 'inflow' ? '↗' : '↘'}
          </span>
        );
      }
    },
    { 
      title: 'USD', 
      dataIndex: 'amount', 
      key: 'amount', 
      width: 80,
      render: (amt: string, row: any) => {
        if (!row.entity) return <span className="text-gray-500 text-xs">-</span>;
        return <span className="text-gray-500 text-xs font-mono">{amt}</span>;
      }
    },
    { 
      title: 'Txns', 
      dataIndex: 'txns', 
      key: 'txns', 
      width: 60,
      render: (txns: number, row: any) => {
        if (!row.entity) return <span className="text-gray-500 text-xs">-</span>;
        return <span className="text-gray-400 text-xs">{txns} txns</span>;
      }
    },
  ];

  const allCounterparties = useMemo(() => {
    return [...incoming, ...outgoing].sort((a, b) => {
      if (counterpartyMode === 'volume') {
        const aAmount = parseFloat(a.amount.replace(/[$,]/g, ''));
        const bAmount = parseFloat(b.amount.replace(/[$,]/g, ''));
        return bAmount - aAmount;
      }
      return b.txns - a.txns;
    });
  }, [incoming, outgoing, counterpartyMode]);

  const filteredData = useMemo(() => {
    switch(activeTab) {
      case 'inflow':
        return allCounterparties.filter(c => c.direction === 'inflow');
      case 'outflow':
        return allCounterparties.filter(c => c.direction === 'outflow');
      case 'all':
      default:
        return allCounterparties;
    }
  }, [activeTab, allCounterparties]);

  return (
    <div className="flex-1 min-w-[320px] flex flex-col justify-stretch">
      <Card
        className="bg-gray-800 rounded-2xl border-gray-700 h-full flex flex-col"
        title={
          <Title level={5} className="text-white m-0">
            Top Counterparties
          </Title>
        }
        extra={
          <Space>
            <Button
              size="small"
              type={counterpartyMode === 'volume' ? 'primary' : 'default'}
              onClick={() => setCounterpartyMode('volume')}
              className={`rounded-lg ${
                counterpartyMode === 'volume'
                  ? 'bg-blockscout-orange'
                  : 'bg-gray-700'
              } text-white border-none`}
            >
              By Volume
            </Button>
            <Button
              size="small"
              type={counterpartyMode === 'txns' ? 'primary' : 'default'}
              onClick={() => setCounterpartyMode('txns')}
              className={`rounded-lg ${
                counterpartyMode === 'txns'
                  ? 'bg-blockscout-orange'
                  : 'bg-gray-700'
              } text-white border-none`}
            >
              By Transactions
            </Button>
          </Space>
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
              activeKey={activeTab} 
              onChange={setActiveTab} 
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
                { key: 'all', label: `All (${allCounterparties.length})` },
                { key: 'inflow', label: `Inflow (${incoming.length})` },
                { key: 'outflow', label: `Outflow (${outgoing.length})` },
              ]} 
            />
        </div>
        <div className="flex-1 px-4 pt-4 pb-4 min-h-0">
          <Table
            columns={cpColumns}
            dataSource={filteredData}
            pagination={false}
            size="small"
            rowKey={(r) => `${r.address}-${r.direction}`}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
            })}
            tableLayout="fixed"
            scroll={{ y: 200 }}
            rowClassName="h-8 cursor-pointer hover:bg-gray-700"
            components={{
              header: {
                cell: (props: any) => <th {...props} className="bg-gray-900 text-gray-500 font-semibold text-xs p-2" />,
              },
              body: {
                cell: (props: any) => <td {...props} className="p-2 text-xs border-b border-gray-700" />,
              },
            }}
          />
        </div>
      </Card>
      
      {/* Transaction Details Modal */}
      <Modal
        title={`Transactions with ${selectedCounterparty?.entity}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="view" 
            type="primary" 
            onClick={() => {
              if (selectedCounterparty?.address) {
                onCounterpartyClick?.(selectedCounterparty.address);
                setModalVisible(false);
              }
            }}
          >
            View Address
          </Button>
        ]}
        width={800}
      >
        {selectedCounterparty && (
          <div className="space-y-6">
            <div className="bg-gray-900 p-4 rounded-lg grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <Text className="text-gray-400 block text-sm">Entity</Text>
                <Text className="text-white text-base">{selectedCounterparty.entity}</Text>
              </div>
              <div>
                <Text className="text-gray-400 block text-sm">Total Amount</Text>
                <Text className="text-white text-base font-mono">{selectedCounterparty.amount}</Text>
              </div>
              <div>
                <Text className="text-gray-400 block text-sm">Address</Text>
                <Text className="text-white text-base font-mono">{selectedCounterparty.address}</Text>
              </div>
              <div>
                <Text className="text-gray-400 block text-sm">Transactions</Text>
                <Text className="text-white text-base">{selectedCounterparty.txns}</Text>
              </div>
            </div>
            
            <div>
              <Title level={5} className="text-white mb-3">Recent Transactions</Title>
              <Table
                columns={transactionColumns}
                dataSource={getCounterpartyTransactions(selectedCounterparty.address)}
                pagination={{ pageSize: 4, size: 'small' }}
                size="small"
                rowKey="txid"
                className="bg-transparent"
                components={{
                  header: {
                    cell: (props: any) => <th {...props} className="bg-gray-900 text-gray-500 font-semibold text-xs p-2" />,
                  },
                  body: {
                    cell: (props: any) => <td {...props} className="p-2 text-xs border-b border-gray-700" />,
                  },
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TopCounterparties; 