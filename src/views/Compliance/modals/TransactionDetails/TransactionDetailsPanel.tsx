import React, { useState } from 'react';
import styled from 'styled-components';
import { colors } from '@/design-system/tokens'
import { IComplianceTransaction } from '../../../../typings/compliance';
import { getRiskScoreColor, getComplianceReportStatusColor } from '../../utils/compliance.utils';
import { Tag, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useAppSelector } from '../../../../store/hooks';
import { selectActiveOrgMembersMap } from '../../../../store/slices/organizationsSlice';
import { getUserDisplayName } from '../../../../utils/display-labels';
import { selectTransactionById } from '../../../../store/slices/complianceTransactionsSlice';
import EntityQuickView from '../../../../components/EntityQuickView';
import { SOT } from '../../../../typings/interfaces';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';
import TransactionRiskModal from '../../components/modals/TransactionRiskModal';
import { EComplianceTransactionStatus } from '../../../../typings/compliance';

// Status mapping for display labels
const getStatusDisplayLabel = (status: EComplianceTransactionStatus): string => {
  const statusMap: Record<EComplianceTransactionStatus, string> = {
    [EComplianceTransactionStatus.UNASSIGNED]: 'Unassigned',
    [EComplianceTransactionStatus.UNREVIEWED]: 'Unreviewed',
    [EComplianceTransactionStatus.IN_REVIEW]: 'In Review',
    [EComplianceTransactionStatus.APPROVED]: 'Approved',
    [EComplianceTransactionStatus.HOLD]: 'Hold',
    [EComplianceTransactionStatus.CLOSED_WITH_NOTE]: 'Approved with Note',
    [EComplianceTransactionStatus.CLOSED_WITH_SAR]: 'Closed with SAR',
  };
  return statusMap[status] || status;
};

// Base Styled Components
const Panel = {
  Container: styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,

  Left: styled.div`
    flex: 2;
  `,

  Right: styled.div`
    flex: 1;
    border-left: 1px solid #f0f0f0;
    padding-left: 24px;
  `
};

const Field = {
  Container: styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,

  Label: styled.div`
    color: #6b7280; /* gray-500 for light mode */
    font-size: 12px;
    
    @media (prefers-color-scheme: dark) {
      color: #8c8c8c; /* original color for dark mode */
    }
  `,

  Value: styled.div`
    text-transform: capitalize;
    color: #1f2937; /* gray-800 for light mode */
    
    @media (prefers-color-scheme: dark) {
      color: #ffffff; /* white for dark mode */
    }
  `,

  Link: styled.a`
    cursor: pointer;
    color: ${colors.attribution.hover};
    font-weight: bold;
  `,

  EntityContainer: styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  `,

  EntityItem: styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
  `,

  Empty: styled.span`
    color: #6b7280; /* gray-500 for light mode */
    font-style: italic;
    
    @media (prefers-color-scheme: dark) {
      color: #8c8c8c; /* original color for dark mode */
    }
  `,

  Bold: styled.div`
    font-weight: bold;
  `,

  TransactionLink: styled.a`
    word-break: break-all;
  `
};

const Amount = {
  Container: styled.div`
    display: flex;
    gap: 40px;
    margin-top: 8px;
  `
};

// Custom styled wrapper for EntityQuickView to control size in the modal
const CompactEntityQuickView = styled(EntityQuickView)`
  .ant-typography {
    font-size: 12px;
  }

  svg {
    font-size: 12px;
  }
`;

interface LeftPanelProps {
  transactionDetails: IComplianceTransaction | null;
  currencySymbols: Record<string, string>;
  attributions: Record<string, any>;
  onEntityClick: (record: IComplianceTransaction) => void;
  onClose: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  transactionDetails,
  currencySymbols,
  attributions,
  onEntityClick,
  onClose,
}) => {
  const denom = 'USD';
  const { itemsMap } = useAppSelector(state => state.sot);
  const [_, setSelectedEntitySot] = useState<SOT | null>(null);
  const { getPrice } = useCryptoPrices();
  const btcPrice = getPrice('BTC') || 0;
  
  if (!transactionDetails) return null;

  // Find SOT record by entity ID
  const getEntitySot = (entityId: string): SOT | null => {
    return Object.values(itemsMap).find(sot => sot.entity_id === entityId) || null;
  };

  // Handle view full profile for entity
  const handleViewFullProfile = (sot: SOT) => {
    // TODO: Implement navigation to full entity profile view
    console.log('View full profile for entity:', sot.entity_id);
    onEntityClick(transactionDetails);
    onClose();
  };

  // Handle quick view click
  const handleQuickView = (e: React.MouseEvent, entityId: string) => {
    e.stopPropagation();
    // Set the quick view SOT
    const sot = getEntitySot(entityId);
    if (sot) {
      setSelectedEntitySot(sot);
    }
  };

  return (
    <Panel.Container as={Panel.Left}>
      <Field.Container>
        <Field.Label>TRANSACTION ID</Field.Label>
        <Field.Value>
          <Field.TransactionLink
            href={`/home/block-explorer/transaction/${transactionDetails.txId}`}
            target="_blank"
            rel="noopener noreferrer">
            {transactionDetails.txId}
          </Field.TransactionLink>
        </Field.Value>
      </Field.Container>

      <Field.Container>
        <Field.Label>CLIENT ID</Field.Label>
        <Field.Value>{transactionDetails.clientId}</Field.Value>
      </Field.Container>

      <Field.Container>
        <Field.Label>COUNTERPARTY ENTITIES</Field.Label>
        <Field.Value>
          {transactionDetails.counterpartyEntities.length === 0 && (
            <Field.Empty>No attributed counterparty entities</Field.Empty>
          )}
          <Field.EntityContainer>
            {transactionDetails.counterpartyEntities?.map((entity, index) => {
              const entityName = attributions[entity]?.entity || entity;
              const entitySot = getEntitySot(entityName);
              
              return (
                <Field.EntityItem key={entity}>
                  <Field.Link
                    onClick={() => {
                      onEntityClick(transactionDetails);
                      onClose();
                    }}
                  >
                    {entityName}
                  </Field.Link>

                  {entitySot && (
                    <CompactEntityQuickView 
                      entity={{
                        _id: entitySot._id,
                        proper_name: entitySot.proper_name,
                        entity_id: entitySot.entity_id
                      }}
                      sot={entitySot}
                      onViewFull={handleViewFullProfile}
                      onQuickView={handleQuickView}
                      popoverPlacement="right"
                      popoverWidth={400}
                    />
                  )}
                  {index < transactionDetails.counterpartyEntities.length - 1 && ', '}
                </Field.EntityItem>
              );
            })}
          </Field.EntityContainer>
        </Field.Value>
      </Field.Container>

      <Amount.Container>
        <Field.Container>
          <Field.Label>AMOUNT</Field.Label>
          <Field.Bold>
            BTC {(transactionDetails.amount / 100000000)}
          </Field.Bold>
        </Field.Container>

        <Field.Container>
          <Field.Label>CONVERTED AMOUNT</Field.Label>
          <Field.Bold>
            {currencySymbols[denom]}
            {((transactionDetails.amount / 100000000) * btcPrice).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Field.Bold>
        </Field.Container>
      </Amount.Container>
    </Panel.Container>
  );
};

interface RightPanelProps {
  transactionId: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({ transactionId }) => {
  const orgMembersMap = useAppSelector(selectActiveOrgMembersMap);
  const transactionDetails = useAppSelector(state => selectTransactionById(state, transactionId));
  const [isRiskModalVisible, setIsRiskModalVisible] = useState(false);

  if (!transactionDetails) return null;

  const renderRiskScore = () => {
    if (!transactionDetails.riskScores || transactionDetails.riskScores.length === 0) return 'N/A';
    const overallScore = transactionDetails.riskScores[0] || 0;
    
    return (
      <Space>
        <Tag color={getRiskScoreColor(overallScore)}>
          {overallScore}
        </Tag>
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setIsRiskModalVisible(true)}
          title="View detailed risk analysis"
        />
      </Space>
    );
  };

  return (
    <>
      <Panel.Container as={Panel.Right}>
        <Field.Container>
          <Field.Label>Risk Score</Field.Label>
          <Field.Value>
            {renderRiskScore()}
          </Field.Value>
        </Field.Container>

      <Field.Container>
        <Field.Label>Status</Field.Label>
        <Field.Value>
          <Tag color={getComplianceReportStatusColor(transactionDetails.status)} style={{ marginRight: 0 }}>
            {getStatusDisplayLabel(transactionDetails.status)}
          </Tag>
        </Field.Value>
      </Field.Container>

      <Field.Container>
        <Field.Label>BLOCKCHAIN</Field.Label>
        <Field.Value>{transactionDetails.blockchain}</Field.Value>
      </Field.Container>

      <Field.Container>
        <Field.Label>TIMESTAMP</Field.Label>
        <Field.Value>{new Date(transactionDetails.timestamp).toLocaleString()}</Field.Value>
      </Field.Container>

        <Field.Container>
          <Field.Label>ASSIGNED TO</Field.Label>
          <Field.Value>
            {transactionDetails.reviewerId ?
              getUserDisplayName(orgMembersMap[transactionDetails.reviewerId]) :
              <Field.Empty>Unassigned</Field.Empty>
            }
          </Field.Value>
        </Field.Container>
      </Panel.Container>

      <TransactionRiskModal
        visible={isRiskModalVisible}
        onClose={() => setIsRiskModalVisible(false)}
        transaction={transactionDetails}
        title="Transaction Risk Analysis"
      />
    </>
  );
};

export default LeftPanel;
