import React from 'react';
import { cn } from '../../lib/utils';

interface AddressLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AddressLayout: React.FC<AddressLayoutProps> = ({ children, className }) => (
  <div className={cn("flex flex-col h-full w-full overflow-hidden", className)}>
    {children}
  </div>
);

interface FixedAddressHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const FixedAddressHeader: React.FC<FixedAddressHeaderProps> = ({ children, className }) => (
  <div className={cn("sticky top-0 w-full bg-white dark:bg-gray-900 z-10", className)}>
    {children}
  </div>
);

interface ScrollableAddressContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollableAddressContent: React.FC<ScrollableAddressContentProps> = ({ children, className }) => (
  <div className={cn("flex-1 w-full overflow-y-auto pt-5", className)}>
    {children}
  </div>
);

interface SummaryWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const SummaryWrapper: React.FC<SummaryWrapperProps> = ({ children, className }) => (
  <div className={cn("flex justify-between flex-row", className)}>
    {children}
  </div>
);

interface AddressInfoWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const AddressInfoWrapper: React.FC<AddressInfoWrapperProps> = ({ children, className }) => (
  <div className={cn("flex flex-col gap-3", className)}>
    {children}
  </div>
);

interface EntityRowProps {
  children: React.ReactNode;
  className?: string;
}

export const EntityRow: React.FC<EntityRowProps> = ({ children, className }) => (
  <div className={cn(
    "flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded mb-2 flex-1 min-w-0",
    className
  )}>
    {children}
  </div>
);

interface EntitiesContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const EntitiesContainer: React.FC<EntitiesContainerProps> = ({ children, className }) => (
  <div className={cn("flex gap-2 flex-wrap w-full", className)}>
    {children}
  </div>
);

interface EntityInfoProps {
  children: React.ReactNode;
  className?: string;
}

export const EntityInfo: React.FC<EntityInfoProps> = ({ children, className }) => (
  <div className={cn("flex gap-12 items-start", className)}>
    {children}
  </div>
);

interface RiskScoreLinkProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const RiskScoreLink: React.FC<RiskScoreLinkProps> = ({ children, onClick, className }) => (
  <div 
    className={cn("cursor-pointer flex items-center text-brand-primary hover:underline", className)}
    onClick={onClick}
  >
    {children}
  </div>
);