import React, { useEffect,useState } from 'react';

import { ClearOutlined, FileSearchOutlined,FilterOutlined } from '@ant-design/icons';
import { Button, Card,DatePicker, Form, Input, Select } from 'antd';

import ErrorBoundary from '../../../../components/ErrorBoundary';
import { cn } from '../../../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { 
  fetchComplianceTransactions, 
  selectActiveTransactions,
  selectComplianceFilters,
  selectIsLoading,
  selectPagination, 
  setFilters,
  setLimit,
  setPage} from '../../../../store/slices/complianceTransactionsSlice';
import { selectActiveOrgMembers,selectCurrentOrganization } from '../../../../store/slices/organizationsSlice';
import { EComplianceTransactionStatus, TransactionFilters } from '../../../../typings/compliance';
import { getUserDisplayName } from '../../../../utils/display-labels';

import ActiveCasesTable from './ActiveCasesTable';

const { RangePicker } = DatePicker;

interface ActiveCasesTabProps {
  isActive: boolean;
  className?: string;
}

const ActiveCasesTab: React.FC<ActiveCasesTabProps> = ({ isActive, className }) => {
  const organization = useAppSelector(selectCurrentOrganization);
  const organizationMembers = useAppSelector(selectActiveOrgMembers);
  const dispatch = useAppDispatch();
  
  // Use Redux store data
  const transactions = useAppSelector(selectActiveTransactions);
  const { total: totalTransactions, page: currentPage, limit: pageSize } = useAppSelector(selectPagination);
  const loading = useAppSelector(selectIsLoading);
  const filters = useAppSelector(selectComplianceFilters);
  
  const [form] = Form.useForm();
  
  // Track available filter options
  const [availableBlockchains, setAvailableBlockchains] = useState<string[]>([]);

  // Validate and sanitize transactions data
  const validatedTransactions = React.useMemo(() => {
    if (!Array.isArray(transactions)) {
      console.warn('Transactions is not an array:', transactions);
      return [];
    }
    
    return transactions.filter(tx => {
      if (!tx || typeof tx !== 'object') {
        console.warn('Invalid transaction object:', tx);
        return false;
      }
      
      if (!tx._id || typeof tx._id !== 'string') {
        console.warn('Transaction missing _id:', tx);
        return false;
      }
      
      return true;
    });
  }, [transactions]);

  // Load transactions from Redux store
  useEffect(() => {
    if (!isActive) return;

    // Define default active statuses for this tab (only when no status filter is set)
    const defaultActiveStatuses = [
      EComplianceTransactionStatus.UNREVIEWED,
      EComplianceTransactionStatus.IN_REVIEW,
      EComplianceTransactionStatus.HOLD
    ];

    const mergedFilters = { 
      ...filters,
      status: filters.status || defaultActiveStatuses.join(','), // Use default only if no status filter is set
      page: currentPage,
      limit: pageSize
    };
    dispatch(fetchComplianceTransactions(mergedFilters));
  }, [dispatch, filters, organization, currentPage, pageSize, isActive]);

  // Extract unique filter options from transaction data
  useEffect(() => {
    if (validatedTransactions.length > 0) {
      // Extract unique blockchains
      const blockchains = [...new Set(validatedTransactions.map(tx => tx.blockchain).filter(Boolean))];
      setAvailableBlockchains(blockchains);
    }
  }, [validatedTransactions]);

  // Handle table change (pagination, sorting)
  const handleTableChange = (pagination: any) => {
    dispatch(setPage(pagination.current));
    dispatch(setLimit(pagination.pageSize));
  };

  // Clear all filters
  const handleClearFilters = () => {
    form.resetFields();
    const defaultActiveStatuses = [
      EComplianceTransactionStatus.UNREVIEWED,
      EComplianceTransactionStatus.IN_REVIEW,
      EComplianceTransactionStatus.HOLD
    ];
    dispatch(setFilters({
      page: 1,
      limit: pageSize,
      status: defaultActiveStatuses.join(',') // Reset to default active statuses when clearing
    }));
  };
  
  // Handle filter form submission
  const handleFilterSubmit = (values: Record<string, any>) => {
    // Create new filter object
    const newFilters: TransactionFilters = {
      ...filters,
      page: 1, // Reset to first page when applying new filters
    };
    
    // Add form filters
    if (values.status) {
      newFilters.status = values.status;
    } else {
      delete newFilters.status;
    }

    if (values.blockchain) {
      newFilters.blockchain = values.blockchain;
    } else {
      delete newFilters.blockchain;
    }
    
    if (values.clientId) {
      newFilters.clientId = values.clientId;
    } else {
      delete newFilters.clientId;
    }
    
    if (values.txId) {
      newFilters.txId = values.txId;
      console.log('Adding txId filter:', values.txId);
    } else {
      delete newFilters.txId;
      console.log('Removing txId filter');
    }
    
    // Date range filter
    if (values.dateRange && values.dateRange.length === 2 && values.dateRange[0] && values.dateRange[1]) {
      const startDate = values.dateRange[0].startOf('day');
      const endDate = values.dateRange[1].endOf('day');
      
      newFilters.timestamp = {
        from: startDate.toISOString(),
        to: endDate.toISOString()
      };
    } else {
      delete newFilters.timestamp;
    }
    
    // Amount filters
    if (values.minAmount) {
      newFilters.minAmount = parseFloat(values.minAmount) * 100000000; // Convert to satoshis
    } else {
      delete newFilters.minAmount;
    }
    
    if (values.maxAmount) {
      newFilters.maxAmount = parseFloat(values.maxAmount) * 100000000; // Convert to satoshis
    } else {
      delete newFilters.maxAmount;
    }
    
    // Risk level filter
    if (values.riskLevel) {
      newFilters.riskLevel = values.riskLevel;
    } else {
      delete newFilters.riskLevel;
    }
    
    // Assigned To filter
    if (values.assignedTo) {
      newFilters.assignedTo = values.assignedTo;
    } else {
      delete newFilters.assignedTo;
    }
    
    console.log('Dispatching filters to API:', newFilters);
    dispatch(setFilters(newFilters));
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-gray-300">
        <h3 className="m-0 text-black dark:text-white">
          <FileSearchOutlined className="mr-2" />
          Active Cases Management ({totalTransactions})
        </h3>
        <div className="flex items-center">
          <div className="w-px h-6 bg-gray-400 mx-4"></div>
          <span className="mr-2.5 text-brand-primary-dark dark:text-white">
            Total Active Cases: <strong>{totalTransactions}</strong>
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
            Clear Filters
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
              <Select.Option value={EComplianceTransactionStatus.UNREVIEWED}>Unreviewed</Select.Option>
              <Select.Option value={EComplianceTransactionStatus.IN_REVIEW}>In Review</Select.Option>
              <Select.Option value={EComplianceTransactionStatus.HOLD}>Hold</Select.Option>
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
          
          <Form.Item name="clientId" style={{ minWidth: 150, marginBottom: 8 }}>
            <Input 
              placeholder="Client ID (partial match)"
              allowClear
              size="small"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const values = form.getFieldsValue();
                values.clientId = e.target.value;
                handleFilterSubmit(values);
              }}
            />
          </Form.Item>
          
          <Form.Item name="txId" style={{ minWidth: 200, marginBottom: 8 }}>
            <Input 
              placeholder="Transaction ID (partial match)"
              allowClear
              size="small"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const values = form.getFieldsValue();
                values.txId = e.target.value;
                handleFilterSubmit(values);
              }}
            />
          </Form.Item>
          
          <Form.Item name="assignedTo" style={{ minWidth: 120, marginBottom: 8 }}>
            <Select 
              placeholder="Assigned To"
              allowClear
              size="small"
            >
              {organizationMembers.map(member => (
                <Select.Option key={member.userId} value={member.userId}>
                  {getUserDisplayName(member)}
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
      
      <ErrorBoundary>
        <ActiveCasesTable
          transactions={validatedTransactions}
          totalTransactions={totalTransactions}
          currentPage={currentPage}
          pageSize={pageSize}
          loading={loading}
          onTableChange={handleTableChange}
        />
      </ErrorBoundary>
    </div>
  );
};

export default ActiveCasesTab;