import React from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { cn } from '../../../lib/utils';

interface MonitoredTableActionsProps {
  onAddAddress: () => void;
  onUploadAddresses: () => void;
  children?: React.ReactNode;
  className?: string;
}

const MonitoredTableActions: React.FC<MonitoredTableActionsProps> = ({
  onAddAddress,
  onUploadAddresses,
  children,
  className,
}) => {
  return (
    <div className={cn("flex justify-between mb-6 gap-px", className)}>
      <Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAddAddress}>
          Add Address
        </Button>
        <Button icon={<UploadOutlined />} onClick={onUploadAddresses}>
          Bulk Upload
        </Button>
      </Space>
      {children}
    </div>
  );
};

export default MonitoredTableActions; 