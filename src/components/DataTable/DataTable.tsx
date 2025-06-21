import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from '@tanstack/react-table';
import { Table, Input, Select, Spin, Typography } from 'antd';
import { truncateStringMiddle } from '../../utils/generic';
import styles from './DataTable.module.css';

const { Title } = Typography;
const { Search } = Input;

// Generic interface for table data
export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  title?: string;
  loading?: boolean;
  error?: Error | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyText?: string;
  className?: string;
}

export function DataTable<TData>({
  data,
  columns,
  title,
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  pagination = true,
  pageSize = 5,
  pageSizeOptions = [5, 8, 12, 20, 50, 100],
  emptyText = "No data found",
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPaginationState,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      pagination: paginationState,
      globalFilter,
    },
  });

  return (
    <div className={`flex flex-col h-[270px] min-h-0 ${className}`}>
      {(title || searchable) && (
        <div className="flex justify-between items-center mb-3 flex-wrap gap-3 flex-shrink-0">
          {title && <Title level={5} className="text-white m-0">{title}</Title>}
          <div className="flex gap-2 items-center flex-wrap">
            {searchable && (
              <div className="min-w-[180px]">
                <Search
                  placeholder={searchPlaceholder}
                  allowClear
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  style={{ 
                    width: 250,
                  }}
                  className={styles.customSearch}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 flex-1 flex flex-col justify-center items-center">
          <Spin size="large" />
          <div className="text-gray-400 mt-3 text-sm">Loading data...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Table
            dataSource={table.getRowModel().rows.map((row, index) => ({ ...row.original, key: index }))}
            columns={[
              { 
                title: 'Time', 
                dataIndex: 'time', 
                key: 'time',
                width: 130,
                render: (time: string) => (
                  <span className="text-gray-500 text-xs">{time}</span>
                )
              },
              { 
                title: 'Direction', 
                dataIndex: 'direction', 
                key: 'direction',
                width: 70,
                render: (direction: string) => (
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
                width: 110,
                render: (description: string) => (
                  <span className="text-white text-xs font-mono">{description}</span>
                )
              },
              { 
                title: 'From', 
                dataIndex: 'from', 
                key: 'from',
                width: 110,
                render: (from: string) => {
                  const displayText = from === 'External' ? from : truncateStringMiddle(from, 16);
                  return (
                    <span className="text-gray-400 text-xs" title={from}>{displayText}</span>
                  );
                }
              },
              { 
                title: 'To', 
                dataIndex: 'to', 
                key: 'to',
                width: 110,
                render: (to: string) => {
                  const displayText = to === 'External' ? to : truncateStringMiddle(to, 16);
                  return (
                    <span className="text-gray-400 text-xs" title={to}>{displayText}</span>
                  );
                }
              },
              { 
                title: 'USD', 
                dataIndex: 'usd', 
                key: 'usd',
                width: 70,
                render: (usd: string) => (
                  <span className="text-gray-500 text-xs">{usd}</span>
                )
              },
            ]}
            size="small"
            bordered={false}
            showHeader={true}
            tableLayout="fixed"
            scroll={{ x: 600, y: 180 }}
            locale={{ emptyText }}
            className={`${styles.customTable} h-full`}
            pagination={pagination ? {
              current: table.getState().pagination.pageIndex + 1,
              pageSize: table.getState().pagination.pageSize,
              total: table.getFilteredRowModel().rows.length,
              onChange: (page, pageSize) => {
                table.setPageIndex(page - 1);
                table.setPageSize(pageSize);
              },
              showSizeChanger: false,
              showQuickJumper: false,
              className: styles.customPagination,
              showTotal: (total, range) => (
                <div className="flex items-center gap-4">
                  <span>{`${range[0]}-${range[1]} of ${total} items`}</span>
                  <Select
                    className={`min-w-[70px] ${styles.customSelect}`}
                    value={table.getState().pagination.pageSize}
                    onChange={(value) => table.setPageSize(Number(value))}
                    options={pageSizeOptions.map(size => ({ value: size, label: `${size} per page` }))}
                  />
                </div>
              ),
            } : false}
          />
        </div>
      )}
    </div>
  );
} 