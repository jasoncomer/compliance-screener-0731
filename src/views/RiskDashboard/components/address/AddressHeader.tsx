import React, { useState } from 'react';

import { Building2,Check, Copy } from 'lucide-react';

import { useTheme } from '../../../../context/ThemeContext';
import { useLogo } from '../../../../hooks/useLogo';
import { getTagColor } from '../../../../utils/tag-colors';

interface AddressHeaderProps {
  address: string;
  entityTags: string[];
  entityName?: string;
  entityId?: string;
  entityType?: string;
}

const AddressHeader: React.FC<AddressHeaderProps> = ({ address, entityTags, entityName, entityId, entityType }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const { theme } = useTheme();
  
  // Fetch entity logo
  const { logoUrl, isLoading } = useLogo({ 
    entityId, 
    enableFallback: true 
  });

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
    <div className="space-y-6">
      {entityName && (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg">
            {isLoading ? (
              <div className="w-10 h-10 animate-pulse bg-gray-300 rounded"></div>
            ) : logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${entityName} logo`}
                className="w-10 h-10 object-cover rounded"
                onError={(e) => {
                  // Fallback to Building2 icon if logo fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const iconElement = document.createElement('div');
                    iconElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path></svg>';
                    parent.appendChild(iconElement);
                  }
                }}
              />
            ) : (
              <Building2 className="w-10 h-10" />
            )}
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {entityName}
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
            {entityType || 'Entity'}
            </p>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h4 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Address
          </h4>
          <div className={`flex-1 h-px ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
          }`}></div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`flex items-center ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-600 text-gray-200' 
              : 'bg-white border-gray-300 text-gray-900'
          } border rounded-lg px-4 py-3 font-mono text-sm max-w-full overflow-hidden text-ellipsis whitespace-nowrap shadow-sm`}>
            {formatAddress(address)}
          </div>
          
          <button
            onClick={copyToClipboard}
            title="Copy address"
            className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 hover:scale-105 ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-white'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 shadow-sm'
            }`}
          >
            {copySuccess ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {entityTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-2">
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Tags:
            </span>
            {entityTags.map((tag, index) => (
              <span 
                key={index}
                className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getTagColorClass(tag)}`}
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