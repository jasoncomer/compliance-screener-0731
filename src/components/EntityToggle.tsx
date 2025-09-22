import React from 'react';
import { Switch } from 'antd';
import { useTheme } from '../context/ThemeContext';

interface EntityToggleProps {
  isBeneficialOwner: boolean;
  onToggle: (isBeneficialOwner: boolean) => void;
  custodialEntityName?: string;
  beneficialOwnerName?: string;
  disabled?: boolean;
}

const EntityToggle: React.FC<EntityToggleProps> = ({
  isBeneficialOwner,
  onToggle,
  custodialEntityName = "Custodial Entity",
  beneficialOwnerName = "Beneficial Owner",
  disabled = false
}) => {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex-1">
        <div className={`text-sm font-medium ${
          theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
        }`}>
          Viewing: {isBeneficialOwner ? beneficialOwnerName : custodialEntityName}
        </div>
        <div className={`text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {isBeneficialOwner 
            ? "Showing beneficial owner information" 
            : "Showing custodial entity information"
          }
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`text-sm ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {custodialEntityName}
        </span>
        <Switch
          checked={isBeneficialOwner}
          onChange={onToggle}
          disabled={disabled}
          size="small"
        />
        <span className={`text-sm ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {beneficialOwnerName}
        </span>
      </div>
    </div>
  );
};

export default EntityToggle;