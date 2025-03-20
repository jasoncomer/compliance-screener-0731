import React from 'react';
import { DatabaseOutlined } from '@ant-design/icons';
import styled, { useTheme } from 'styled-components';
import { colors } from '../../../styles/variables';

const HeaderActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

interface HeaderActionsProps {
  addressCount: number;
  denom: string;
  onDenomChange: (value: string) => void;
}

const ComplianceHeaderActions: React.FC<HeaderActionsProps> = () => {
  const { theme } = useTheme();
  return (
    <HeaderActionsContainer>
      <h3 style={{ margin: 0, color: theme === 'light' ? colors.black : colors.white }}>
        <DatabaseOutlined style={{ marginRight: '8px' }} />
        Real-Time Compliance Monitoring
      </h3>
    </HeaderActionsContainer>
  );
};

export default ComplianceHeaderActions; 