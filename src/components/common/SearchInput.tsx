import React, { forwardRef, useRef } from 'react';

import { Loader2, Search } from 'lucide-react';

import { cn } from '../../lib/utils';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  variant?: 'default' | 'compact' | 'with-action';
  loading?: boolean;
  onSearch?: (value: string) => void;
  actionButton?: React.ReactNode;
  error?: boolean;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  variant = 'default',
  loading = false,
  onSearch,
  actionButton,
  error = false,
  className,
  disabled,
  value,
  onChange,
  onKeyPress,
  ...props
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch((e.target as HTMLInputElement).value);
    }
    onKeyPress?.(e);
  };

  const sizeClasses = {
    default: 'h-11 px-4 pr-12',
    compact: 'h-9 px-3 pr-10',
    'with-action': 'h-11 px-4 pr-4'
  };

  const iconSizeClasses = {
    default: 'w-5 h-5',
    compact: 'w-4 h-4',
    'with-action': 'w-5 h-5'
  };

  return (
    <div className="relative flex items-center">
      <input
        ref={(node) => {
          if (inputRef) {
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        type="text"
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        disabled={disabled || loading}
        data-search-input="search"
        className={cn(
          'w-full rounded-lg border transition-colors outline-none',
          'bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-white',
          'placeholder-gray-500 dark:placeholder-gray-400',
          'focus:ring-2 focus:ring-orange-500/20',
          sizeClasses[variant],
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-700 focus:border-orange-500',
          (disabled || loading) && 'cursor-not-allowed opacity-50',
          variant === 'with-action' && 'rounded-r-none',
          className
        )}
        {...props}
      />
      
      {variant !== 'with-action' && (
        <div className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2',
          'text-gray-400 dark:text-gray-500'
        )}>
          {loading ? (
            <Loader2 className={cn(iconSizeClasses[variant], 'animate-spin')} />
          ) : (
            <Search className={iconSizeClasses[variant]} />
          )}
        </div>
      )}

      {variant === 'with-action' && actionButton}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;