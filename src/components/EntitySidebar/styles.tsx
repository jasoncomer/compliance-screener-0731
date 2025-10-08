import React from 'react';

import { Card,Typography } from 'antd';

import { cn } from '../../lib/utils';

const { Title } = Typography;

interface SidebarCardProps {
  children: React.ReactNode;
  $hasContent: boolean;
  className?: string;
}

export const SidebarCard: React.FC<SidebarCardProps> = ({ children, className }) => (
  <Card className={cn(
    "flex flex-col h-full overflow-hidden rounded-lg bg-white dark:bg-gray-900",
    "max-h-[calc(100vh-200px)] min-h-[400px]",
    className
  )}>
    {children}
  </Card>
);

interface ScrollableContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollableContent: React.FC<ScrollableContentProps> = ({ children, className }) => (
  <div className={cn(
    "flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
    "pr-2",
    "max-h-[calc(100vh-250px)] min-h-[350px]",
    "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
    "scrollbar-track-transparent",
    className
  )}>
    {children}
  </div>
);

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ children, className }) => (
  <div className={cn("mb-3 last:mb-0 Section", className)}>
    {children}
  </div>
);

interface SectionTitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, level = 4, className }) => (
  <Title 
    level={level}
    className={cn("mt-0 text-base", className)}
  >
    {children}
  </Title>
);

interface EntityListProps {
  children: React.ReactNode;
  className?: string;
}

export const EntityList: React.FC<EntityListProps> = ({ children, className }) => (
  <div className={cn("grid grid-cols-1 gap-2 mt-0", className)}>
    {children}
  </div>
);

interface StyledCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const StyledCard: React.FC<StyledCardProps> = ({ children, onClick, className }) => (
  <Card 
    onClick={onClick}
    className={cn(
      "cursor-pointer transition-all duration-300 mb-0 rounded-lg",
      "border border-gray-300 dark:border-gray-700",
      "bg-white dark:bg-gray-800",
      "hover:shadow-lg hover:-translate-y-0.5",
      "hover:border-gray-400 dark:hover:border-gray-600",
      className
    )}
    styles={{ body: { padding: '12px', borderRadius: '8px' } }}
  >
    {children}
  </Card>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={cn("flex items-center gap-3", className)}>
    {children}
  </div>
);

interface EntityInfoProps {
  children: React.ReactNode;
  className?: string;
}

export const EntityInfo: React.FC<EntityInfoProps> = ({ children, className }) => (
  <div className={cn("flex-1", className)}>
    {children}
  </div>
);

interface ScrollableSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollableSection: React.FC<ScrollableSectionProps> = ({ children, className }) => (
  <div className={cn(
    "overflow-y-auto overflow-x-hidden relative",
    "max-h-92",
    "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
    "scrollbar-track-transparent",
    className
  )}>
    {children}
  </div>
);

interface ScrollMoreMessageProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollMoreMessage: React.FC<ScrollMoreMessageProps> = ({ children, className }) => (
  <div className={cn(
    "text-center py-1 text-gray-600 dark:text-gray-400 text-xs",
    className
  )}>
    {children}
  </div>
); 