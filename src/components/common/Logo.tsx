import React, { useState } from 'react';
import { Avatar, Spin, Tooltip } from 'antd';
import { UserOutlined, PictureOutlined } from '@ant-design/icons';
import { useLogo } from '../../hooks/useLogo';

interface LogoProps {
  entityId?: string;
  entityType?: string;
  size?: number | 'small' | 'default' | 'large';
  shape?: 'circle' | 'square';
  fallbackIcon?: React.ReactNode;
  showUploadButton?: boolean;
  onLogoChange?: (url: string) => void;
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
  showUploadButton = false,
  onLogoChange,
  className,
  style,
  alt,
  enableFallback = true,
  cacheTime,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    logoUrl,
    isLoading,
    error,
    uploadLogo,
  } = useLogo({
    entityId,
    entityType,
    enableFallback,
    cacheTime,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !entityId) return;

    setIsUploading(true);
    try {
      const success = await uploadLogo(file);
      if (success && onLogoChange && logoUrl) {
        onLogoChange(logoUrl);
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const renderContent = () => {
    if (isLoading || isUploading) {
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

  const avatarSize = typeof size === 'number' ? size : 
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
            cursor: showUploadButton ? 'pointer' : 'default',
            border: error ? '1px solid #ff4d4f' : undefined,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            backgroundColor: 'transparent',
          }}
          onClick={showUploadButton ? handleUploadClick : undefined}
        >
          {renderContent()}
        </Avatar>
      </Tooltip>

      {showUploadButton && (
        <Tooltip title="Upload new logo">
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              backgroundColor: '#1890ff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px solid white',
            }}
            onClick={handleUploadClick}
          >
            <PictureOutlined style={{ fontSize: 8, color: 'white' }} />
          </div>
        </Tooltip>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
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
  return <Logo {...props} showUploadButton={false} />;
};

// Export a version with upload capability
export const EditableLogo: React.FC<{
  entityId?: string;
  entityType?: string;
  size?: number | 'small' | 'default' | 'large';
  shape?: 'circle' | 'square';
  fallbackIcon?: React.ReactNode;
  onLogoChange?: (url: string) => void;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}> = (props) => {
  return <Logo {...props} showUploadButton={true} />;
}; 