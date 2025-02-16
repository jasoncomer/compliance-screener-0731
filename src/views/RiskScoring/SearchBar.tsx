import React from 'react';
import { Card, Input, Button, Space } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import Paragraph from 'antd/es/typography/Paragraph';
import Title from 'antd/es/typography/Title';

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
    <>
      <Title level={2}>
        <Space>
          <SafetyOutlined />
          Risk Scoring Dashboard
        </Space>
      </Title>
      <Paragraph>
        Analyze the risk profile of any blockchain address based on transaction patterns,
        entity information, and jurisdiction data.
      </Paragraph>

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
    </>
  );
};

export default SearchBar; 
