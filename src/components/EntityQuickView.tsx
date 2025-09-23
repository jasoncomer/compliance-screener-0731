import React from 'react';

import { EyeOutlined,GlobalOutlined, SendOutlined, TwitterOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Popover,Tag, Typography } from 'antd';
import styled from 'styled-components';

import { colors } from '@/design-system/tokens'

import { SOT } from '../typings/interfaces';
import { EEntityType } from '../typings/SOT';
import { getEntityTypeLabel } from '../utils/display-labels';

import { SimpleLogo } from './common/Logo';

const { Text } = Typography;

const QuickViewPopover = styled.div`
  max-height: 550px;
  overflow-y: auto;
  padding: 0;
  position: relative;
  z-index: 1051;
  
  /* Custom scrollbar for better UX */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.theme === 'dark' ? '#303030' : '#d9d9d9'};
    border-radius: 3px;
  }
`;

const ViewIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${colors.brand.primary};
  padding: 4px;
  transition: all 0.3s;
  z-index: 1;
  position: relative;
  
  &:hover {
    transform: scale(1.2);
    color: ${colors.attribution.hover};
  }
`;

const CompactDetailItem = styled.div`
  display: flex;
  margin-bottom: 12px;
`;

const CompactDetailLabel = styled(Text)`
  width: 120px;
  color: #666666;
  font-size: 13px;
`;

const CompactDetailValue = styled(Text)`
  flex: 1;
  font-size: 14px;
`;

// Compact SOT view component for the popover
const CompactSOTView: React.FC<{ 
  sot: SOT;
  onViewFull: (sot: SOT) => void;
}> = ({ sot, onViewFull }) => {
  if (!sot) return null;
  
  const renderEntityTags = () => {
    const tags = [];
    for (let i = 1; i <= 7; i++) {
      const tag = sot[`entity_tag${i}` as keyof SOT];
      if (tag && typeof tag === 'string' && tag.trim() !== '') {
        tags.push(<Tag key={i}>{tag}</Tag>);
      }
    }
    return tags.length > 0 ? tags : 'None';
  };
  
  const renderAssociatedCountries = () => {
    const countries = [];
    for (let i = 1; i <= 6; i++) {
      const country = sot[`associate_country_${i}` as keyof SOT];
      if (country && typeof country === 'string' && country.trim() !== '') {
        countries.push(<Tag key={i}>{country}</Tag>);
      }
    }
    return countries.length > 0 ? countries : 'None';
  };
  
  return (
    <Card 
      title={sot.proper_name || sot.entity_id}
      extra={
        <SimpleLogo
          entityId={sot.entity_id}
          entityType={sot.entity_type}
          size="small"
          fallbackIcon={<UserOutlined />}
        />
      }
      style={{ marginBottom: 0 }}
    >
      <CompactDetailItem>
        <CompactDetailLabel>Entity Type:</CompactDetailLabel>
        <CompactDetailValue>
          {sot.entity_type ? getEntityTypeLabel(sot.entity_type as EEntityType) : 'Unknown'}
        </CompactDetailValue>
      </CompactDetailItem>
      
      {sot.url && (
        <CompactDetailItem>
          <CompactDetailLabel>Website:</CompactDetailLabel>
          <CompactDetailValue>
            <a href={sot.url} target="_blank" rel="noopener noreferrer">
              <GlobalOutlined style={{ marginRight: 4 }} />
              {sot.url}
            </a>
          </CompactDetailValue>
        </CompactDetailItem>
      )}
      
      {sot.contact_twitter && (
        <CompactDetailItem>
          <CompactDetailLabel>Twitter:</CompactDetailLabel>
          <CompactDetailValue>
            <a 
              href={`https://twitter.com/${sot.contact_twitter.replace('@', '')}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <TwitterOutlined style={{ marginRight: 4 }} />
              {sot.contact_twitter}
            </a>
          </CompactDetailValue>
        </CompactDetailItem>
      )}
      
      {sot.contact_telegram && (
        <CompactDetailItem>
          <CompactDetailLabel>Telegram:</CompactDetailLabel>
          <CompactDetailValue>
            <a 
              href={`https://t.me/${sot.contact_telegram.replace('@', '')}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <SendOutlined style={{ marginRight: 4 }} />
              {sot.contact_telegram}
            </a>
          </CompactDetailValue>
        </CompactDetailItem>
      )}
      
      <CompactDetailItem>
        <CompactDetailLabel>Entity Tags:</CompactDetailLabel>
        <CompactDetailValue style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {renderEntityTags()}
        </CompactDetailValue>
      </CompactDetailItem>
      
      <CompactDetailItem>
        <CompactDetailLabel>Countries:</CompactDetailLabel>
        <CompactDetailValue style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {renderAssociatedCountries()}
        </CompactDetailValue>
      </CompactDetailItem>
      
      {sot.description_merged && (
        <CompactDetailItem style={{ flexDirection: 'column' }}>
          <CompactDetailLabel style={{ marginBottom: 4 }}>Description:</CompactDetailLabel>
          <CompactDetailValue style={{ whiteSpace: 'pre-wrap' }}>
            {sot.description_merged.length > 300 
              ? `${sot.description_merged.substring(0, 300)}...` 
              : sot.description_merged}
          </CompactDetailValue>
        </CompactDetailItem>
      )}
      
      <div style={{ textAlign: 'center', marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
        <a onClick={() => onViewFull(sot)} style={{ cursor: 'pointer', color: colors.brand.primary }}>
          View Full Profile
        </a>
      </div>
    </Card>
  );
};

interface EntityQuickViewProps {
  entity: {
    _id: string;
    proper_name?: string;
    entity_id: string;
  };
  sot: SOT;
  onViewFull: (sot: SOT) => void;
  onQuickView: (e: React.MouseEvent, entityId: string) => void;
  className?: string;
  popoverPlacement?: 'top' | 'right' | 'bottom' | 'left' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  popoverWidth?: number;
}

const EntityQuickView: React.FC<EntityQuickViewProps> = ({ 
  entity, 
  sot, 
  onViewFull, 
  onQuickView,
  className,
  popoverPlacement = 'rightTop',
  popoverWidth = 500
}) => {
  return (
    <Popover
      content={
        <QuickViewPopover style={{ width: popoverWidth }}>
          {sot && (
            <CompactSOTView sot={sot} onViewFull={onViewFull} />
          )}
        </QuickViewPopover>
      }
      title={`Quick View: ${entity.proper_name || entity.entity_id}`}
      trigger="hover"
      placement={popoverPlacement}
      destroyOnHidden
      overlayStyle={{ zIndex: 1050 }}
      styles={{ body: { maxWidth: '100vw' } }}
      autoAdjustOverflow={true}
      mouseEnterDelay={0.3}
      mouseLeaveDelay={0.2}
      onOpenChange={(visible) => {
        if (visible) {
          // When popover becomes visible, prevent any parent click events
          // that might close the dropdown
          const event = new MouseEvent('click', { bubbles: true });
          event.stopPropagation = () => {}; // No-op the stopPropagation
        }
      }}
    >
      <ViewIconWrapper className={className} onClick={(e) => onQuickView(e, entity._id)}>
        <EyeOutlined />
      </ViewIconWrapper>
    </Popover>
  );
};

export default EntityQuickView; 