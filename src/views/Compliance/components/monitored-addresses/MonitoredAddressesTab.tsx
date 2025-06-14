import React from 'react';
import { DatabaseOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useTheme } from '../../../../context/ThemeContext';
import { colors } from '../../../../styles/variables';
import MonitoredAddressManagement from './MonitoredAddressManagement';
import { MonitoredAddress } from '../../../../typings/compliance';

const HeaderActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

interface MonitoredAddressesTabProps {
  addresses: MonitoredAddress[];
  onAddressesChange: (addresses: MonitoredAddress[]) => void;
  organizationId?: string;
  isLoading?: boolean;
}

const MonitoredAddressesTab: React.FC<MonitoredAddressesTabProps> = ({
  addresses,
  onAddressesChange,
  organizationId,
  // isLoading = false,
}) => {
  const { theme } = useTheme();

  return (
    <div style={{ width: '100%' }}>
      <HeaderActions>
        <h3 style={{ margin: 0, color: theme === 'light' ? colors.black : colors.white }}>
          <DatabaseOutlined style={{ marginRight: '8px' }} />
          Monitored Addresses Management
        </h3>

      </HeaderActions>
      <MonitoredAddressManagement
        addresses={addresses}
        onAddressesChange={onAddressesChange}
        organizationId={organizationId}
      />
    </div>
  );
};

export default MonitoredAddressesTab;