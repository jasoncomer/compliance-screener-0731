import React from 'react';

import { User } from 'lucide-react';

import { SOT } from '../../typings/interfaces';
import { EEntityType } from '../../typings/SOT';
import { getEntityTypeLabel } from '../../utils/display-labels';
import { SimpleLogo } from '../common/Logo';
import { cn } from '@/design-system/utils';

interface EntityListSectionProps {
  entities: SOT[];
  title: string;
  onSelectEntity: (entity: SOT) => void;
}

export const EntityListSection: React.FC<EntityListSectionProps> = ({
  entities,
  title,
  onSelectEntity
}) => {
  if (entities.length === 0) return null;

  return (
    <div className={cn("mb-3 last:mb-0")}>
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-base font-medium m-0 text-gray-900 dark:text-white">
          {title} ({entities.length})
        </h4>
      </div>
      <div className={cn(
        "overflow-y-auto overflow-x-hidden relative",
        "max-h-64",
        "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
        "scrollbar-track-transparent"
      )}>
        <div className={cn("flex flex-col gap-2 pr-2")}>
          {entities.map((entity) => (
            <div
              key={entity._id}
              onClick={() => onSelectEntity(entity)}
              className={cn(
                "cursor-pointer transition-all duration-300 rounded-lg border p-3",
                "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700",
                "hover:shadow-[0_0_0_1px_#e87e4f,0_0_8px_rgba(232,126,79,0.3)]",
                "hover:border-orange-500 dark:hover:border-orange-500"
              )}
            >
              <div className="flex items-center gap-3">
                <SimpleLogo
                  entityId={entity.entity_id}
                  entityType={entity.entity_type}
                  size="default"
                  fallbackIcon={<User className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{entity.proper_name || entity.entity_id}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {getEntityTypeLabel(entity.entity_type as EEntityType)}
                    {entity.associate_country_1 && ` • ${entity.associate_country_1}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 