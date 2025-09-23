import React, { forwardRef, useEffect, useRef,useState } from 'react';

import { AlertCircle, CheckCircle,Loader2, Search } from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { getBlockchainType,isValidBlockchainAddress } from '../../utils/addressValidation';

interface AddressSearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  variant?: 'default' | 'compact' | 'with-action';
  loading?: boolean;
  onSearch?: (value: string) => void;
  actionButton?: React.ReactNode;
  error?: boolean;
  showValidation?: boolean;
  onValidationChange?: (isValid: boolean, blockchainType: string | null) => void;
}

const AddressSearchInput = forwardRef<HTMLInputElement, AddressSearchInputProps>(({
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
  showValidation = true,
  onValidationChange,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');

  // Force dark mode styling via direct DOM manipulation
  useEffect(() => {
    const input = inputRef.current;
    if (input && theme === 'dark') {
      // Force the background color directly
      input.style.setProperty('background-color', '#1f2937', 'important');
      input.style.setProperty('color', '#ffffff', 'important');
      input.style.setProperty('border-color', '#374151', 'important');
      
      // Also set placeholder color
      const style = document.createElement('style');
      style.textContent = `
        input[data-address-search-input="${input.id || 'address-search'}"]::placeholder {
          color: #9ca3af !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [theme]);

  // Validate address whenever value changes
  useEffect(() => {
    if (!value || typeof value !== 'string') {
      setIsValid(null);
      setValidationMessage('');
      onValidationChange?.(false, null);
      return;
    }

    const trimmedValue = value.trim();
    const valid = isValidBlockchainAddress(trimmedValue);
    const type = getBlockchainType(trimmedValue);
    
    setIsValid(valid);
    
    if (valid && type) {
      setValidationMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} address`);
    } else {
      setValidationMessage('Invalid blockchain address');
    }
    
    onValidationChange?.(valid, type);
  }, [value, onValidationChange]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch && isValid) {
      onSearch((e.target as HTMLInputElement).value.trim());
    }
    onKeyPress?.(e);
  };

  const handleSearch = () => {
    if (onSearch && isValid && value) {
      onSearch(value.toString().trim());
    }
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

  const getValidationIcon = () => {
    if (!showValidation || isValid === null) return null;
    
    if (isValid) {
      return <CheckCircle className={cn(iconSizeClasses[variant], 'text-green-500')} />;
    } else {
      return <AlertCircle className={cn(iconSizeClasses[variant], 'text-red-500')} />;
    }
  };

  const getValidationTooltip = () => {
    if (!showValidation || isValid === null) return '';
    return validationMessage;
  };

  return (
    <div className="relative flex flex-col">
      {/* Validation message - moved to top */}
      {showValidation && isValid === false && value && (
        <div className="absolute -top-6 left-0 text-xs text-red-500">
          {validationMessage}
        </div>
      )}
      
      {showValidation && isValid === true && value && (
        <div className="absolute -top-6 left-0 text-xs text-green-500">
          {validationMessage}
        </div>
      )}

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
          data-address-search-input="address-search"
          className={cn(
            'w-full rounded-lg border transition-colors outline-none',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-white',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'focus:ring-2 focus:ring-orange-500/20',
            sizeClasses[variant],
            error || (isValid === false && value)
              ? 'border-red-500 focus:border-red-500'
              : isValid === true
              ? 'border-green-500 focus:border-green-500'
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
            'text-gray-400 dark:text-gray-500',
            'flex items-center space-x-1'
          )}>
            {loading ? (
              <Loader2 className={cn(iconSizeClasses[variant], 'animate-spin')} />
            ) : showValidation && isValid !== null ? (
              <div className="flex items-center space-x-1" title={getValidationTooltip()}>
                {getValidationIcon()}
                {isValid && (
                  <Search 
                    className={cn(iconSizeClasses[variant], 'text-gray-400 dark:text-gray-500 cursor-pointer')}
                    onClick={handleSearch}
                  />
                )}
              </div>
            ) : (
              <Search className={iconSizeClasses[variant]} />
            )}
          </div>
        )}

        {variant === 'with-action' && actionButton}
      </div>
    </div>
  );
});

AddressSearchInput.displayName = 'AddressSearchInput';

export default AddressSearchInput; 