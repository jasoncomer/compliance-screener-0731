import React from 'react';
import { DatabaseOutlined } from '@ant-design/icons';
import { cn } from '../../../lib/utils';

interface HeaderActionsProps {
  txCount: number;
  className?: string;
}

const ComplianceHeaderActions: React.FC<HeaderActionsProps> = ({ txCount, className }) => {
  return (
    <div className={cn("flex justify-between items-center mb-4", className)}>
      <h3 className="m-0 text-black dark:text-white">
        <DatabaseOutlined className="mr-2" />
        Real-Time Compliance Monitoring ({txCount})
      </h3>
    </div>
  );
};

export default ComplianceHeaderActions; 