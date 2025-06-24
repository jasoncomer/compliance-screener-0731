import React from 'react';
import { cn } from '../lib/utils';
import { Theme } from '../context/ThemeContext';

interface StyledLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const StyledLayout: React.FC<StyledLayoutProps> = ({ children, className }) => (
  <div className={cn("min-h-screen", className)}>
    {children}
  </div>
);

interface StyledHeaderProps {
  children: React.ReactNode;
  $theme: Theme;
  className?: string;
}

export const StyledHeader: React.FC<StyledHeaderProps> = ({ children, $theme, className }) => (
  <header className={cn(
    "sticky top-0 z-50 px-6 h-12 flex items-center justify-between shadow-lg",
    $theme === 'light' ? "bg-white" : "bg-gray-900",
    className
  )}>
    {children}
  </header>
);

interface HeaderSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ children, className }) => (
  <div className={cn("flex items-center gap-6", className)}>
    {children}
  </div>
);

interface LogoProps {
  src: string;
  alt?: string;
  $theme: Theme;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ src, alt, $theme, className }) => (
  <img 
    src={src}
    alt={alt}
    className={cn(
      "h-12 mt-0",
      $theme === 'dark' ? "brightness-90" : "",
      className
    )}
  />
);

interface StyledContentProps {
  children: React.ReactNode;
  $theme: Theme;
  className?: string;
}

export const StyledContent: React.FC<StyledContentProps> = ({ children, $theme, className }) => (
  <main className={cn(
    "p-6 overflow-auto min-h-[calc(100vh-50px)]",
    $theme === 'light' ? "bg-white" : "bg-gray-900",
    className
  )}>
    {children}
  </main>
);

interface MainContentProps {
  children: React.ReactNode;
  $theme: Theme;
  sidebarCollapsed: boolean;
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({ children, $theme, className }) => (
  <main className={cn(
    "transition-all duration-300 p-8 overflow-auto flex-1",
    $theme === 'light' ? "bg-gray-50" : "bg-gray-800",
    className
  )}>
    {children}
  </main>
);

interface UserMenuButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  $theme: Theme;
  className?: string;
}

export const UserMenuButton: React.FC<UserMenuButtonProps> = ({ children, onClick, $theme, className }) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 cursor-pointer text-brand-primary px-2 py-1 h-10 rounded-md transition-all duration-300 bg-transparent",
      $theme === 'light' 
        ? "hover:bg-orange-100/50" 
        : "hover:bg-orange-900/20",
      "[&_.anticon]:text-base",
      "[&_span]:text-sm [&_span]:font-medium",
      className
    )}
  >
    {children}
  </div>
);

interface TabsContainerProps {
  children: React.ReactNode;
  $theme: Theme;
  className?: string;
}

export const TabsContainer: React.FC<TabsContainerProps> = ({ children, $theme, className }) => (
  <div className={cn(
    "[&_.ant-tabs-nav]:mb-0",
    $theme === 'light' 
      ? "[&_.ant-tabs-nav]:bg-white" 
      : "[&_.ant-tabs-nav]:bg-gray-900",
    className
  )}>
    {children}
  </div>
); 