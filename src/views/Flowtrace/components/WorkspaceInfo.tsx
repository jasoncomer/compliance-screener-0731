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
    <div className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      <div className="flex items-center gap-1">
        <GitBranch className="h-3.5 w-3.5" />
        <span className="font-medium">{workspaceName}</span>
      </div>
      
      {versionName && (
        <Badge variant="outline" className="text-xs">
          {versionName}
        </Badge>
      )}
      
      {hasUnsavedChanges && (
        <Badge variant="destructive" className="text-xs">
          Unsaved
        </Badge>
      )}
      
      {versionTimestamp && (
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{formatTimestamp(versionTimestamp)}</span>
        </div>
      )}
    </div>
  );
};