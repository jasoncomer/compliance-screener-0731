import React from 'react';
import { User } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import EntityQuickView from '../../../components/EntityQuickView';
import { SimpleLogo } from '../../../components/common/Logo';
import { ConsolidatedEntity } from '../types';
import { SOT } from '../../../typings/interfaces';
import { EEntityType } from '../../../typings/SOT';
import { getEntityTypeLabel } from '../../../utils/display-labels';

interface EntityOptionProps {
  entity: ConsolidatedEntity;
  sotMap: Record<string, SOT>;
  handleQuickView: (e: React.MouseEvent, entityId: string) => void;
  handleViewFullProfile: (sot: SOT) => void;
  isHighlighted: boolean;
  onClick: () => void;
}

const EntityOption: React.FC<EntityOptionProps> = React.memo(({ 
  entity, 
  sotMap, 
  handleQuickView, 
  handleViewFullProfile, 
  isHighlighted, 
  onClick 
}) => (
  <div
    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
      isHighlighted ? 'bg-gray-100 dark:bg-gray-700' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0">
        {entity.entity_id ? (
          <SimpleLogo
            entityId={entity.entity_id}
            entityType={entity.entity_type}
            size={32}
            fallbackIcon={<User className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{entity.proper_name || entity.entity_id}</span>
          <EntityQuickView 
            entity={entity}
            sot={sotMap[entity._id]}
            onViewFull={handleViewFullProfile}
            onQuickView={handleQuickView}
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {entity.entity_type && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {getEntityTypeLabel(entity.entity_type as EEntityType)}
            </Badge>
          )}
          {entity.urls && entity.urls[0] && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {entity.urls[0]}
            </Badge>
          )}
          {entity.contact_twitter && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
              Twitter
            </Badge>
          )}
          {entity.contact_telegram && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Telegram
            </Badge>
          )}
          {entity.associate_countries.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              {entity.associate_countries[0]}
            </Badge>
          )}
        </div>
      </div>
    </div>
  </div>
));

EntityOption.displayName = 'EntityOption';

export default EntityOption; 