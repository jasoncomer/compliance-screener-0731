import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  message = 'Loading...',
  size = 'md',
  className = ''
}) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
    </div>
  );
};

// Full screen loading overlay
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
}> = ({ isLoading, message = 'Loading data...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <span className="text-lg font-medium">{message}</span>
      </div>
    </div>
  );
};

// Inline loading for specific components
export const InlineLoading: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ isLoading, children, fallback }) => {
  if (isLoading) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <LoadingIndicator isLoading={true} size="sm" />
    );
  }

  return <>{children}</>;
};
