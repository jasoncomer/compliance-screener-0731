import React from 'react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { cn } from '@/lib/utils';
import { IAddressFilters as AddressFiltersType } from '@/typings/compliance';

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchTerm: e.target.value });
  };

  return (
    <div className={cn("flex gap-4", className)}>
      <Input
        placeholder="Search addresses, client IDs, notes..."
        value={filters.searchTerm || ''}
        onChange={handleSearchChange}
        className="w-[300px] h-12"
      />
      
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
    </div>
  );
};

export default AddressFilters;
