import React from 'react';
import { Select, Input } from 'antd';
import styled from 'styled-components';
import { AddressFilters as AddressFiltersType } from '../../../typings/compliance';

const { Option } = Select;

const FilterSection = styled.div`
  display: flex;
  gap: 16px;
`;

interface AddressFiltersProps {
  filters: AddressFiltersType;
  onFiltersChange: (filters: AddressFiltersType) => void;
}

const AddressFilters: React.FC<AddressFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleBlockchainChange = (value: string | undefined) => {
    onFiltersChange({ ...filters, blockchain: value });
  };

  const handleStatusChange = (value: boolean | undefined) => {
    onFiltersChange({ ...filters, isActive: value });
  };

  const handleEntityNameSearch = (value: string) => {
    onFiltersChange({ ...filters, entityName: value });
  };

  return (
    <FilterSection>
      <Select
        placeholder="Blockchain"
        style={{ width: 200 }}
        onChange={handleBlockchainChange}
        allowClear
        value={filters.blockchain}
        size="large"
      >
        <Option value="ethereum">Ethereum</Option>
        <Option value="bitcoin">Bitcoin</Option>
        {/* Add more blockchains as needed */}
      </Select>
      <Select
        placeholder="Status"
        style={{ width: 200 }}
        onChange={handleStatusChange}
        allowClear
        value={filters.isActive}
        size="large"
      >
        <Option value={true}>Active</Option>
        <Option value={false}>Inactive</Option>
      </Select>
      {/* <Input.Search
        placeholder="Search by entity name"
        style={{ width: 300 }}
        onSearch={handleEntityNameSearch}
        defaultValue={filters.entityName}
        size="large"
      /> */}
    </FilterSection>
  );
};

export default AddressFilters;
