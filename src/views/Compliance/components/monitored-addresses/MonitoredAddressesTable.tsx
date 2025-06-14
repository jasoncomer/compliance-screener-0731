import React from 'react';
import { Table, Button, Space } from 'antd';
import { MonitoredAddress } from '../../../../typings/compliance';

interface MonitoredAddressTableProps {
  addresses: MonitoredAddress[];
  loading: boolean;
  onEdit: (address: MonitoredAddress) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string) => void;
}

const MonitoredAddressesTable: React.FC<MonitoredAddressTableProps> = ({
  addresses,
  loading,
  onEdit,
  onDelete,
  onViewHistory,
}) => {
  console.log('addresses', addresses);
  const columns = [
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
    },
    {
      title: 'Client ID',
      dataIndex: 'clientId',
      key: 'clientId',
      render: (clientId: string) => clientId || 'N/A',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => notes || 'N/A',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: MonitoredAddress) => (
        <Space size="small">
          <Button type="link" size='small' onClick={() => onEdit(record)}>Edit</Button>
          <Button type="link" size='small' onClick={() => onViewHistory(record._id)}>History</Button>
          <Button type="link" size='small' danger onClick={() => onDelete(record._id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={Array.isArray(addresses) ? addresses : []}
      columns={columns}
      rowKey="_id"
      loading={loading}
    />
  );
};

export default MonitoredAddressesTable; 