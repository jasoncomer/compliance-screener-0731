import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <Card className="mb-6 p-6">
      <div className="flex gap-3">
        <Input
          placeholder="Enter blockchain address"
          value={address}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAddressChange(e.target.value)}
          className="w-[400px]"
          enterButton="Analyze Risk"
          loading={loading}
          onSearch={() => onSubmit()}
        />
        <Button
          variant="outline"
          onClick={handleViewInExplorer}
          disabled={!address}
        >
          View in Block Explorer
        </Button>
      </div>
    </Card>
  );
};

export default SearchBar; 
