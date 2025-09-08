import React, { forwardRef, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Force dark mode styling via direct DOM manipulation
  useEffect(() => {
    const input = inputRef.current;
    if (input && theme === 'dark') {
      // Force the background color directly with multiple approaches
      input.style.setProperty('background-color', '#1f2937', 'important');
      input.style.setProperty('color', '#ffffff', 'important');
      input.style.setProperty('border-color', '#374151', 'important');
      
      // Also set the background using setAttribute for maximum compatibility
      input.setAttribute('style', 
        input.getAttribute('style') + 
        '; background-color: #1f2937 !important; color: #ffffff !important; border-color: #374151 !important;'
      );
      
      // Also set placeholder color
      const style = document.createElement('style');
      style.textContent = `
        input[data-search-input="${input.id || 'search'}"]::placeholder {
          color: #9ca3af !important;
        }
      `;
      document.head.appendChild(style);
      
      // Force a re-render by toggling a class
      input.classList.add('force-dark-mode');
      
      return () => {
        document.head.removeChild(style);
        input.classList.remove('force-dark-mode');
      };
    }
  }, [theme]);

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
          inputRef.current = node;
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
          'search-input-dark-mode', // Add a specific class for targeting
          className
        )}
        style={{
          ...props.style,
          backgroundColor: theme === 'dark' ? '#1f2937' : undefined,
          color: theme === 'dark' ? '#ffffff' : undefined,
          borderColor: theme === 'dark' ? '#374151' : undefined,
        }}
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