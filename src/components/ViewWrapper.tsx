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
  const { theme } = useTheme();
  
  


  return (
    <div 
      className={cn(
        "w-full min-h-full bg-background text-foreground font-['Inter']",
        "px-4 py-6 lg:px-6 lg:py-8",
        fullWidth ? "max-w-none" : "max-w-7xl mx-auto",
        className
      )}
    >
      {title && (
        <header className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex items-center justify-center w-8 h-8 text-muted-foreground">
                {icon}
              </div>
            )}
            <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground font-['Inter']">
              {title}
            </h1>
          </div>
        </header>
      )}
      <main className="font-['Inter']">
        {children}
      </main>
    </div>
  );
};

export default ViewWrapper; 