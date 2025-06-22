import React, { useState } from 'react';
import { Button, Typography, Tag, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { getTagColor } from '../../../../utils/tag-colors';
import styled from 'styled-components';

const { Title, Text } = Typography;

interface AddressHeaderProps {
  address: string;
  entityTags: string[];
}

const HeaderContainer = styled.div`
  padding: 0;
`;

const AddressSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const AddressDisplay = styled.div`
  display: flex;
  align-items: center;
  background: rgba(55, 65, 81, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 6px;
  padding: 6px 10px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 13px;
  color: #e5e7eb;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CopyButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid rgba(75, 85, 99, 0.3);
  background: rgba(55, 65, 81, 0.3);
  color: #9ca3af;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

const AddressHeader: React.FC<AddressHeaderProps> = ({ address, entityTags }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      message.success('Address copied to clipboard');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      message.error('Failed to copy address');
    }
  };

  const formatAddress = (addr: string) => {
    return addr;
  };

  return (
    <HeaderContainer>
      <Title level={5} style={{ color: '#f9fafb', marginBottom: 12, fontWeight: 600 }}>
        Address
      </Title>
      
      <AddressSection>
        <AddressDisplay>
          <Text style={{ color: '#e5e7eb', fontFamily: 'inherit', fontSize: 'inherit' }}>
            {formatAddress(address)}
          </Text>
        </AddressDisplay>
        
        <CopyButton
          icon={copySuccess ? <CheckOutlined /> : <CopyOutlined />}
          onClick={copyToClipboard}
          title="Copy address"
        />
        
        {entityTags.length > 0 && (
          <TagsContainer>
            {entityTags.map((tag, index) => (
              <Tag 
                color={getTagColor(tag)} 
                key={index}
              >
                {tag}
              </Tag>
            ))}
          </TagsContainer>
        )}
      </AddressSection>
    </HeaderContainer>
  );
};

export default AddressHeader; 