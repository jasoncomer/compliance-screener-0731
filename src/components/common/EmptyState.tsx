import React from 'react';
import { 
  Search, 
  AlertCircle, 
  FileSearch,
  Inbox
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  variant?: 'search' | 'no-data' | 'error' | 'initial';
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-data',
  icon,
  title,
  description,
  action,
  className
}) => {
  const defaultIcons = {
    search: <Search className="w-12 h-12" />,
    'no-data': <Inbox className="w-12 h-12" />,
    error: <AlertCircle className="w-12 h-12" />,
    initial: <FileSearch className="w-12 h-12" />
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center",
      className
    )}>
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center mb-4",
        variant === 'error' 
          ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
          : "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
      )}>
        {displayIcon}
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;