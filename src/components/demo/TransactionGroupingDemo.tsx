/**
 * Demo component to showcase transaction grouping functionality
 * This component demonstrates how rows with the same TXID are visually grouped
 */

import React, { useState } from 'react';
import { Table, Button, Space, Card, Typography } from 'antd';
import { getTransactionGroupClassWithHover, getTransactionColorIndex } from '../../utils/transactionGrouping';
import '../../styles/transactionGrouping.css';

const { Title, Text } = Typography;

interface DemoTransaction {
  id: string;
  txId: string;
  amount: number;
  counterparty: string;
  status: string;
  timestamp: string;
}

// Sample data with multiple transactions sharing the same TXID
const sampleData: DemoTransaction[] = [
  // Transaction Group 1 - TXID: abc123
  { id: '1', txId: 'abc123', amount: 1000, counterparty: 'Alice', status: 'Completed', timestamp: '2024-01-01 10:00:00' },
  { id: '2', txId: 'abc123', amount: 500, counterparty: 'Bob', status: 'Completed', timestamp: '2024-01-01 10:01:00' },
  { id: '3', txId: 'abc123', amount: 300, counterparty: 'Charlie', status: 'Completed', timestamp: '2024-01-01 10:02:00' },
  
  // Transaction Group 2 - TXID: def456
  { id: '4', txId: 'def456', amount: 2000, counterparty: 'David', status: 'Pending', timestamp: '2024-01-01 11:00:00' },
  { id: '5', txId: 'def456', amount: 750, counterparty: 'Eve', status: 'Pending', timestamp: '2024-01-01 11:01:00' },
  
  // Transaction Group 3 - TXID: ghi789
  { id: '6', txId: 'ghi789', amount: 1500, counterparty: 'Frank', status: 'Failed', timestamp: '2024-01-01 12:00:00' },
  { id: '7', txId: 'ghi789', amount: 250, counterparty: 'Grace', status: 'Failed', timestamp: '2024-01-01 12:01:00' },
  { id: '8', txId: 'ghi789', amount: 800, counterparty: 'Henry', status: 'Failed', timestamp: '2024-01-01 12:02:00' },
  { id: '9', txId: 'ghi789', amount: 1200, counterparty: 'Ivy', status: 'Failed', timestamp: '2024-01-01 12:03:00' },
  
  // Transaction Group 4 - TXID: jkl012
  { id: '10', txId: 'jkl012', amount: 3000, counterparty: 'Jack', status: 'Completed', timestamp: '2024-01-01 13:00:00' },
  { id: '11', txId: 'jkl012', amount: 150, counterparty: 'Kate', status: 'Completed', timestamp: '2024-01-01 13:01:00' },
  
  // Transaction Group 5 - TXID: mno345 (will cycle back to color 0)
  { id: '12', txId: 'mno345', amount: 900, counterparty: 'Liam', status: 'Pending', timestamp: '2024-01-01 14:00:00' },
  { id: '13', txId: 'mno345', amount: 600, counterparty: 'Maya', status: 'Pending', timestamp: '2024-01-01 14:01:00' },
];

const TransactionGroupingDemo: React.FC = () => {
  const [showColorInfo, setShowColorInfo] = useState(false);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Transaction ID',
      dataIndex: 'txId',
      key: 'txId',
      width: 120,
      render: (txId: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {txId}
        </Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => `$${amount.toLocaleString()}`,
    },
    {
      title: 'Counterparty',
      dataIndex: 'counterparty',
      key: 'counterparty',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'Completed' ? 'green' : status === 'Pending' ? 'orange' : 'red';
        return <Text style={{ color }}>{status}</Text>;
      },
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
    },
    {
      title: 'Color Index',
      key: 'colorIndex',
      width: 100,
      render: (_: any, record: DemoTransaction) => {
        const colorIndex = getTransactionColorIndex(record.txId);
        return (
          <Text style={{ 
            color: `hsl(${colorIndex * 90}, 70%, 50%)`,
            fontWeight: 'bold'
          }}>
            {colorIndex}
          </Text>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>Transaction Grouping Demo</Title>
        <Text>
          This demo shows how rows with the same Transaction ID (TXID) are visually grouped using alternating background colors.
          Each unique TXID gets a consistent color, making it easy to identify related transactions.
        </Text>
        
        <div style={{ margin: '20px 0' }}>
          <Space>
            <Button 
              type="primary" 
              onClick={() => setShowColorInfo(!showColorInfo)}
            >
              {showColorInfo ? 'Hide' : 'Show'} Color Information
            </Button>
          </Space>
        </div>

        {showColorInfo && (
          <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#f5f5f5' }}>
            <Title level={4}>Color Grouping Information</Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div 
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: i === 0 ? '#ffffff' : i === 1 ? '#f8f9fa' : i === 2 ? '#f1f3f4' : '#e8eaed',
                      border: '1px solid #ccc',
                      borderRadius: '3px'
                    }} 
                  />
                  <Text>Group {i}: Light background</Text>
                </div>
              ))}
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '10px' }}>
              Hover over any row to see the hover effect. Rows with the same TXID will have the same background color.
            </Text>
          </Card>
        )}

        <Table
          dataSource={sampleData}
          columns={columns}
          rowKey="id"
          rowClassName={(record) => getTransactionGroupClassWithHover(record.txId)}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          style={{ marginTop: '20px' }}
        />

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
          <Title level={4}>How it works:</Title>
          <ul>
            <li>Each unique Transaction ID gets assigned a consistent color index (0-3)</li>
            <li>All rows with the same TXID share the same background color</li>
            <li>Colors cycle through 4 subtle variations for visual distinction</li>
            <li>Hover effects highlight related rows from the same transaction</li>
            <li>Works in both light and dark themes</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default TransactionGroupingDemo;