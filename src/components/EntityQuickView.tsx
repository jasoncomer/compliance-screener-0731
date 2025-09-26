import React from 'react';
import ReactDOM from 'react-dom';

import { Eye, Globe, Send, Twitter, User } from 'lucide-react';

import { SOT } from '../typings/interfaces';
import { EEntityType } from '../typings/SOT';
import { getEntityTypeLabel } from '../utils/display-labels';

import { SimpleLogo } from './common/Logo';

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
        tags.push(
          <span
            key={i}
            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            {tag}
          </span>
        );
      }
    }
    return tags.length > 0 ? tags : <span className="text-gray-500 dark:text-gray-400">None</span>;
  };

  const renderAssociatedCountries = () => {
    const countries = [];
    for (let i = 1; i <= 6; i++) {
      const country = sot[`associate_country_${i}` as keyof SOT];
      if (country && typeof country === 'string' && country.trim() !== '') {
        countries.push(
          <span
            key={i}
            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          >
            {country}
          </span>
        );
      }
    }
    return countries.length > 0 ? countries : <span className="text-gray-500 dark:text-gray-400">None</span>;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {sot.proper_name || sot.entity_id}
        </h3>
        <SimpleLogo
          entityId={sot.entity_id}
          entityType={sot.entity_type}
          size="small"
          fallbackIcon={<User className="h-4 w-4" />}
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex">
          <span className="w-32 text-sm text-gray-600 dark:text-gray-400">Entity Type:</span>
          <span className="flex-1 text-sm text-gray-900 dark:text-white">
            {sot.entity_type ? getEntityTypeLabel(sot.entity_type as EEntityType) : 'Unknown'}
          </span>
        </div>
      
        {sot.url && (
          <div className="flex">
            <span className="w-32 text-sm text-gray-600 dark:text-gray-400">Website:</span>
            <a
              href={sot.url?.startsWith('http') ? sot.url : `https://${sot.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Globe className="h-3 w-3" />
              {sot.url}
            </a>
          </div>
        )}
      
        {sot.contact_twitter && (
          <div className="flex">
            <span className="w-32 text-sm text-gray-600 dark:text-gray-400">Twitter:</span>
            <a
              href={`https://twitter.com/${sot.contact_twitter.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Twitter className="h-3 w-3" />
              {sot.contact_twitter}
            </a>
          </div>
        )}
      
        {sot.contact_telegram && (
          <div className="flex">
            <span className="w-32 text-sm text-gray-600 dark:text-gray-400">Telegram:</span>
            <a
              href={`https://t.me/${sot.contact_telegram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Send className="h-3 w-3" />
              {sot.contact_telegram}
            </a>
          </div>
        )}
      
        <div className="flex">
          <span className="w-32 text-sm text-gray-600 dark:text-gray-400">Entity Tags:</span>
          <div className="flex-1 flex flex-wrap gap-1">
            {renderEntityTags()}
          </div>
        </div>
      
        <div className="flex">
          <span className="w-32 text-sm text-gray-600 dark:text-gray-400">Countries:</span>
          <div className="flex-1 flex flex-wrap gap-1">
            {renderAssociatedCountries()}
          </div>
        </div>
      
        {sot.description_merged && (
          <div className="flex flex-col">
            <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description:</span>
            <span className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
              {sot.description_merged.length > 300
                ? `${sot.description_merged.substring(0, 300)}...`
                : sot.description_merged}
            </span>
          </div>
        )}

        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={() => onViewFull(sot)}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            View Full Profile
          </button>
        </div>
      </div>
    </div>
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
  const [isOpen, setIsOpen] = React.useState(false);
  const [buttonRect, setButtonRect] = React.useState<DOMRect | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const openTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isOverButtonRef = React.useRef(false);
  const isOverPopoverRef = React.useRef(false);

  const handleButtonMouseEnter = () => {
    isOverButtonRef.current = true;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    if (!isOpen) {
      openTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, 300);
    }
  };

  const handleButtonMouseLeave = () => {
    isOverButtonRef.current = false;
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    // Only start close timer if not over popover
    if (!isOverPopoverRef.current) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 100); // Reduced delay to make it more responsive
    }
  };

  const handlePopoverMouseEnter = () => {
    isOverPopoverRef.current = true;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    isOverPopoverRef.current = false;
    // Only close if also not over button
    if (!isOverButtonRef.current) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 100);
    }
  };

  React.useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Calculate popover position based on button position
  const getPopoverStyle = () => {
    if (!buttonRect) return {};

    const spacing = 4; // reduced spacing from button to minimize gap
    const style: React.CSSProperties = {
      position: 'fixed',
      width: popoverWidth,
      zIndex: 9999,
    };

    // Calculate position based on placement
    switch (popoverPlacement) {
      case 'top':
      case 'topLeft':
      case 'topRight':
        style.bottom = window.innerHeight - buttonRect.top + spacing;
        style.left = buttonRect.left + buttonRect.width / 2 - popoverWidth / 2;
        break;
      case 'bottom':
      case 'bottomLeft':
      case 'bottomRight':
        style.top = buttonRect.bottom + spacing;
        style.left = buttonRect.left + buttonRect.width / 2 - popoverWidth / 2;
        break;
      case 'left':
      case 'leftTop':
      case 'leftBottom':
        style.top = buttonRect.top;
        style.right = window.innerWidth - buttonRect.left + spacing;
        break;
      case 'right':
      case 'rightTop':
      case 'rightBottom':
      default:
        style.top = buttonRect.top;
        style.left = buttonRect.right + spacing;
        break;
    }

    // Ensure popover stays within viewport
    if (style.left !== undefined && typeof style.left === 'number') {
      style.left = Math.max(10, Math.min(style.left, window.innerWidth - popoverWidth - 10));
    }
    if (style.top !== undefined && typeof style.top === 'number') {
      style.top = Math.max(10, Math.min(style.top, window.innerHeight - 400));
    }

    return style;
  };

  // Get bridge style to create invisible connection between button and popover
  const getBridgeStyle = () => {
    if (!buttonRect) return {};

    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9998,
    };

    // Create invisible bridge based on placement
    switch (popoverPlacement) {
      case 'right':
      case 'rightTop':
      case 'rightBottom':
      default:
        style.top = buttonRect.top;
        style.left = buttonRect.right;
        style.width = 20;
        style.height = buttonRect.height;
        break;
    }

    return style;
  };

  const popoverContent = isOpen && sot && (
    <>
      {/* Invisible bridge to maintain hover state when moving between button and popover */}
      <div
        style={getBridgeStyle()}
        onMouseEnter={handlePopoverMouseEnter}
        onMouseLeave={handlePopoverMouseLeave}
      />
      <div
        style={getPopoverStyle()}
        onMouseEnter={handlePopoverMouseEnter}
        onMouseLeave={handlePopoverMouseLeave}
      >
        <div className="max-h-[550px] overflow-y-auto rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
          <CompactSOTView sot={sot} onViewFull={onViewFull} />
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        className={`p-1 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all hover:scale-110 ${className || ''}`}
        onClick={(e) => onQuickView(e, entity._id)}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
      >
        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      {/* Render popover using React Portal to escape modal context */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(popoverContent, document.body)}
    </>
  );
};

export default EntityQuickView; 