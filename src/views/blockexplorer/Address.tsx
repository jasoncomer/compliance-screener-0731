import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';
import { BsBlock } from '../../styles/Table';
import { IBtcAddress } from '../../typings/BtcAddress';
import styled from 'styled-components';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { satsToBTC } from '../../utils/crypto';
import { useAttribution } from '../../context/AttributionContext';
import Pagination from '../../components/common/Pagination';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentOrganization } from '../../store/slices/organizationsSlice';
import { EEntityType } from '../../typings/SOT';

const AddressLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const FixedAddressHeader = styled.div`
  position: sticky;
  top: 0;
  background: ${props => props.theme.theme === 'dark' ? '#141414' : '#ffffff'};
  z-index: 9;
  padding-bottom: 20px;
`;

const ScrollableAddressContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-top: 20px;

  > :first-child {
    margin-top: 0;
  }
`;

const SummaryWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;

  .col {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 10px;
    
    span {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
    }
  }
`;

const AddressInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .address-row {
    display: flex;
    align-items: center;
    word-break: break-all;
    
    .address-value {
      font-family: monospace;
      font-size: 1rem;
      font-weight: 500;
    }
  }
  
  .attribution-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-top: 8px;
    
    .attribution-item {
      display: flex;
      flex-direction: column;
      padding: 12px;
      background-color: ${props => props.theme.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
      border-radius: 4px;
      
      .label {
        font-size: 0.85rem;
        color: ${props => props.theme.theme === 'dark' ? '#a0a0a0' : '#666666'};
        margin-bottom: 4px;
      }
      
      .value {
        font-weight: 500;
        font-size: 1rem;
      }
    }
  }
`;

const Address: React.FC = () => {
  const { address } = useParams();
  const { theme } = useTheme();
  const [addrData, setAddrData] = React.useState<IBtcAddress>();
  const [txs, setTxs] = React.useState<BtcTransaction[]>([]);
  const [totalTxs, setTotalTxs] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const itemsPerPage = 20;
  const { fetchAttributions, attributions } = useAttribution();
  const organization = useAppSelector(selectCurrentOrganization);
  const [summary, setSummary] = React.useState<{
    balance: number;
    total_received: number;
    total_spent: number;
  }>({
    balance: 0,
    total_received: 0,
    total_spent: 0
  });
  const totalPages = Math.ceil(totalTxs / itemsPerPage);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        if (!address) return;
        setIsLoading(true);
        const [{ data }, { txs, pagination }] = await Promise.all([
          api.blockchain.getAddress(address),
          api.blockchain.getAddressTransactions(address, {
            page: currentPage,
            limit: itemsPerPage
          })
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
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
    
    // If allowCSAM is false and the entity is CSAM-related, show "CSAM Related Entity"
    if (organization?.settings.allowCSAM === false && EEntityType.CSAM === "csam") {
      return 'CSAM Related Entity';
    }
    
    // Otherwise show the original entity name
    return entityId;
  };

  return (
    <AddressLayout>
      <FixedAddressHeader>
        <BsBlock theme={{ theme }}>
          <h3>Address</h3>
          <hr />
          <AddressInfoWrapper theme={{ theme }}>
            <div className="address-row">
              <div className="address-value">{address}</div>
            </div>

            {hasAttributionData && (
              <div className="attribution-grid">
                {attributions[address]?.entity && (
                  <div className="attribution-item">
                    <div className="label">Entity</div>
                    <div className="value">{getEntityDisplayName(attributions[address].entity)}</div>
                  </div>
                )}

                {attributions[address]?.bo && (attributions[address]?.bo !== attributions[address]?.entity) && (
                  <div className="attribution-item">
                    <div className="label">Beneficial Owner</div>
                    <div className="value">{getEntityDisplayName(attributions[address].bo)}</div>
                  </div>
                )}

                {attributions[address]?.custodian && (
                  <div className="attribution-item">
                    <div className="label">Custodian</div>
                    <div className="value">{attributions[address].custodian}</div>
                  </div>
                )}
              </div>
            )}
          </AddressInfoWrapper>
        </BsBlock>
      </FixedAddressHeader>

      <ScrollableAddressContent>
        <BsBlock theme={{ theme }} style={{ fontFamily: 'monospace' }}>
          <h3>Summary</h3>
          <hr />
          <SummaryWrapper>
            <div className='col'>
              <span><strong>Balance:</strong> {satsToBTC(summary?.balance || 0)} BTC</span>
              <span><strong>First block:</strong> {addrData?.first_block?.toLocaleString()}</span>
              <span><strong>Last block:</strong> {addrData?.last_block?.toLocaleString()}</span>
            </div>

            <div className='col'>
              <span><strong>Script Type:</strong> {addrData?.script_type}</span>
              <span><strong>Total received:</strong> {satsToBTC(summary?.total_received || 0)} BTC</span>
              <span><strong>Total spent:</strong> {satsToBTC(summary?.total_spent || 0)} BTC</span>
            </div>
          </SummaryWrapper>
        </BsBlock>

        <BsBlock theme={{ theme }} style={{ fontFamily: 'monospace' }}>
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