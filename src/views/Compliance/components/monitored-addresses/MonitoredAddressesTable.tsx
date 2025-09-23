import React from 'react';

import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';

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
  const columns: Column<MonitoredAddress>[] = [
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
        <div className="flex items-center gap-2">
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-primary"
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-primary"
            onClick={() => onViewHistory(record._id)}
          >
            History
          </Button>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-destructive"
            onClick={() => onDelete(record._id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      dataSource={Array.isArray(addresses) ? addresses : []}
      columns={columns}
      rowKey="_id"
      loading={loading}
    />
  );
};

export default MonitoredAddressesTable; 