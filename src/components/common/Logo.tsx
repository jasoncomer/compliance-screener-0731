import React from 'react';
import { Avatar, Spin, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useLogo } from '../../hooks/useLogo';

interface LogoProps {
  entityId?: string;
  entityType?: string;
  size?: number | 'small' | 'default' | 'large';
  shape?: 'circle' | 'square';
  fallbackIcon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  enableFallback?: boolean;
  cacheTime?: number;
}

export const Logo: React.FC<LogoProps> = ({
  entityId,
  entityType,
  size = 'default',
  shape = 'circle',
  fallbackIcon = <UserOutlined />,
  className,
  style,
  alt,
  enableFallback = true,
  cacheTime,
}) => {
  const {
    logoUrl,
    isLoading,
    error,
  } = useLogo({
    entityId,
    entityType,
    enableFallback,
    cacheTime,
  });

  const renderContent = () => {
    if (isLoading) {
      return <Spin size="small" />;
    }

    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={alt || `Logo for ${entityId}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            objectPosition: 'center',
            borderRadius: shape === 'circle' ? '50%' : '4px',
            display: 'block',
            margin: 0,
            padding: 0,
          }}
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              // Remove any existing fallback icon
              const existingIcon = parent.querySelector('.fallback-icon');
              if (existingIcon) {
                existingIcon.remove();
              }
              // Add new fallback icon
              const iconElement = document.createElement('div');
              iconElement.className = 'fallback-icon';
              iconElement.style.cssText = `
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #999;
              `;
              iconElement.appendChild(fallbackIcon as any);
              parent.appendChild(iconElement);
            }
          }}
        />
      );
    }

    return fallbackIcon;
  };

  const avatarSize = 
    size === 'small' ? 32 : 
    size === 'large' ? 56 : 40;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Tooltip title={error || (logoUrl ? alt || `Logo for ${entityId}` : 'No logo available')}>
        <Avatar
          size={avatarSize}
          shape={shape}
          className={className}
          style={{
            ...style,
            border: error ? '1px solid #ff4d4f' : undefined,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            backgroundColor: 'transparent',
          }}
        >
          {renderContent()}
        </Avatar>
      </Tooltip>
    </div>
  );
};

// Export a simpler version for basic logo display
export const SimpleLogo: React.FC<{
  entityId?: string;
  entityType?: string;
  size?: number | 'small' | 'default' | 'large';
  shape?: 'circle' | 'square';
  fallbackIcon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}> = (props) => {
  return <Logo {...props} />;
}; 