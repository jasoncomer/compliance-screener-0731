import React from 'react';
import { Card } from 'antd';
import { cn } from '../../lib/utils';

interface StyledCardProps {
  children: React.ReactNode;
  className?: string;
  formView?: boolean;
}

export const StyledCard: React.FC<StyledCardProps> = ({ children, className, formView }) => (
  <Card 
    className={cn(
      "max-w-[800px] w-fit mx-auto shadow-lg",
      formView && "max-w-[600px] w-full",
      className
    )}
    bodyStyle={{ padding: '32px', width: '100%' }}
  >
    {children}
  </Card>
);

interface WelcomeContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const WelcomeContainer: React.FC<WelcomeContainerProps> = ({ children, className }) => (
  <div className={cn(
    "w-full min-h-[calc(100vh-64px)] flex flex-col items-center bg-white dark:bg-gray-900",
    className
  )}>
    {children}
  </div>
);

interface ContentWrapperProps {
  children: React.ReactNode;
  state: 'entering' | 'exiting' | 'stable';
  className?: string;
}

export const ContentWrapper: React.FC<ContentWrapperProps> = ({ children, state, className }) => (
  <div className={cn(
    "min-h-[100px] transition-all duration-500 ease-in-out",
    state === 'entering' && "animate-fadeIn",
    state === 'exiting' && "animate-fadeOut", 
    state === 'stable' && "opacity-100",
    className
  )}>
    {children}
  </div>
);

interface WelcomeHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ children, className }) => (
  <div className={cn("text-center mb-8", className)}>
    {children}
  </div>
);

interface ActionButtonsProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ children, className }) => (
  <div className={cn("flex gap-3 justify-end mt-8", className)}>
    {children}
  </div>
);

interface OptionCardProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({ children, selected, onClick, className }) => (
  <div 
    className={cn(
      "p-8 border-2 rounded-xl cursor-pointer transition-all duration-500 mb-6 bg-white dark:bg-gray-800",
      "hover:border-brand-primary hover:-translate-y-0.5 hover:shadow-lg",
      selected 
        ? "border-brand-primary dark:border-brand-primary" 
        : "border-gray-300 dark:border-gray-600",
      className
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

interface LoadingWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({ children, className }) => (
  <div className={cn("flex flex-col items-center justify-center p-12 gap-4", className)}>
    {children}
  </div>
);

interface FormContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({ children, className }) => (
  <div className={cn("w-full", className)}>
    {children}
  </div>
);