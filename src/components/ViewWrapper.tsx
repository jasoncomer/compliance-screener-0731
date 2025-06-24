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
        "w-full min-h-screen bg-background text-foreground font-['Inter']",
        "px-6 py-8 lg:px-8",
        fullWidth ? "max-w-full" : "max-w-7xl mx-auto",
        className
      )}
    >
      {title && (
        <header className="mb-8">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex items-center justify-center w-8 h-8 text-muted-foreground">
                {icon}
              </div>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-['Inter']">
              {title}
            </h1>
          </div>
        </header>
      )}
      <main className="space-y-6 font-['Inter']">
        {children}
      </main>
    </div>
  );
};

export default ViewWrapper; 