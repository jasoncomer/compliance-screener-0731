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

  // const handleEntityNameSearch = (value: string) => {
  //   onFiltersChange({ ...filters, entityName: value });
  // };

  return (
    <div className={cn("flex gap-4", className)}>
      <Select
        onValueChange={handleBlockchainChange}
        value={filters.blockchain ?? 'all'}
      >
        <SelectTrigger className="w-[200px] h-12">
          <SelectValue placeholder="Show All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Show All</SelectItem>
          <SelectItem value="ethereum">Ethereum</SelectItem>
          <SelectItem value="bitcoin">Bitcoin</SelectItem>
          {/* Add more blockchains as needed */}
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
