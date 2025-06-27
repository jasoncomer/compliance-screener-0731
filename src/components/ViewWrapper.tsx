import React, { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface ViewWrapperProps {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ 
  icon, 
  title, 
  children, 
  className,
  fullWidth = false
}) => {
  return (
    <div 
      className={cn(
        "w-full h-auto p-5",
        "bg-white dark:bg-gray-900",
        fullWidth ? "max-w-full" : "max-w-6xl",
        "view-wrapper",
        className
      )}
    >
      {title && (
        <div className="flex items-center mb-4 mt-0">
          {icon && <span className="mr-2">{icon}</span>}
          <h2 className="m-0 text-3xl">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
};

export default ViewWrapper; 