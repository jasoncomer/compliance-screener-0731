import React, { ReactNode } from 'react';

import { cn } from '../lib/utils';

interface ViewWrapperProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ 
  icon, 
  title, 
  description,
  children, 
  className,
  fullWidth = false
}) => {
  
  
  return (
    <div
      className={cn(
        "w-full min-h-full bg-background text-foreground font-['Inter']",
        "px-4 py-6 lg:px-6 lg:py-8",
        fullWidth ? "max-w-full" : "max-w-7xl mx-auto",
        className
      )}
    >
      {title && (
        <header className="mb-3 lg:mb-4">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className="flex items-center justify-center w-8 h-8">
                {icon}
              </div>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-['Inter']">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-muted-foreground ml-11">
              {description}
            </p>
          )}
        </header>
      )}
      <main className="font-['Inter']">
        {children}
      </main>
    </div>
  );
};

export default ViewWrapper; 