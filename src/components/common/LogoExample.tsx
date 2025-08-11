import React, { useState } from 'react';
import { Card, Space, Button, Upload, message, Divider, Typography } from 'antd';
import { UploadOutlined, UserOutlined, BankOutlined } from '@ant-design/icons';
import { SimpleLogo, EditableLogo } from './Logo';
import { useLogo } from '../../hooks/useLogo';
import { LogoService } from '../../services/logoService';

const { Title, Text } = Typography;

export const LogoExample: React.FC = () => {
  const [selectedEntityId, setSelectedEntityId] = useState('example-entity-123');
  const [selectedEntityType, setSelectedEntityType] = useState('exchange');

  // Example using the hook
  const {
    logoUrl,
    isLoading,
    error,
    uploadLogo,
    refetch,
  } = useLogo({
    entityId: selectedEntityId,
    entityType: selectedEntityType,
    enableFallback: true,
  });

  const handleFileUpload = async (file: File) => {
    const success = await uploadLogo(file);
    if (success) {
      message.success('Logo uploaded successfully!');
    } else {
      message.error('Failed to upload logo');
    }
  };

  const handleUploadViaService = async (file: File) => {
    try {
      const result = await LogoService.uploadLogo(file, selectedEntityId, selectedEntityType);
      if (result.success) {
        message.success('Logo uploaded via service!');
        refetch(); // Refresh the hook
      } else {
        message.error(result.error || 'Upload failed');
      }
    } catch (err) {
      message.error('Upload failed');
    }
  };

  const handleGetLogoUrl = async () => {
    try {
      const url = await LogoService.getLogoUrlWithFallback(selectedEntityId, selectedEntityType);
      if (url) {
        message.success(`Logo URL: ${url}`);
      } else {
        message.info('No logo found');
      }
    } catch (err) {
      message.error('Failed to get logo URL');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Logo System Examples</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* Basic Logo Display */}
        <Card title="1. Basic Logo Display" size="small">
          <Space direction="vertical">
            <Text>Simple logo display with different sizes:</Text>
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
                <Text strong>Custom (64px):</Text>
                <SimpleLogo 
                  entityId={selectedEntityId} 
                  entityType={selectedEntityType} 
                  size={64} 
                />
              </div>
            </Space>
          </Space>
        </Card>

        {/* Editable Logo */}
        <Card title="2. Editable Logo with Upload" size="small">
          <Space direction="vertical">
            <Text>Click the logo to upload a new one:</Text>
            <EditableLogo 
              entityId={selectedEntityId} 
              entityType={selectedEntityType} 
              size="large"
              onLogoChange={(url) => message.success(`Logo updated: ${url}`)}
            />
          </Space>
        </Card>

        {/* Hook Usage */}
        <Card title="3. Using the useLogo Hook" size="small">
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

        {/* File Upload Examples */}
        <Card title="4. File Upload Examples" size="small">
          <Space direction="vertical">
            <Text>Upload via hook:</Text>
            <Upload
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false; // Prevent default upload
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Upload via Hook</Button>
            </Upload>

            <Text>Upload via service:</Text>
            <Upload
              beforeUpload={(file) => {
                handleUploadViaService(file);
                return false; // Prevent default upload
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Upload via Service</Button>
            </Upload>
          </Space>
        </Card>

        {/* Different Entity Types */}
        <Card title="5. Different Entity Types" size="small">
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
                  entityId="generic-entity" 
                  size="default" 
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
                  entityId="user-entity" 
                  entityType="user" 
                  size="default"
                  fallbackIcon={<UserOutlined />}
                />
              </div>
              <div>
                <Text strong>Bank Icon:</Text>
                <SimpleLogo 
                  entityId="bank-entity" 
                  entityType="bank" 
                  size="default"
                  fallbackIcon={<BankOutlined />}
                />
              </div>
            </Space>
          </Space>
        </Card>

        {/* Entity Selector */}
        <Card title="7. Entity Selector" size="small">
          <Space direction="vertical">
            <Text>Change the entity to see different logos:</Text>
            <Space>
              <Button 
                onClick={() => setSelectedEntityId('entity-1')}
                type={selectedEntityId === 'entity-1' ? 'primary' : 'default'}
              >
                Entity 1
              </Button>
              <Button 
                onClick={() => setSelectedEntityId('entity-2')}
                type={selectedEntityId === 'entity-2' ? 'primary' : 'default'}
              >
                Entity 2
              </Button>
              <Button 
                onClick={() => setSelectedEntityId('entity-3')}
                type={selectedEntityId === 'entity-3' ? 'primary' : 'default'}
              >
                Entity 3
              </Button>
            </Space>
            
            <Space>
              <Button 
                onClick={() => setSelectedEntityType('exchange')}
                type={selectedEntityType === 'exchange' ? 'primary' : 'default'}
              >
                Exchange
              </Button>
              <Button 
                onClick={() => setSelectedEntityType('wallet')}
                type={selectedEntityType === 'wallet' ? 'primary' : 'default'}
              >
                Wallet
              </Button>
              <Button 
                onClick={() => setSelectedEntityType('mixer')}
                type={selectedEntityType === 'mixer' ? 'primary' : 'default'}
              >
                Mixer
              </Button>
            </Space>
            
            <Text>Current: {selectedEntityId} ({selectedEntityType})</Text>
          </Space>
        </Card>

        <Divider />

        <Card title="API Endpoints" size="small">
          <Space direction="vertical">
            <Text strong>Public Endpoints:</Text>
            <Text code>GET /api/logos/entity/:entityId/:entityType?</Text>
            <Text code>GET /api/logos/default/:entityType</Text>
            
            <Text strong>Protected Endpoints:</Text>
            <Text code>POST /api/logos/upload</Text>
            <Text code>POST /api/logos/upload-default</Text>
            <Text code>GET /api/logos/list/:entityId</Text>
            <Text code>DELETE /api/logos/:filename</Text>
            
            <Text strong>Admin Endpoints:</Text>
            <Text code>POST /api/logos/initialize-bucket</Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
}; 