import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { EyeIcon, EyeOffIcon, SearchIcon, LoaderIcon } from 'lucide-react';

export interface CustomInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'size' | 'type'> {
  error?: boolean;
  multiline?: boolean;
  rows?: number;
  onSearch?: (value: string) => void;
  loading?: boolean;
  enterButton?: boolean | React.ReactNode;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, CustomInputProps>(
  ({
    error,
    type = 'text',
    multiline = false,
    rows = 4,
    className,
    onSearch,
    loading,
    enterButton,
    onChange,
    onKeyDown,
    value,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [searchValue, setSearchValue] = useState(value || '');

    const baseInputClasses = cn(
      "w-full h-12 px-4 rounded-xl text-sm font-normal transition-all duration-200",
      "border-2 border-gray-200 dark:border-gray-700",
      "bg-white dark:bg-gray-800",
      "text-gray-900 dark:text-gray-50",
      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
      "hover:border-gray-300 dark:hover:border-gray-600",
      "hover:bg-gray-50 dark:hover:bg-gray-800/80",
      "focus:border-[#e87e4f] dark:focus:border-[#e87e4f]",
      "focus:outline-none focus:ring-2 focus:ring-[#e87e4f]/20",
      error && "border-red-500 dark:border-red-500 hover:border-red-500 dark:hover:border-red-500",
      className
    );

    const textareaClasses = cn(
      "w-full p-4 rounded-xl text-sm font-normal transition-all duration-200 resize-none",
      "border-2 border-gray-200 dark:border-gray-700",
      "bg-white dark:bg-gray-800",
      "text-gray-900 dark:text-gray-50",
      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
      "hover:border-gray-300 dark:hover:border-gray-600",
      "hover:bg-gray-50 dark:hover:bg-gray-800/80",
      "focus:border-[#e87e4f] dark:focus:border-[#e87e4f]",
      "focus:outline-none focus:ring-2 focus:ring-[#e87e4f]/20",
      error && "border-red-500 dark:border-red-500 hover:border-red-500 dark:hover:border-red-500",
      className
    );

    // Handle search input
    if (onSearch) {
      const handleSearch = () => {
        if (onSearch && !loading) {
          onSearch(searchValue as string);
        }
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !loading) {
          handleSearch();
        }
        onKeyDown?.(e as any);
      };

      return (
        <div className="relative flex">
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type="text"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              onChange?.(e as any);
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              baseInputClasses,
              "rounded-r-none border-r-0 focus:border-r-2",
              enterButton && "pr-2"
            )}
            {...props as React.InputHTMLAttributes<HTMLInputElement>}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className={cn(
              "px-6 h-12 rounded-r-xl font-medium text-sm transition-all duration-200",
              "border-2 border-l-0 border-gray-200 dark:border-gray-700",
              "bg-gray-50 dark:bg-gray-700",
              "text-gray-900 dark:text-gray-50",
              "hover:bg-gray-100 dark:hover:bg-gray-600",
              "hover:border-gray-300 dark:hover:border-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-[#e87e4f]/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-red-500 dark:border-red-500"
            )}
          >
            {loading ? (
              <LoaderIcon className="w-4 h-4 animate-spin" />
            ) : enterButton === true || !enterButton ? (
              <SearchIcon className="w-4 h-4" />
            ) : (
              enterButton
            )}
          </button>
        </div>
      );
    }

    // Handle multiline textarea
    if (multiline) {
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          rows={rows}
          value={value}
          onChange={onChange as any}
          className={textareaClasses}
          {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
        />
      );
    }

    // Handle password input with toggle
    if (type === 'password') {
      return (
        <div className="relative">
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={onChange as any}
            className={cn(baseInputClasses, "pr-12")}
            {...props as React.InputHTMLAttributes<HTMLInputElement>}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOffIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      );
    }

    // Handle regular input
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type={type}
        value={value}
        onChange={onChange as any}
        className={baseInputClasses}
        {...props as React.InputHTMLAttributes<HTMLInputElement>}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;