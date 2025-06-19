import React from 'react';
import { cn } from '../lib/utils';

interface BtnDivProps {
  children: React.ReactNode;
  className?: string;
}

export const BtnDiv: React.FC<BtnDivProps> = ({ children, className }) => (
  <div className={cn("flex w-full gap-4 justify-end mt-4", className)}>
    {children}
  </div>
);

interface FormWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const FormWrapper: React.FC<FormWrapperProps> = ({ children, className }) => (
  <div className={cn("flex flex-col items-center mx-auto", className)}>
    <div className={cn("flex flex-col w-96 gap-4", className)}>
      {children}
    </div>
  </div>
);
