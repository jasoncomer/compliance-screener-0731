import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const currencySymbols: { [key: string]: string } = { 
  USD: '$', 
  GBP: '£', 
  MXN: 'MXN ' 
};

export const conversionRates: { [key: string]: number } = { 
  USD: 1, 
  GBP: 0.75, 
  MXN: 20 
};

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ value, onChange }) => {
  return (
    <Select
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USD">USD</SelectItem>
        <SelectItem value="GBP">GBP</SelectItem>
        <SelectItem value="MXN">MXN</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector; 