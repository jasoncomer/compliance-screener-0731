import React from 'react';

import { cn } from '../../../lib/utils';

interface AddressLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AddressLayout: React.FC<AddressLayoutProps> = ({ children, className }) => (
  <div className={cn(
    "flex flex-col h-screen w-full overflow-hidden font-mono",
    className
  )}>
    {children}
  </div>
);

interface FixedAddressHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const FixedAddressHeader: React.FC<FixedAddressHeaderProps> = ({ children, className }) => (
  <div className={cn(
    "sticky top-0 w-full z-10",
    className
  )}>
    {children}
  </div>
);

interface ScrollableAddressContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollableAddressContent: React.FC<ScrollableAddressContentProps> = ({ children, className }) => (
  <div className={cn(
    "flex-1 w-full overflow-y-auto",
    className
  )}>
    {children}
  </div>
);

interface SummaryWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const SummaryWrapper: React.FC<SummaryWrapperProps> = ({ children, className }) => (
  <div className={cn(
    "flex justify-between flex-row text-sm pt-2.5 gap-8",
    className
  )}>
    {children}
  </div>
);

interface SummaryColumnProps {
  children: React.ReactNode;
  className?: string;
}

export const SummaryColumn: React.FC<SummaryColumnProps> = ({ children, className }) => (
  <div className={cn(
    "flex flex-col items-start gap-6 flex-1",
    className
  )}>
    {children}
  </div>
);

interface SummaryRowProps {
  children: React.ReactNode;
  className?: string;
}

export const SummaryRow: React.FC<SummaryRowProps> = ({ children, className }) => (
  <div className={cn(
    "flex justify-between w-full",
    className
  )}>
    {children}
  </div>
);

interface AddressInfoWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const AddressInfoWrapper: React.FC<AddressInfoWrapperProps> = ({ children, className }) => (
  <div className={cn(
    "flex flex-col gap-2",
    className
  )}>
    {children}
  </div>
);

interface EntityRowProps {
  children: React.ReactNode;
  className?: string;
}

export const EntityRow: React.FC<EntityRowProps> = ({ children, className }) => (
  <div className={cn(
    "flex items-center gap-4 p-3 bg-gray-100 dark:bg-background rounded mb-2 flex-1 min-w-0",
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