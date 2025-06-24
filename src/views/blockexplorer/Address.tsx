import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';
import { BsBlock } from '../../styles/Table';
import { IBtcAddress } from '../../typings/BtcAddress';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { satsToBTC } from '../../utils/crypto';
import { useAttribution } from '../../context/AttributionContext';
import Pagination from '../../components/common/Pagination';
import { useTheme } from '../../context/ThemeContext';
import { Avatar, Tag, Card } from 'antd';
import { User, Shield } from 'lucide-react';
import { getEntityTypeLabel, capitalizeFirstLetter } from '../../utils/display-labels';
import { EEntityType } from '../../typings/SOT';
import { getTagColor } from '../../utils/tag-colors';
import { calculateRiskScore } from '../../api/riskScoring';
import { RiskScoringResponse } from '../../typings/riskScoring';
import { colors } from '../../styles/variables';

import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectCurrentOrganization } from '../../store/slices/organizationsSlice';
import { RootState } from '../../store/store';
import { fetchSOT } from '../../store/slices/sotSlice';
import {
  AddressLayout,
  FixedAddressHeader,
  ScrollableAddressContent,
  SummaryWrapper,
  SummaryColumn,
  SummaryRow,
  AddressInfoWrapper,
  EntityRow,
  EntitiesContainer,
  EntityInfo,
  RiskScoreLink
} from './AddressStyles';


const Address: React.FC = () => {
  const { address } = useParams();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const [addrData, setAddrData] = React.useState<IBtcAddress>();
  const [txs, setTxs] = React.useState<BtcTransaction[]>([]);
  const [totalTxs, setTotalTxs] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [copySuccess, setCopySuccess] = React.useState<boolean>(false);
  const [showCopyAlert, setShowCopyAlert] = React.useState<boolean>(false);
  const [riskScore, setRiskScore] = React.useState<RiskScoringResponse | null>(null);
  const [isLoadingRiskScore, setIsLoadingRiskScore] = React.useState<boolean>(false);

  const itemsPerPage = 20;
  const { fetchAttributions, attributions } = useAttribution();
  const organization = useAppSelector(selectCurrentOrganization);
  const { itemsMap } = useAppSelector((state: RootState) => state.sot);

  const [summary, setSummary] = React.useState<{
    balance: number;
    total_received: number;
    total_spent: number;
  }>({
    balance: 0,
    total_received: 0,
    total_spent: 0
  });
  const [blockStats, setBlockStats] = React.useState<{
    totalBlocks: number;
    firstBlock: {
      blockNumber: number;
      transactionCount: number;
      totalValue: number;
    } | null;
    lastBlock: {
      blockNumber: number;
      transactionCount: number;
      totalValue: number;
    } | null;
  }>({
    totalBlocks: 0,
    firstBlock: null,
    lastBlock: null
  });
  const totalPages = Math.ceil(totalTxs / itemsPerPage);

  useEffect(() => {
    // Fetch SOT data when component mounts
    dispatch(fetchSOT());
  }, [dispatch]);

  useEffect(() => {
    const getAddressStats = async () => {
      if (!address) return;
      const blockStatsData = await api.blockchain.getAddressBlockStats(address);
      setBlockStats(blockStatsData);
    };
    
    const fetchAddress = async () => {
      try {
        if (!address) return;
        setIsLoading(true);
        await getAddressStats();
        const [{ data }, { txs, pagination }] = await Promise.all([
          api.blockchain.getAddress(address),
          api.blockchain.getAddressTransactions(address, {
            page: currentPage,
            limit: itemsPerPage
          }),
        ]);
        setAddrData(data);
        setTxs(txs);
        setTotalTxs(pagination.totalTxs);
        const uniqueAddresses = new Set([
          address,
          ...txs.flatMap(tx => tx.inputs.map(i => i.addr)),
          ...txs.flatMap(tx => tx.outputs.map(o => o.addr))
        ]);
        fetchAttributions(Array.from(uniqueAddresses));

        // get total received and spent and balance
        const tmpSummary = await api.blockchain.getAddressSummary(address);
        setSummary({
          balance: tmpSummary.balance,
          total_received: tmpSummary.total_received,
          total_spent: tmpSummary.total_spent
        });
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddress();
  }, [address, currentPage, fetchAttributions]);

  useEffect(() => {
    const fetchRiskScore = async () => {
      if (!address) return;
      try {
        setIsLoadingRiskScore(true);
        const scores = await calculateRiskScore(address, 'address');
        setRiskScore(scores);
      } catch (error) {
        console.error('Error fetching risk score:', error);
      } finally {
        setIsLoadingRiskScore(false);
      }
    };

    fetchRiskScore();
  }, [address]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRiskScoreClick = () => {
    window.open(`/home/risk-scoring?address=${address}`, '_blank');
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return colors.danger;
    if (score > 40) return colors.warning;
    return colors.success;
  };

  // Check if attribution data exists for this address
  const hasAttributionData = address && (
    attributions[address]?.entity ||
    attributions[address]?.bo ||
    attributions[address]?.custodian
  );

  // Function to get the display name for an entity
  const getEntityDisplayName = (entityId: string) => {
    if (!entityId) return '';
    
    // Get the entity from the SOT data
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    
    // If allowCSAM is false and the entity is CSAM-related, show "CSAM Related Entity"
    if (organization?.settings.allowCSAM === false && 
        (entity?.entity_type === "csam" || entityId.toLowerCase().includes('csam'))) {
      return 'CSAM Related Entity';
    }
    
    // Return proper_name if available, otherwise entity_id
    return entity?.proper_name || entityId;
  };

  // Function to get the entity logo
  const getEntityLogo = (entityId: string) => {
    if (!entityId) return null;
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.logo;
  };

  // Function to get the entity type
  const getEntityType = (entityId: string) => {
    if (!entityId) return '';
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.entity_type ? getEntityTypeLabel(entity.entity_type as EEntityType) : '';
  };

  // Function to get entity tags
  const getEntityTags = (entityId: string): string[] => {
    if (!entityId) return [];
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    // Combine all entity tag fields
    const tags: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const tag = entity?.[`entity_tag${i}` as keyof typeof entity];
      if (tag && typeof tag === 'string') {
        tags.push(tag);
      }
    }
    return tags;
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!address) return;
    
    navigator.clipboard.writeText(address)
      .then(() => {
        setCopySuccess(true);
        setShowCopyAlert(true);
        setTimeout(() => setCopySuccess(false), 2000);
        setTimeout(() => setShowCopyAlert(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy address: ', err);
      });
  };

  return (
    <AddressLayout>
      <FixedAddressHeader>
        <BsBlock>
          <h3>Address</h3>
          <hr />
          <AddressInfoWrapper>
            <div className="flex items-center gap-x-2 my-2">
              <span className="cursor-pointer" onClick={copyToClipboard} title="Copy address">
                {copySuccess ? '✓' : '⧉'}
              </span>
              <div>{address}</div>
              <div className="flex gap-x-1">
                {address && attributions[address] && getEntityTags(attributions[address]?.entity || '').map(tag => (
                  <Tag key={tag} color={getTagColor(tag.toLowerCase())}>{tag.toUpperCase()}</Tag>
                ))}
              </div>
            </div>
            {showCopyAlert && <div className="copy-alert">Address copied</div>}
          </AddressInfoWrapper>

          {hasAttributionData && (
            <EntitiesContainer>
              {attributions[address]?.entity && (
                <Card
                  style={{ width: '100%', backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6' }}
                  className="rounded-lg"
                  bodyStyle={{ padding: '0.75rem' }}
                  bordered={false}
                >
                  <EntityRow className="!bg-transparent dark:!bg-transparent !p-0 !mb-0">
                    <Avatar
                      size={40}
                      src={getEntityLogo(attributions[address].entity)}
                      icon={!getEntityLogo(attributions[address].entity) && <User className="w-5 h-5" />}
                    />
                    <EntityInfo>
                      <div className="field-group">
                        <div className='label'>{capitalizeFirstLetter('Entity')}</div>
                        <div className="entity-name">
                          {getEntityDisplayName(attributions[address].entity)}
                        </div>
                      </div>
                      <div className="field-group">
                        <div className='label'>{capitalizeFirstLetter('entity type')}</div>
                        <div className="entity-type">
                          {getEntityType(attributions[address].entity)}
                        </div>
                      </div>                   
                    </EntityInfo>
                  </EntityRow>
                </Card>
              )}

              {attributions[address]?.bo && (attributions[address]?.bo !== attributions[address]?.entity) && (
                <EntityRow>
                  <Avatar
                    size={40}
                    src={getEntityLogo(attributions[address].bo)}
                    icon={!getEntityLogo(attributions[address].bo) && <User className="w-5 h-5" />}
                  />
                  <EntityInfo>
                    <div className="field-group">
                      <div className='label'>{capitalizeFirstLetter('Beneficial Owner')}</div>
                      <div className="entity-name">
                        {getEntityDisplayName(attributions[address].bo)}
                      </div>
                    </div>
                    <div className="field-group">
                      <div className='label'>{capitalizeFirstLetter('entity type')}</div>
                      <div className="entity-type">
                        {getEntityType(attributions[address].bo)}
                      </div>
                    </div>
                  </EntityInfo>
                </EntityRow>
              )}

              {attributions[address]?.custodian && (
                <EntityRow>
                  <Avatar
                    size={40}
                    src={getEntityLogo(attributions[address].custodian)}
                    icon={!getEntityLogo(attributions[address].custodian) && <User className="w-5 h-5" />}
                  />
                  <EntityInfo>
                    <div className="field-group">
                      <div className='label'>{capitalizeFirstLetter('Custodian')}</div>
                      <div className="entity-name">
                        {getEntityDisplayName(attributions[address].custodian)}
                      </div>
                    </div>
                    <div className="field-group">
                      <div className='label'>{capitalizeFirstLetter('entity type')}</div>
                      <div className="entity-type">
                        {getEntityType(attributions[address].custodian) || 'Custodian'}
                      </div>
                    </div>
                  </EntityInfo>
                </EntityRow>
              )}
            </EntitiesContainer>
          )}
        </BsBlock>
      </FixedAddressHeader>

      <ScrollableAddressContent>
        <BsBlock>
          <h3>Summary</h3>
          <hr />
          <SummaryWrapper>
            <SummaryColumn>
              <SummaryRow>
                <strong>Balance:</strong>
                <span>{satsToBTC(summary?.balance || 0)} BTC</span>
              </SummaryRow>
              <SummaryRow>
                <strong>First block:</strong>
                <span>{blockStats.firstBlock ? `${blockStats.firstBlock.blockNumber}` : 'N/A'}</span>
              </SummaryRow>
              <SummaryRow>
                <strong>Last block:</strong>
                <span>{blockStats.lastBlock ? `${blockStats.lastBlock.blockNumber}` : 'N/A'}</span>
              </SummaryRow>
              <SummaryRow>
                <strong>Risk Score:</strong>
                {isLoadingRiskScore ? (
                  'Loading...'
                ) : riskScore ? (
                  <RiskScoreLink onClick={handleRiskScoreClick}>
                    <Shield className="w-4 h-4" />
                    <span 
                      className="risk-score"
                      style={{ color: getRiskColor(riskScore.overallRisk * 100) }}
                    >
                      {Math.round(riskScore.overallRisk * 100)}%
                    </span>
                  </RiskScoreLink>
                ) : (
                  'N/A'
                )}
              </SummaryRow>
            </SummaryColumn>

            <SummaryColumn>
              <SummaryRow>
                <strong>Script Type:</strong>
                <span>{addrData?.script_type}</span>
              </SummaryRow>
              <SummaryRow>
                <strong>Total received:</strong>
                <span>{satsToBTC(summary?.total_received || 0)} BTC</span>
              </SummaryRow>
              <SummaryRow>
                <strong>Total spent:</strong>
                <span>{satsToBTC(summary?.total_spent || 0)} BTC</span>
              </SummaryRow>
            </SummaryColumn>
          </SummaryWrapper>
        </BsBlock>

        <BsBlock>
          <h3>Transactions ({totalTxs.toLocaleString()})</h3>
          <hr />
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
          ) : (
            <>
              {txs.map(tx => <BtcTransactionTable key={tx._id} transaction={tx} theme={{ theme }} />)}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </BsBlock>
      </ScrollableAddressContent>
    </AddressLayout>
  );
};

export default Address;