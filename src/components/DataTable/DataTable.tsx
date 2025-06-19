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
import styled from 'styled-components';
import { truncateStringMiddle } from '../../utils/generic';

const { Title } = Typography;
const { Search } = Input;

// Styled components
const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  
  .ant-table {
    background: transparent;
    flex: 1;
    overflow: hidden;
    
    .ant-table-thead > tr > th {
      background: #374151;
      border-bottom: 1px solid #4b5563;
      color: #d1d5db;
      font-weight: 600;
      padding: 8px 12px;
      font-size: 12px;
      
      &:hover {
        background: #4b5563;
      }
    }
    
    .ant-table-tbody > tr > td {
      background: transparent;
      border-bottom: 1px solid #374151;
      color: #e5e7eb;
      padding: 6px 12px;
      font-size: 12px;
      
      &:hover {
        background: #374151;
      }
    }
    
    .ant-table-tbody > tr:hover > td {
      background: #374151;
    }
    
    .ant-table-container {
      height: 100%;
    }
    
    .ant-table-body {
      overflow-y: auto;
      max-height: calc(100vh - 400px);
    }
  }
  
  .ant-pagination {
    margin-top: 12px;
    flex-shrink: 0;
    
    .ant-pagination-item {
      background: #374151;
      border: 1px solid #4b5563;
      
      a {
        color: #e5e7eb;
      }
      
      &:hover {
        border-color: #60a5fa;
        
        a {
          color: #60a5fa;
        }
      }
      
      &.ant-pagination-item-active {
        background: #3b82f6;
        border-color: #3b82f6;
        
        a {
          color: white;
        }
      }
    }
    
    .ant-pagination-prev,
    .ant-pagination-next {
      background: #374151;
      border: 1px solid #4b5563;
      color: #e5e7eb;
      
      &:hover {
        border-color: #60a5fa;
        color: #60a5fa;
      }
    }
  }
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
`;

const TableControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchContainer = styled.div`
  min-width: 180px;
  
  .ant-input-search {
    .ant-input {
      background: #1f2937;
      border: 1px solid #374151;
      color: #fff;
      border-radius: 6px;
      font-size: 12px;
      
      &:hover, &:focus {
        border-color: #60a5fa;
        box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
      }
      
      &::placeholder {
        color: #9ca3af;
      }
    }
    
    .ant-input-search-button {
      background: #3b82f6;
      border: 1px solid #3b82f6;
      border-radius: 6px;
      
      &:hover {
        background: #2563eb;
        border-color: #2563eb;
      }
    }
  }
`;

const PageSizeSelect = styled(Select)`
  min-width: 70px;
  
  .ant-select-selector {
    background: #1f2937 !important;
    border: 1px solid #374151 !important;
    color: #fff !important;
    border-radius: 6px !important;
    font-size: 12px !important;
  }
  
  .ant-select-arrow {
    color: #9ca3af;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 40px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  
  .ant-spin-text {
    color: #9ca3af;
    margin-top: 12px;
    font-size: 14px;
  }
`;

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
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
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
    <TableContainer className={className}>
      {(title || searchable) && (
        <TableHeader>
          {title && <Title level={5} style={{ color: '#fff', margin: 0 }}>{title}</Title>}
          <TableControls>
            {searchable && (
              <SearchContainer>
                <Search
                  placeholder={searchPlaceholder}
                  allowClear
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  style={{ width: 250 }}
                />
              </SearchContainer>
            )}
          </TableControls>
        </TableHeader>
      )}

      {loading ? (
        <LoadingContainer>
          <Spin size="large" />
          <div className="ant-spin-text">Loading data...</div>
        </LoadingContainer>
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
            scroll={{ x: 600, y: 'calc(100vh - 450px)' }}
            locale={{ emptyText }}
            pagination={pagination ? {
              current: table.getState().pagination.pageIndex + 1,
              pageSize: table.getState().pagination.pageSize,
              total: table.getFilteredRowModel().rows.length,
              onChange: (page, pageSize) => {
                table.setPageIndex(page - 1);
                table.setPageSize(pageSize);
              },
              showSizeChanger: false, // We handle this with the select below
              showQuickJumper: false,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            } : false}
            className="h-full"
          />
          {pagination && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '12px', padding: '0 12px' }}>
              <PageSizeSelect
                value={table.getState().pagination.pageSize}
                onChange={(value) => table.setPageSize(Number(value))}
                options={pageSizeOptions.map(size => ({ value: size, label: `${size} per page` }))}
                style={{ minWidth: '100px' }}
              />
            </div>
          )}
        </div>
      )}
    </TableContainer>
  );
} 