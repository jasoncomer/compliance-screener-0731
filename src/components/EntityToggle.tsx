import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

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
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      "bg-gray-50 border-gray-200",
      "dark:bg-gray-800 dark:border-gray-700"
    )}>
      <div className="flex-1">
        <div className={cn(
          "text-sm font-medium",
          "text-gray-700 dark:text-gray-200"
        )}>
          Viewing: {isBeneficialOwner ? beneficialOwnerName : custodialEntityName}
        </div>
        <div className={cn(
          "text-xs",
          "text-gray-500 dark:text-gray-400"
        )}>
          {isBeneficialOwner
            ? "Showing beneficial owner information"
            : "Showing custodial entity information"
          }
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={cn(
          "text-sm",
          "text-gray-600 dark:text-gray-300"
        )}>
          {custodialEntityName}
        </span>
        <Switch
          checked={isBeneficialOwner}
          onCheckedChange={onToggle}
          disabled={disabled}
        />
        <span className={cn(
          "text-sm",
          "text-gray-600 dark:text-gray-300"
        )}>
          {beneficialOwnerName}
        </span>
      </div>
    </div>
  );
};

export default EntityToggle;