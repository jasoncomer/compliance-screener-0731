import React, { useState, useEffect } from 'react';
import { Form, Button, Select, Input, DatePicker, Card } from 'antd';
import { FilterOutlined, ClearOutlined, FileSearchOutlined } from '@ant-design/icons';
import { EComplianceTransactionStatus, TransactionFilters } from '../../../../typings/compliance';
import { cn } from '../../../../lib/utils';
import ActiveCasesTable from '../active-cases/ActiveCasesTable';
import { selectCurrentOrganization } from '../../../../store/slices/organizationsSlice';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { 
  fetchComplianceTransactions, 
  selectCompletedTransactions,
  selectPagination, 
  selectIsLoading,
  selectComplianceFilters,
  setFilters,
  setPage,
  setLimit
} from '../../../../store/slices/complianceTransactionsSlice';

const { RangePicker } = DatePicker;

interface ArchivedCasesTabProps {
  isActive: boolean;
  className?: string;
}

const ARCHIVED_STATUSES = [
  EComplianceTransactionStatus.APPROVED,
  EComplianceTransactionStatus.CLOSED_WITH_NOTE,
  EComplianceTransactionStatus.CLOSED_WITH_SAR
];

const ArchivedCasesTab: React.FC<ArchivedCasesTabProps> = ({ isActive, className }) => {
  const organization = useAppSelector(selectCurrentOrganization);
  const dispatch = useAppDispatch();
  
  // Use Redux store data
  const transactions = useAppSelector(selectCompletedTransactions);
  const { total: totalTransactions, page: currentPage, limit: pageSize } = useAppSelector(selectPagination);
  const loading = useAppSelector(selectIsLoading);
  const filters = useAppSelector(selectComplianceFilters);
  
  const [form] = Form.useForm();
  
  // Track available filter options
  const [availableBlockchains, setAvailableBlockchains] = useState<string[]>([]);
  const [availableClientIds, setAvailableClientIds] = useState<string[]>([]);

  // Load transactions from Redux store
  useEffect(() => {
    if (!isActive) return;

    const mergedFilters = { 
      ...filters,
      page: currentPage,
      limit: pageSize,
      status: filters.status || ARCHIVED_STATUSES.join(',')
    };
    dispatch(fetchComplianceTransactions(mergedFilters));
  }, [dispatch, filters, organization, currentPage, pageSize, isActive]);

  // Extract unique filter options from transaction data
  useEffect(() => {
    if (transactions.length > 0) {
      // Extract unique blockchains
      const blockchains = [...new Set(transactions.map(tx => tx.blockchain))];
      setAvailableBlockchains(blockchains);
      
      // Extract unique client IDs
      const clientIds = [...new Set(transactions.map(tx => tx.clientId))];
      setAvailableClientIds(clientIds);
    }
  }, [transactions]);

  // Handle table change (pagination, sorting)
  const handleTableChange = (pagination: any) => {
    dispatch(setPage(pagination.current));
    dispatch(setLimit(pagination.pageSize));
  };

  // Clear all filters
  const handleClearFilters = () => {
    form.resetFields();
    dispatch(setFilters({
      page: 1,
      limit: pageSize,
      status: ARCHIVED_STATUSES.join(',')
    }));
  };

  // Handle filter submit
  const handleFilterSubmit = (values: any) => {
    const { dateRange, minAmount, maxAmount, ...rest } = values;
    const newFilters: TransactionFilters = {
      ...filters,
      ...rest,
      page: 1,
      limit: pageSize
    };

    // If no specific status is selected, show all archived statuses
    if (!values.status) {
      newFilters.status = ARCHIVED_STATUSES.join(',');
    }

    // Date range filter
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      newFilters.timestamp = {
        from: startDate.toISOString(),
        to: endDate.toISOString()
      };
    } else {
      delete newFilters.timestamp;
    }

    // Amount filters
    if (minAmount) {
      newFilters.minAmount = parseFloat(minAmount) * 100000000; // Convert to satoshis
    } else {
      delete newFilters.minAmount;
    }
    
    if (maxAmount) {
      newFilters.maxAmount = parseFloat(maxAmount) * 100000000; // Convert to satoshis
    } else {
      delete newFilters.maxAmount;
    }

    // Clean up undefined values
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key as keyof TransactionFilters] === undefined) {
        delete newFilters[key as keyof TransactionFilters];
      }
    });

    dispatch(setFilters(newFilters));
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-black dark:text-white">
          <FileSearchOutlined className="mr-2" />
          Archived Cases Management ({totalTransactions})
        </h3>
        <div>
          <span className="mr-2.5 text-brand-primary-dark dark:text-white">
            Total Archived Cases: <strong>{totalTransactions}</strong>
          </span>
        </div>
      </div>
      
      {/* Filter Panel */}
      <Card 
        title={<><FilterOutlined /> Filters</>}
        style={{ marginBottom: 16 }}
        size="small"
        extra={
          <Button 
            icon={<ClearOutlined />} 
            onClick={handleClearFilters}
            size="small"
          >
            Clear
          </Button>
        }
      >
        <Form
          form={form}
          layout="inline"
          onFinish={handleFilterSubmit}
          style={{ display: 'flex', flexWrap: 'wrap' }}
        >
          <Form.Item name="status" style={{ minWidth: 120, marginBottom: 8 }}>
            <Select 
              placeholder="Status"
              allowClear
              size="small"
              style={{ width: 150 }}
              onChange={(value) => handleFilterSubmit({ status: value })}
            >
              <Select.Option value={EComplianceTransactionStatus.APPROVED}>Approved</Select.Option>
              <Select.Option value={EComplianceTransactionStatus.CLOSED_WITH_NOTE}>Closed with note</Select.Option>
              <Select.Option value={EComplianceTransactionStatus.CLOSED_WITH_SAR}>Closed with SAR</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="blockchain" style={{ minWidth: 120, marginBottom: 8 }}>
            <Select 
              placeholder="Blockchain"
              allowClear
              size="small"
            >
              {availableBlockchains.map(blockchain => (
                <Select.Option key={blockchain} value={blockchain}>
                  {blockchain.charAt(0).toUpperCase() + blockchain.slice(1)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="clientId" style={{ minWidth: 110, marginBottom: 8 }}>
            <Select 
              placeholder="Client ID"
              allowClear
              size="small"
            >
              {availableClientIds.map(clientId => (
                <Select.Option key={clientId} value={clientId}>
                  {clientId}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="dateRange" style={{ marginBottom: 8 }}>
            <RangePicker 
              size="small" 
              placeholder={['From date', 'To date']} 
              onChange={(dates) => {
                const values = form.getFieldsValue();
                values.dateRange = dates;
                handleFilterSubmit(values);
              }}
            />
          </Form.Item>
          
          <Form.Item name="riskLevel" style={{ minWidth: 120, marginBottom: 8 }}>
            <Select 
              placeholder="Risk level"
              allowClear
              size="small"
            >
              <Select.Option value="high">High ({'>'}70)</Select.Option>
              <Select.Option value="medium">Medium (41-70)</Select.Option>
              <Select.Option value="low">Low ({'≤'}40)</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="minAmount" style={{ width: 100, marginBottom: 8 }}>
            <Input type="number" placeholder="Min BTC" step="0.0001" min="0" size="small" />
          </Form.Item>
          
          <Form.Item name="maxAmount" style={{ width: 100, marginBottom: 8 }}>
            <Input type="number" placeholder="Max BTC" step="0.0001" min="0" size="small" />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" size="small">
              Apply
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      <ActiveCasesTable
        transactions={transactions}
        totalTransactions={totalTransactions}
        currentPage={currentPage}
        pageSize={pageSize}
        loading={loading}
        onTableChange={handleTableChange}
        isArchivedTab={true}
      />
    </div>
  );
};

export default ArchivedCasesTab; 