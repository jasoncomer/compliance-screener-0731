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
  selectCompletedTransactions,
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

interface ArchivedCasesTabProps {
  isActive: boolean;
}

const ARCHIVED_STATUSES = [
  ETransactionStatus.APPROVED,
  ETransactionStatus.CLOSED_WITH_NOTE,
  ETransactionStatus.CLOSED_WITH_SAR
];

const ArchivedCasesTab: React.FC<ArchivedCasesTabProps> = ({ isActive }) => {
  const { theme } = useTheme();
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
    const { dateRange, ...rest } = values;
    const filters: TransactionFilters = {
      ...rest,
      page: 1,
      limit: pageSize
    };

    // If no specific status is selected, show all archived statuses
    if (!values.status) {
      filters.status = ARCHIVED_STATUSES.join(',');
    }

    if (dateRange) {
      filters.timestamp = {
        from: dateRange[0].toISOString(),
        to: dateRange[1].toISOString()
      };
    }

    dispatch(setFilters(filters));
  };

  return (
    <div style={{ width: '100%' }}>
      <HeaderActions>
        <h3 style={{ margin: 0, color: theme === 'light' ? colors.black : colors.white }}>
          <FileSearchOutlined style={{ marginRight: '8px' }} />
          Archived Cases Management ({totalTransactions})
        </h3>
        <div>
          <span style={{ marginRight: '10px', color: theme === 'light' ? colors.primaryDark : colors.white }}>
            Total Archived Cases: <strong>{totalTransactions}</strong>
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
          <Form.Item name="status" style={{ minWidth: 120, marginBottom: 8 }}>
            <Select 
              placeholder="Status"
              allowClear
              size="small"
              style={{ width: 150 }}
              onChange={(value) => handleFilterSubmit({ status: value })}
            >
              <Select.Option value={ETransactionStatus.APPROVED}>Approved</Select.Option>
              <Select.Option value={ETransactionStatus.CLOSED_WITH_NOTE}>Closed with note</Select.Option>
              <Select.Option value={ETransactionStatus.CLOSED_WITH_SAR}>Closed with SAR</Select.Option>
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