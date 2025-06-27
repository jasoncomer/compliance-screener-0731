import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { getTagColor } from '../../../../utils/tag-colors';
import { useTheme } from '../../../../context/ThemeContext';

interface AddressHeaderProps {
  address: string;
  entityTags: string[];
}

const AddressHeader: React.FC<AddressHeaderProps> = ({ address, entityTags }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const { theme } = useTheme();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return addr;
  };

  const getTagColorClass = (tag: string) => {
    const color = getTagColor(tag);
    // Convert hex color to Tailwind-like classes
    if (color === 'red') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (color === 'orange') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (color === 'yellow') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (color === 'green') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (color === 'blue') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (color === 'purple') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (color === 'pink') return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  return (
    <div className="p-0">
      <h5 className={`text-lg font-semibold mb-3 ${
        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
      }`}>
        Address
      </h5>
      
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className={`flex items-center ${
          theme === 'dark' 
            ? 'bg-gray-700 border-gray-600 text-gray-200' 
            : 'bg-gray-100 border-gray-300 text-gray-900'
        } border rounded-md px-3 py-2 font-mono text-sm max-w-full overflow-hidden text-ellipsis whitespace-nowrap`}>
          {formatAddress(address)}
        </div>
        
        <button
          onClick={copyToClipboard}
          title="Copy address"
          className={`flex items-center justify-center w-7 h-7 rounded border transition-all duration-200 ${
            theme === 'dark'
              ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
              : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:border-gray-400'
          }`}
        >
          {copySuccess ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        
        {entityTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {entityTags.map((tag, index) => (
              <span 
                key={index}
                className={`px-2 py-1 rounded text-xs font-medium ${getTagColorClass(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressHeader; 