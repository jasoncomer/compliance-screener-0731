import React, { useState, useEffect } from 'react';
import { Form, Button, Select, Input, DatePicker, Card } from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { ETransactionStatus, TransactionFilters } from '../../../typings/compliance';
import ComplianceHeaderActions from './ComplianceHeaderActions';
import UnassignedTransactionsTable from './UnassignedTransactionsTable';
import { EntityModal } from '../modals/EntityModal';
import { selectCurrentOrganization } from '../../../store/slices/organizationsSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  fetchComplianceTransactions, 
  selectUnassignedTransactions, 
  selectPagination, 
  selectIsLoading,
  selectComplianceFilters,
  setFilters,
  setPage,
  setLimit
} from '../../../store/slices/complianceTransactionsSlice';

const { RangePicker } = DatePicker;

interface UnassignedTransactionsTabProps {
  isActive: boolean;
}

const UnassignedTransactionsTab: React.FC<UnassignedTransactionsTabProps> = ({ isActive }) => {
  const organization = useAppSelector(selectCurrentOrganization);
  const dispatch = useAppDispatch();
  
  // Use Redux store data
  const transactions = useAppSelector(selectUnassignedTransactions);
  const { total: totalTransactions, page: currentPage, limit: pageSize } = useAppSelector(selectPagination);
  const loading = useAppSelector(selectIsLoading);
  const filters = useAppSelector(selectComplianceFilters);
  
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  
  // Track available filter options
  const [availableBlockchains, setAvailableBlockchains] = useState<string[]>([]);

  // Load transactions from Redux store
  useEffect(() => {
    if (!isActive) return;

    const mergedFilters = { 
      ...filters,
      page: currentPage,
      limit: pageSize,
      status: ETransactionStatus.UNASSIGNED // Only show unassigned transactions
    };
    dispatch(fetchComplianceTransactions(mergedFilters));
  }, [dispatch, filters, organization, currentPage, pageSize, isActive]);

  // Extract unique filter options from transaction data
  useEffect(() => {
    if (transactions.length > 0) {
      // Extract unique blockchains
      const blockchains = [...new Set(transactions.map(tx => tx.blockchain))];
      setAvailableBlockchains(blockchains);
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
      status: ETransactionStatus.UNASSIGNED // Maintain unassigned filter
    }));
  };
  
  // Process filter values and update the store
  const processFilterValues = (values: any) => {
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
    
    dispatch(setFilters(newFilters));
  };

  // Handle filter changes
  const handleFilterChange = () => {
    const values = form.getFieldsValue();
    processFilterValues(values);
  };

  return (
    <div>
      <ComplianceHeaderActions
        txCount={totalTransactions}
      />
      
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
          style={{ display: 'flex', flexWrap: 'wrap', height: '32px' }}
          onValuesChange={handleFilterChange}
        >
          <Form.Item name="blockchain" style={{ minWidth: 120 }}>
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
          
          <Form.Item name="dateRange" style={{ marginBottom: 8 }}>
            <RangePicker size="small" placeholder={['From date', 'To date']} />
          </Form.Item>
          
          <Form.Item name="riskLevel" style={{ minWidth: 120 }}>
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
          
          <Form.Item name="minAmount" style={{ width: 100 }}>
            <Input type="number" placeholder="Min BTC" step="0.0001" size="small" />
          </Form.Item>
          
          <Form.Item name="maxAmount" style={{ width: 100 }}>
            <Input type="number" placeholder="Max BTC" step="0.0001" size="small" />
          </Form.Item>
        </Form>
      </Card>
      
      <UnassignedTransactionsTable
        transactions={transactions}
        totalTransactions={totalTransactions}
        currentPage={currentPage}
        pageSize={pageSize}
        loading={loading}
        onTableChange={handleTableChange}
      />
      
      <EntityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        entity={null}
      />
    </div>
  );
};

export default UnassignedTransactionsTab;