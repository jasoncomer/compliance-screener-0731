import React from 'react';
import { Card, Space } from 'antd';
import Input from '../../components/common/Input';

interface SearchBarProps {
  address: string;
  loading: boolean;
  onAddressChange: (value: string) => void;
  onSubmit: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  address,
  loading,
  onAddressChange,
  onSubmit,
}) => {
  return (
    <Card style={{ marginBottom: '24px' }}>
      <Space.Compact>
        <Input
          placeholder="Enter blockchain address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          style={{ width: '400px' }}
          onPressEnter={onSubmit}
          enterButton="Analyze Risk"
          loading={loading}
          onSearch={onSubmit}
        />
      </Space.Compact>
    </Card>
  );
};

export default SearchBar; 
