import React from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { cn } from '../../../lib/utils';
import { IAddressFilters as AddressFiltersType } from '../../../typings/compliance';

interface AddressFiltersProps {
  filters: AddressFiltersType;
  onFiltersChange: (filters: AddressFiltersType) => void;
  className?: string;
}

const AddressFilters: React.FC<AddressFiltersProps> = ({ filters, onFiltersChange, className }) => {
  const handleBlockchainChange = (value: string | undefined) => {
    onFiltersChange({ ...filters, blockchain: value });
  };

  const handleStatusChange = (value: boolean | undefined) => {
    onFiltersChange({ ...filters, isActive: value });
  };

  // const handleEntityNameSearch = (value: string) => {
  //   onFiltersChange({ ...filters, entityName: value });
  // };

  return (
    <div className={cn("flex gap-4", className)}>
      <Select
        onValueChange={handleBlockchainChange}
        value={filters.blockchain || ''}
      >
        <SelectTrigger className="w-[200px] h-12">
          <SelectValue placeholder="Blockchain" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ethereum">Ethereum</SelectItem>
          <SelectItem value="bitcoin">Bitcoin</SelectItem>
          {/* Add more blockchains as needed */}
        </SelectContent>
      </Select>

      <Select
        onValueChange={(value) => handleStatusChange(value === 'true')}
        value={filters.isActive !== undefined ? filters.isActive.toString() : ''}
      >
        <SelectTrigger className="w-[200px] h-12">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Inactive</SelectItem>
        </SelectContent>
      </Select>
      {/* <Input.Search
        placeholder="Search by entity name"
        style={{ width: 300 }}
        onSearch={handleEntityNameSearch}
        defaultValue={filters.entityName}
        size="large"
      /> */}
    </div>
  );
};

export default AddressFilters;
