import React, { useState } from 'react';
import { Card, Typography, Space, Button, Table, Tag } from 'antd';

const { Title } = Typography;

interface Counterparty {
  entity: string;
  risk: number;
  amount: string;
  txns: number;
  address: string;
}

interface TopCounterpartiesProps {
  incoming: Counterparty[];
  outgoing: Counterparty[];
}

const TopCounterparties: React.FC<TopCounterpartiesProps> = ({ incoming, outgoing }) => {
  const [counterpartyMode, setCounterpartyMode] = useState<'volume' | 'txns'>('volume');

  // Columns for tables
  const cpColumns = [
    { 
      title: 'Entity', 
      dataIndex: 'entity', 
      key: 'entity', 
      width: 110, 
      render: (text: string) => <span className="text-white">{text}</span> 
    },
    { 
      title: 'Risk', 
      dataIndex: 'risk', 
      key: 'risk', 
      width: 60, 
      render: (risk: number, row: any) => row.entity ? 
        <Tag color={risk > 80 ? 'red-500' : risk > 50 ? 'yellow-500' : 'green-500'} 
             className="min-w-[36px] text-center font-semibold">{risk}</Tag> : '' 
    },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      key: 'amount', 
      width: 90, 
      render: (amt: string, row: any) => row.entity ? <span className="text-white">{amt}</span> : '' 
    },
    { 
      title: 'Txns', 
      dataIndex: 'txns', 
      key: 'txns', 
      width: 60, 
      render: (txns: number, row: any) => row.entity ? <span className="text-gray-500">{txns} txns</span> : '' 
    },
  ];

  // Pad counterparties tables to have the same number of rows
  const maxRows = Math.max(incoming.length, outgoing.length);
  const paddedIncoming = [...incoming];
  const paddedOutgoing = [...outgoing];
  while (paddedIncoming.length < maxRows) paddedIncoming.push({ entity: '', risk: 0, amount: '', txns: 0, address: '' });
  while (paddedOutgoing.length < maxRows) paddedOutgoing.push({ entity: '', risk: 0, amount: '', txns: 0, address: '' });

  return (
    <div className="flex-1 min-w-[320px] flex flex-col justify-stretch">
      <Card className="bg-gray-800 rounded-2xl border-gray-700 h-full flex flex-col justify-stretch">
        <div className="flex justify-between items-center px-6 pt-6">
          <Title level={5} className="text-white m-0">Top Counterparties</Title>
          <Space>
            <Button 
              size="small" 
              type={counterpartyMode === 'volume' ? 'primary' : 'default'} 
              onClick={() => setCounterpartyMode('volume')} 
              className={`rounded-lg ${counterpartyMode === 'volume' ? 'bg-blockscout-orange' : 'bg-gray-700'} text-white border-none`}
            >
              By Volume
            </Button>
            <Button 
              size="small" 
              type={counterpartyMode === 'txns' ? 'primary' : 'default'} 
              onClick={() => setCounterpartyMode('txns')} 
              className={`rounded-lg ${counterpartyMode === 'txns' ? 'bg-blockscout-orange' : 'bg-gray-700'} text-white border-none`}
            >
              By Transactions
            </Button>
          </Space>
        </div>
        <div className="flex flex-1 p-6 gap-4 items-stretch">
          <div className="flex-1 flex flex-col">
            <div className="text-gray-500 mb-2">Incoming</div>
            <Table 
              columns={cpColumns} 
              dataSource={paddedIncoming} 
              pagination={false} 
              size="small" 
              className="bg-transparent" 
              rowKey={(idx) => `in-${idx}`} 
              bordered={false} 
              showHeader={true} 
              rowClassName="h-12"
              components={{
                header: {
                  cell: (props: any) => <th {...props} className="bg-gray-900 text-gray-500 font-semibold text-sm p-2" />,
                },
                body: {
                  cell: (props: any) => <td {...props} className="p-2 text-sm" />,
                },
              }}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="text-gray-500 mb-2">Outgoing</div>
            <Table 
              columns={cpColumns} 
              dataSource={paddedOutgoing} 
              pagination={false} 
              size="small" 
              className="bg-transparent" 
              rowKey={(_, idx) => `out-${idx}`} 
              bordered={false} 
              showHeader={true} 
              rowClassName="h-12"
              components={{
                header: {
                  cell: (props: any) => <th {...props} className="bg-gray-900 text-gray-500 font-semibold text-sm p-2" />,
                },
                body: {
                  cell: (props: any) => <td {...props} className="p-2 text-sm" />,
                },
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TopCounterparties; 