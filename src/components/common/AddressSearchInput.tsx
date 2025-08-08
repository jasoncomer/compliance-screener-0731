import React, { forwardRef, useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { isValidBlockchainAddress, getBlockchainType } from '../../utils/addressValidation';

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
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');

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
    <div className="relative flex items-center">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        disabled={disabled || loading}
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
          className
        )}
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

      {/* Validation message */}
      {showValidation && isValid === false && value && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-500">
          {validationMessage}
        </div>
      )}
      
      {showValidation && isValid === true && value && (
        <div className="absolute -bottom-6 left-0 text-xs text-green-500">
          {validationMessage}
        </div>
      )}
    </div>
  );
});

AddressSearchInput.displayName = 'AddressSearchInput';

export default AddressSearchInput; 