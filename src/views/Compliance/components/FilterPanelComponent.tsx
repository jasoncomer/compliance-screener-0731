import React, { useEffect } from 'react';

import { ClearOutlined,FilterOutlined } from '@ant-design/icons';
import { Button, Card,DatePicker, Form, Input, Select } from 'antd';

import { useAppSelector } from '../../../store/hooks';
import { selectActiveOrgMembers } from '../../../store/slices/organizationsSlice';
import { EComplianceTransactionStatus, TransactionFilters } from '../../../typings/compliance';
import { getUserDisplayName } from '../../../utils/display-labels';

const { RangePicker } = DatePicker;

interface FilterPanelComponentProps {
  form: any;
  availableBlockchains: string[];
  showStatusFilter?: boolean;
  showAssignedToFilter?: boolean;
  statusOptions?: Array<{ value: EComplianceTransactionStatus; label: string; group: string }>;
  onFilterChange: (filters: TransactionFilters) => void;
  onClearFilters: () => void;
  initialStatusFilter?: string;
  onClearFiltersExceptStatus?: () => void;
}

const FilterPanelComponent: React.FC<FilterPanelComponentProps> = ({
  form,
  availableBlockchains,
  showStatusFilter = true,
  showAssignedToFilter = true,
  statusOptions: customStatusOptions,
  onFilterChange,
  onClearFilters,
  initialStatusFilter,
  onClearFiltersExceptStatus
}) => {
  const organizationMembers = useAppSelector(selectActiveOrgMembers);
  // Default status options for all statuses
  const defaultStatusOptions = [
    { value: EComplianceTransactionStatus.UNASSIGNED, label: 'Unassigned', group: 'Unassigned' },
    { value: EComplianceTransactionStatus.UNREVIEWED, label: 'Unreviewed', group: 'Active Cases' },
    { value: EComplianceTransactionStatus.IN_REVIEW, label: 'In Review', group: 'Active Cases' },
    { value: EComplianceTransactionStatus.HOLD, label: 'Hold', group: 'Active Cases' },
    { value: EComplianceTransactionStatus.APPROVED, label: 'Approved', group: 'Archived Cases' },
    { value: EComplianceTransactionStatus.CLOSED_WITH_NOTE, label: 'Approved with Note', group: 'Archived Cases' },
    { value: EComplianceTransactionStatus.CLOSED_WITH_SAR, label: 'Closed with SAR', group: 'Archived Cases' },
  ];

  // Use custom status options if provided, otherwise use default
  const statusOptions = customStatusOptions || defaultStatusOptions;

  useEffect(() => {
    console.log('useEffect', initialStatusFilter);
    if (initialStatusFilter !== undefined && form) {
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
    
    if (values.counterpartyEntity) {
      newFilters.counterpartyEntity = values.counterpartyEntity;
    }
    
    if (values.txId) {
      newFilters.txId = values.txId;
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
    
    if (values.assignedTo) {
      newFilters.assignedTo = values.assignedTo;
    }
    
    return newFilters;
  };

  const handleFilterChange = () => {
    if (!form) return;
    const values = form.getFieldsValue();
    const filters = processFilterValues(values);
    onFilterChange(filters);
  };

  const handleDateRangeChange = (dates: any) => {
    if (!form) return;
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
          Clear Filters
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
        
        <Form.Item name="clientId" style={{ minWidth: 150 }}>
          <Input 
            placeholder="Client ID (partial match)"
            allowClear
            size="small"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (!form) return;
              const values = form.getFieldsValue();
              values.clientId = e.target.value;
              const filters = processFilterValues(values);
              onFilterChange(filters);
            }}
          />
        </Form.Item>
        
        {showAssignedToFilter && (
          <Form.Item name="assignedTo" style={{ minWidth: 120 }}>
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
        )}
        
        <Form.Item name="counterpartyEntity" style={{ minWidth: 74 }}>
          <Input 
            placeholder="Counterparty Entity"
            allowClear
            size="small"
          />
        </Form.Item>
        
        <Form.Item name="txId" style={{ minWidth: 200 }}>
          <Input 
            placeholder="Transaction ID (partial match)"
            allowClear
            size="small"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (!form) return;
              const values = form.getFieldsValue();
              values.txId = e.target.value;
              const filters = processFilterValues(values);
              onFilterChange(filters);
            }}
          />
        </Form.Item>
        
        <Form.Item name="dateRange" style={{ marginBottom: 8 }}>
          <RangePicker 
            size="small" 
            placeholder={['From date', 'To date']} 
            onChange={handleDateRangeChange}
          />
        </Form.Item>
        
        <Form.Item name="minAmount" style={{ width: 100 }}>
          <Input type="number" placeholder="Min BTC" step="0.0001" min="0" size="small" />
        </Form.Item>
        
        <Form.Item name="maxAmount" style={{ width: 100 }}>
          <Input type="number" placeholder="Max BTC" step="0.0001" min="0" size="small" />
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
      </Form>
    </Card>
  );
};

export default FilterPanelComponent;