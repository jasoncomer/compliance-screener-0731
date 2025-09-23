import React from 'react';

import { EyeOutlined } from '@ant-design/icons';

import { EEntityType } from '../typings/SOT';
import { getEntityTypeLabel } from '../utils/display-labels';

interface EntityDisplayCardProps {
  entityId: string;
  entityName?: string;
  entityType?: EEntityType | string;
  logoUrl?: string;
  onViewFull?: () => void;
  onQuickView?: (e: React.MouseEvent) => void;
  showViewButton?: boolean;
}

const EntityDisplayCard: React.FC<EntityDisplayCardProps> = ({
  entityId,
  entityName,
  entityType,
  logoUrl,
  onQuickView,
  showViewButton = true
}) => {
  const displayName = entityName || entityId;
  const typeLabel = entityType ? getEntityTypeLabel(entityType as EEntityType) : 'unknown';

  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-3">
        <img 
          src={logoUrl || `https://storage.googleapis.com/entity-logos/${entityId}.jpg`}
          alt={`${displayName} logo`}
          className="w-[30px] h-[30px] rounded-sm object-contain"
          onError={(e) => {
            // Fallback to SimpleLogo if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const logoContainer = document.createElement('div');
              logoContainer.className = 'w-[30px] h-[30px] flex items-center justify-center';
              parent.appendChild(logoContainer);
              // We'll need to render SimpleLogo here, but for now just show a placeholder
              logoContainer.innerHTML = '<div class="w-[30px] h-[30px] bg-gray-200 rounded-sm flex items-center justify-center text-xs font-semibold text-gray-600">' + entityId.charAt(0).toUpperCase() + '</div>';
            }
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {displayName}
          </span>
          {showViewButton && onQuickView && (
            <div 
              className="cursor-pointer text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors duration-200 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={(e) => onQuickView(e)}
              title="Quick view"
            >
              <EyeOutlined />
            </div>
          )}
        </div>
      </div>
      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-blue-100 text-blue-800 border-blue-200 text-xs dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
        {typeLabel}
      </div>
    </div>
  );
};

export default EntityDisplayCard;