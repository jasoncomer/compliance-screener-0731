import React from 'react';

import { Button } from '@/components/ui/button';
import { Column,DataTable } from '@/components/ui/data-table';

import { MonitoredAddress } from '../../../../typings/compliance';

interface MonitoredAddressTableProps {
  addresses: MonitoredAddress[];
  loading: boolean;
  onEdit: (address: MonitoredAddress) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string) => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

const MonitoredAddressesTable: React.FC<MonitoredAddressTableProps> = ({
  addresses,
  loading,
  onEdit,
  onDelete,
  onViewHistory,
  pagination,
  onSort,
}) => {
  const columns: Column<MonitoredAddress>[] = [
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      sorter: true,
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      sorter: true,
    },
    {
      title: 'Client ID',
      dataIndex: 'clientId',
      key: 'clientId',
      sorter: true,
      render: (clientId: string) => clientId || 'N/A',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      sorter: true,
      render: (notes: string) => notes || 'N/A',
    },
    {
      title: 'Action',
      key: 'action',
      sorter: false,
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
      pagination={pagination ? {
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        onChange: pagination.onChange
      } : false}
      onChange={(_pagination: any, sorter: any) => {
        if (sorter && sorter.column && sorter.order && onSort) {
          const sortBy = sorter.field || sorter.columnKey;
          const sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
          onSort(sortBy as string, sortOrder);
        }
      }}
    />
  );
};

export default MonitoredAddressesTable; 