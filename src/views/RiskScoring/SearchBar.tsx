import React from 'react';
import { Card, Input, Button, Space } from 'antd';

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
      <Space direction="horizontal" size="middle">
        <Input
          placeholder="Enter blockchain address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          style={{ width: '400px' }}
          onPressEnter={onSubmit}
        />
        <Button type="primary" onClick={onSubmit} loading={loading}>
          Analyze Risk
        </Button>
      </Space>
    </Card>
  );
};

export default SearchBar; 