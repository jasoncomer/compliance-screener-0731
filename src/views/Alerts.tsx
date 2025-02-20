import React from 'react';
import { AlertOutlined } from '@ant-design/icons';
import ViewWrapper from '../components/ViewWrapper';
import { Typography, Table, Tag, Space } from 'antd';

const { Paragraph } = Typography;

interface Alert {
  id: string;
  type: 'transaction' | 'address' | 'entity';
  severity: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
}

const Alerts: React.FC = () => {
  // This would typically come from an API or state management
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'transaction',
      severity: 'high',
      message: 'Large transaction detected from flagged address',
      timestamp: new Date().toISOString(),
      status: 'new'
    },
    // Add more sample alerts as needed
  ];

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'transaction' ? 'blue' : type === 'address' ? 'green' : 'purple'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'green'}>
          {severity.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'new' ? 'red' : status === 'acknowledged' ? 'orange' : 'green'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
    },
  ];

  return (
    <ViewWrapper
      icon={<AlertOutlined />}
      title="Alerts"
    >
      <Paragraph>
        Monitor and manage alerts for suspicious blockchain activities, high-risk transactions,
        and potential security threats.
      </Paragraph>

      <Table
        dataSource={alerts}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </ViewWrapper>
  );
};

export default Alerts; 