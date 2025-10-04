import React from 'react';

import { Clock,GitBranch } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface WorkspaceInfoProps {
  workspaceName?: string;
  versionName?: string;
  versionTimestamp?: string;
  hasUnsavedChanges?: boolean;
  className?: string;
}

export const WorkspaceInfo: React.FC<WorkspaceInfoProps> = ({
  workspaceName,
  versionName,
  versionTimestamp,
  hasUnsavedChanges = false,
  className = ''
}) => {
  if (!workspaceName) {
    return null;
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{workspaceName}</span>
        </div>

        {versionName && (
          <Badge variant="outline" className="text-xs">
            {versionName}
          </Badge>
        )}
      </div>

      {versionTimestamp && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTimestamp(versionTimestamp)}</span>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 ml-auto">
              Unsaved
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};