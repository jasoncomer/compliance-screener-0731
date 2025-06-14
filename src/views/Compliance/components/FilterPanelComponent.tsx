import React, { useEffect } from 'react';
import { Form, Button, Select, Input, DatePicker, Card } from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { ETransactionStatus, TransactionFilters } from '../../../typings/compliance';

const { RangePicker } = DatePicker;

interface FilterPanelComponentProps {
  form: any;
  availableBlockchains: string[];
  showStatusFilter?: boolean;
  onFilterChange: (filters: TransactionFilters) => void;
  onClearFilters: () => void;
  initialStatusFilter?: string;
  onClearFiltersExceptStatus?: () => void;
}

const FilterPanelComponent: React.FC<FilterPanelComponentProps> = ({
  form,
  availableBlockchains,
  showStatusFilter = true,
  onFilterChange,
  onClearFilters,
  initialStatusFilter,
  onClearFiltersExceptStatus
}) => {
  const statusOptions = [
    { value: ETransactionStatus.UNASSIGNED, label: 'Unassigned', group: 'Unassigned' },
    { value: ETransactionStatus.UNREVIEWED, label: 'Unreviewed', group: 'Active Cases' },
    { value: ETransactionStatus.IN_REVIEW, label: 'In Review', group: 'Active Cases' },
    { value: ETransactionStatus.HOLD, label: 'Hold', group: 'Active Cases' },
    { value: ETransactionStatus.APPROVED, label: 'Approved', group: 'Archived Cases' },
    { value: ETransactionStatus.CLOSED_WITH_NOTE, label: 'Closed with Note', group: 'Archived Cases' },
    { value: ETransactionStatus.CLOSED_WITH_SAR, label: 'Closed with SAR', group: 'Archived Cases' },
  ];

  useEffect(() => {
    console.log('useEffect', initialStatusFilter);
    if (initialStatusFilter !== undefined) {
      // Clear all filters except status when initialStatusFilter changes
      if (onClearFiltersExceptStatus) {
        console.log('calling  onClearFiltersExceptStatus', onClearFiltersExceptStatus);
        onClearFiltersExceptStatus();
      }
      
      // Reset form to clear all fields first
      form.resetFields();
      
      // Then set the status field if provided
      if (initialStatusFilter) {
        form.setFieldsValue({ status: initialStatusFilter.split(',')[0] });
      } else {
        form.setFieldsValue({ status: undefined });
      }
    }
  }, [form]);

  const processFilterValues = (values: any): TransactionFilters => {
    const newFilters: TransactionFilters = {
      page: 1,
    };
    
    if (initialStatusFilter) {
      newFilters.status = initialStatusFilter;
    }
    
    if (values.status) {
      newFilters.status = values.status;
    }
    
    if (values.blockchain) {
      newFilters.blockchain = values.blockchain;
    }
    
    if (values.clientId) {
      newFilters.clientId = values.clientId;
    }
    
    if (values.dateRange && values.dateRange.length === 2 && values.dateRange[0] && values.dateRange[1]) {
      const startDate = values.dateRange[0].startOf('day');
      const endDate = values.dateRange[1].endOf('day');
      
      newFilters.timestamp = {
        from: startDate.toISOString(),
        to: endDate.toISOString()
      };
    }
    
    if (values.minAmount) {
      newFilters.minAmount = parseFloat(values.minAmount) * 100000000;
    }
    
    if (values.maxAmount) {
      newFilters.maxAmount = parseFloat(values.maxAmount) * 100000000;
    }
    
    if (values.riskLevel) {
      newFilters.riskLevel = values.riskLevel;
    }
    
    return newFilters;
  };

  const handleFilterChange = () => {
    const values = form.getFieldsValue();
    const filters = processFilterValues(values);
    onFilterChange(filters);
  };

  const handleDateRangeChange = (dates: any) => {
    const values = form.getFieldsValue();
    values.dateRange = dates;
    const filters = processFilterValues(values);
    onFilterChange(filters);
  };

  return (
    <Card 
      title={<><FilterOutlined /> Filters</>}
      style={{ marginBottom: 16 }}
      size="small"
      extra={
        <Button 
          icon={<ClearOutlined />} 
          onClick={onClearFilters}
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
        {showStatusFilter && (
          <Form.Item name="status" style={{ minWidth: 150 }}>
            <Select 
              placeholder="Status"
              allowClear
              size="small"
            >
              {statusOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}
        
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
          <RangePicker 
            size="small" 
            placeholder={['From date', 'To date']} 
            onChange={handleDateRangeChange}
          />
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
          <Input type="number" placeholder="Min BTC" step="0.0001" min="0" size="small" />
        </Form.Item>
        
        <Form.Item name="maxAmount" style={{ width: 100 }}>
          <Input type="number" placeholder="Max BTC" step="0.0001" min="0" size="small" />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FilterPanelComponent;