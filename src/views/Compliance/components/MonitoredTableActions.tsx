import React from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const TableActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 1px;
`;

interface MonitoredTableActionsProps {
  onAddAddress: () => void;
  onUploadAddresses: () => void;
  children?: React.ReactNode;
}

const MonitoredTableActions: React.FC<MonitoredTableActionsProps> = ({
  onAddAddress,
  onUploadAddresses,
  children,
}) => {
  return (
    <TableActionsContainer>
      <Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAddAddress}>
          Add Address
        </Button>
        <Button icon={<UploadOutlined />} onClick={onUploadAddresses}>
          Bulk Upload
        </Button>
      </Space>
      {children}
    </TableActionsContainer>
  );
};

export default MonitoredTableActions; 