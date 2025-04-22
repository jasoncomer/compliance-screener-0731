import React, { useState, useEffect } from 'react';
import { Form, Button, Select, Input, DatePicker, Card } from 'antd';
import { FilterOutlined, ClearOutlined, FileSearchOutlined } from '@ant-design/icons';
import { ETransactionStatus, TransactionFilters } from '../../../typings/compliance';
import styled from 'styled-components';
import { useTheme } from '../../../context/ThemeContext';
import { colors } from '../../../styles/variables';
import ActiveCasesTable from './ActiveCasesTable';
import { selectCurrentOrganization } from '../../../store/slices/organizationsSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  fetchComplianceTransactions, 
  selectTransactionsWithAssignee,
  selectPagination, 
  selectIsLoading,
  selectComplianceFilters,
  setFilters,
  setPage,
  setLimit
} from '../../../store/slices/complianceTransactionsSlice';

const { RangePicker } = DatePicker;

const HeaderActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ActiveCasesTab: React.FC = () => {
  const { theme } = useTheme();
  const organization = useAppSelector(selectCurrentOrganization);
  const dispatch = useAppDispatch();
  
  // Use Redux store data
  const transactions = useAppSelector(selectTransactionsWithAssignee);
  const { total: totalTransactions, page: currentPage, limit: pageSize } = useAppSelector(selectPagination);
  const loading = useAppSelector(selectIsLoading);
  const filters = useAppSelector(selectComplianceFilters);
  
  const [form] = Form.useForm();
  
  // Track available filter options
  const [availableBlockchains, setAvailableBlockchains] = useState<string[]>([]);
  const [availableClientIds, setAvailableClientIds] = useState<string[]>([]);

  // Load transactions from Redux store
  useEffect(() => {
    const mergedFilters = { 
      ...filters,
      page: currentPage,
      limit: pageSize,
      // Only show transactions that have a reviewer assigned (IN_REVIEW status)
      status: ETransactionStatus.IN_REVIEW
    };
    dispatch(fetchComplianceTransactions(mergedFilters));
  }, [dispatch, filters, organization, currentPage, pageSize]);

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
      status: ETransactionStatus.IN_REVIEW
    }));
  };
  
  // Handle filter form submission
  const handleFilterSubmit = (values: any) => {
    // Create new filter object
    const newFilters: TransactionFilters = {
      ...filters,
      page: 1, // Reset to first page when applying new filters
      status: ETransactionStatus.IN_REVIEW, // Always show IN_REVIEW transactions
    };
    
    // Add form filters
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
    
    // Date range filter
    if (values.dateRange && values.dateRange.length === 2) {
      newFilters.timestamp = {
        from: values.dateRange[0].format('YYYY-MM-DD'),
        to: values.dateRange[1].format('YYYY-MM-DD')
      };
    } else {
      delete newFilters.timestamp;
    }
    
    // Amount filters
    if (values.minAmount) {
      newFilters.minAmount = parseFloat(values.minAmount) * 100000000; // Convert to satoshis
    }
    
    if (values.maxAmount) {
      newFilters.maxAmount = parseFloat(values.maxAmount) * 100000000; // Convert to satoshis
    }
    
    // Risk level filter
    if (values.riskLevel) {
      newFilters.riskLevel = values.riskLevel;
    }
    
    dispatch(setFilters(newFilters));
  };

  return (
    <>
      <HeaderActions>
        <h3 style={{ margin: 0, color: theme === 'light' ? colors.black : colors.white }}>
          <FileSearchOutlined style={{ marginRight: '8px' }} />
          Active Cases Management
        </h3>
        <div>
          <span style={{ marginRight: '10px', color: theme === 'light' ? colors.primaryDark : colors.white }}>
            Total Active Cases: <strong>{totalTransactions}</strong>
          </span>
        </div>
      </HeaderActions>
      
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
            <RangePicker size="small" placeholder={['From date', 'To date']} />
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
            <Input type="number" placeholder="Min BTC" step="0.0001" size="small" />
          </Form.Item>
          
          <Form.Item name="maxAmount" style={{ width: 100, marginBottom: 8 }}>
            <Input type="number" placeholder="Max BTC" step="0.0001" size="small" />
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
      />
    </>
  );
};

export default ActiveCasesTab;