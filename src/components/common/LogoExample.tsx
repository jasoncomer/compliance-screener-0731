import React, { useState } from 'react';

import { BankOutlined,UserOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Space, Typography } from 'antd';

import { useLogo } from '../../hooks/useLogo';
import { LogoService } from '../../services/logoService';

import { SimpleLogo } from './Logo';

const { Title, Text } = Typography;

export const LogoExample: React.FC = () => {
  const [selectedEntityId, setSelectedEntityId] = useState('example-entity-123');
  const [selectedEntityType, setSelectedEntityType] = useState('exchange');

  // Example using the hook
  const {
    logoUrl,
    isLoading,
    error,
    refetch,
  } = useLogo({
    entityId: selectedEntityId,
    entityType: selectedEntityType,
    enableFallback: true,
  });

  const handleGetLogoUrl = async () => {
    try {
      const url = await LogoService.getLogoUrlWithFallback(selectedEntityId, selectedEntityType);
      if (url) {
        console.log('Logo URL:', url);
      } else {
        console.log('No logo found');
      }
    } catch (err) {
      console.error('Failed to get logo URL:', err);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Logo Component Examples</Title>
      
      {/* Entity Selection */}
      <Card title="Entity Selection" size="small" style={{ marginBottom: '16px' }}>
        <Space direction="vertical">
          <div>
            <Text strong>Entity ID:</Text>
            <input
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              style={{ marginLeft: '8px', padding: '4px 8px' }}
            />
          </div>
          <div>
            <Text strong>Entity Type:</Text>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              style={{ marginLeft: '8px', padding: '4px 8px' }}
            >
              <option value="exchange">Exchange</option>
              <option value="wallet">Wallet</option>
              <option value="mixer">Mixer</option>
              <option value="defi">DeFi</option>
              <option value="gambling">Gambling</option>
            </select>
          </div>
        </Space>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Simple Logo */}
        <Card title="1. Simple Logo Display" size="small">
          <Space direction="vertical">
            <Text>Basic logo display:</Text>
            <SimpleLogo 
              entityId={selectedEntityId} 
              entityType={selectedEntityType} 
              size="large"
            />
          </Space>
        </Card>

        {/* Hook Usage */}
        <Card title="2. Using the useLogo Hook" size="small">
          <Space direction="vertical">
            <Text>Current state from hook:</Text>
            <Space>
              <Text>Loading: {isLoading ? 'Yes' : 'No'}</Text>
              <Text>Error: {error || 'None'}</Text>
              <Text>URL: {logoUrl || 'None'}</Text>
            </Space>
            
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt="Logo from hook" 
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%' }}
              />
            )}
            
            <Space>
              <Button onClick={refetch} loading={isLoading}>
                Refresh Logo
              </Button>
              <Button onClick={handleGetLogoUrl}>
                Get Logo URL
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Different Entity Types */}
        <Card title="3. Different Entity Types" size="small">
          <Space direction="vertical">
            <Text>Examples with different entity types:</Text>
            <Space wrap>
              <div>
                <Text strong>Exchange:</Text>
                <SimpleLogo 
                  entityId="binance" 
                  entityType="exchange" 
                  size="default" 
                />
              </div>
              <div>
                <Text strong>Wallet:</Text>
                <SimpleLogo 
                  entityId="metamask" 
                  entityType="wallet" 
                  size="default" 
                />
              </div>
              <div>
                <Text strong>Mixer:</Text>
                <SimpleLogo 
                  entityId="tornado-cash" 
                  entityType="mixer" 
                  size="default" 
                />
              </div>
              <div>
                <Text strong>No Type:</Text>
                <SimpleLogo 
                  entityId="unknown-entity" 
                  size="default" 
                />
              </div>
            </Space>
          </Space>
        </Card>

        {/* Different Sizes */}
        <Card title="4. Different Sizes" size="small">
          <Space direction="vertical">
            <Text>Logo in different sizes:</Text>
            <Space wrap>
              <div>
                <Text strong>Small:</Text>
                <SimpleLogo 
                  entityId={selectedEntityId} 
                  entityType={selectedEntityType} 
                  size="small" 
                />
              </div>
              <div>
                <Text strong>Default:</Text>
                <SimpleLogo 
                  entityId={selectedEntityId} 
                  entityType={selectedEntityType} 
                  size="default" 
                />
              </div>
              <div>
                <Text strong>Large:</Text>
                <SimpleLogo 
                  entityId={selectedEntityId} 
                  entityType={selectedEntityType} 
                  size="large" 
                />
              </div>
              <div>
                <Text strong>Custom (60px):</Text>
                <SimpleLogo 
                  entityId={selectedEntityId} 
                  entityType={selectedEntityType} 
                  size={60} 
                />
              </div>
            </Space>
          </Space>
        </Card>

        {/* Different Shapes */}
        <Card title="5. Different Shapes" size="small">
          <Space direction="vertical">
            <Text>Logo in different shapes:</Text>
            <Space wrap>
              <div>
                <Text strong>Circle:</Text>
                <SimpleLogo 
                  entityId={selectedEntityId} 
                  entityType={selectedEntityType} 
                  size="default" 
                  shape="circle"
                />
              </div>
              <div>
                <Text strong>Square:</Text>
                <SimpleLogo 
                  entityId={selectedEntityId} 
                  entityType={selectedEntityType} 
                  size="default" 
                  shape="square"
                />
              </div>
            </Space>
          </Space>
        </Card>

        {/* Custom Fallback Icons */}
        <Card title="6. Custom Fallback Icons" size="small">
          <Space direction="vertical">
            <Text>Logos with custom fallback icons:</Text>
            <Space wrap>
              <div>
                <Text strong>User Icon:</Text>
                <SimpleLogo 
                  entityId="non-existent-entity" 
                  size="default" 
                  fallbackIcon={<UserOutlined />}
                />
              </div>
              <div>
                <Text strong>Bank Icon:</Text>
                <SimpleLogo 
                  entityId="another-non-existent" 
                  size="default" 
                  fallbackIcon={<BankOutlined />}
                />
              </div>
            </Space>
          </Space>
        </Card>
      </div>

      <Divider />

      <Card title="Logo Service Examples" size="small">
        <Space direction="vertical">
          <Text>Direct service usage:</Text>
          <Space>
            <Button onClick={handleGetLogoUrl}>
              Get Logo URL via Service
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
}; 