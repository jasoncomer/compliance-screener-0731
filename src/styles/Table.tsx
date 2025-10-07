import React from 'react';

import { cn } from '../lib/utils';

interface BsBlockProps {
  children: React.ReactNode;
  className?: string;
}

export const BsBlock: React.FC<BsBlockProps> = ({ children, className }) => (
  <div className={cn(
    "rounded-md border-2 border-gray-300 dark:border-gray-600",
    "bg-white dark:bg-background",
    "text-black dark:text-white",
    "[&_h3]:text-black [&_h3]:dark:text-white",
    "[&_hr]:border-gray-200 [&_hr]:dark:border-gray-700",
    className
  )}>
    {children}
  </div>
);