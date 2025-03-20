import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

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
      onChange={onChange} 
      style={{ width: 120 }}
    >
      <Option value="USD">USD</Option>
      <Option value="GBP">GBP</Option>
      <Option value="MXN">MXN</Option>
    </Select>
  );
};

export default CurrencySelector; 