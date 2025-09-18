import React from 'react';
import { Card, Space, Button } from 'antd';
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
  const handleViewInExplorer = () => {
    if (address) {
      const url = `/home/block-explorer/address/${address}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Space>
        <Input
          placeholder="Enter blockchain address"
          value={address}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAddressChange(e.target.value)}
          style={{ width: '400px' }}
          onPressEnter={onSubmit}
          enterButton="Analyze Risk"
          loading={loading}
          onSearch={onSubmit}
        />
        <Button
          type="default"
          size="middle"
          onClick={handleViewInExplorer}
          disabled={!address}
        >
          View in Block Explorer
        </Button>
      </Space>
    </Card>
  );
};

export default SearchBar; 
