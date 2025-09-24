import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ArrowLeftRight, Box, Globe, Wallet } from 'lucide-react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import EmptyState from '../../components/common/EmptyState';
import NotesModal from '../../components/common/NotesModal';
import SearchInput from '../../components/common/SearchInput';
import ViewWrapper from '../../components/ViewWrapper';
import { useAddress } from '../../hooks/useAddress';
import { determineInputType } from '../../utils/crypto';

import Address from './address-page/Address';
import EntityAndBeneficialOwnersSection from './components/EntityAndBeneficialOwnersSection';
import NotesButton from './components/NotesButton';
import BlockView from './BlockView';
import TransactionView from './TransactionView';


const BlockExplorerEmptyState: React.FC = React.memo(() => (
  <EmptyState
    variant="initial"
    icon={<Globe className="w-12 h-12" />}
    title="Search the Blockchain"
    description="Use the search bar above to explore transactions, addresses, and blocks on the blockchain."
    action={
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mb-6">
          <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3 mx-auto">
              <ArrowLeftRight className="text-blue-600 dark:text-blue-400 w-5 h-5" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Transactions</h3>
            <p className="text-sm text-muted-foreground">
              Search by transaction hash to view details
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3 mx-auto">
              <Wallet className="text-green-600 dark:text-green-400 w-5 h-5" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Addresses</h3>
            <p className="text-sm text-muted-foreground">
              Explore wallet addresses and their activity
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3 mx-auto">
              <Box className="text-purple-600 dark:text-purple-400 w-5 h-5" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Blocks</h3>
            <p className="text-sm text-muted-foreground">
              View block information by block number
            </p>
          </div>
        </div>

        {/* Entity and Beneficial Owners Section */}
        <EntityAndBeneficialOwnersSection />

        <div className="p-3 rounded-lg bg-muted/50 border border-border max-w-2xl">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Simply paste a transaction hash, wallet address, or block number in the search bar above to get started.
          </p>
        </div>
      </>
    }
  />
));
BlockExplorerEmptyState.displayName = 'BlockExplorerEmptyState';

type ContextType = 'general' | 'transaction' | 'address' | 'block';

interface CurrentContext {
  type: ContextType;
  id?: string;
}

const BlockExplorer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = React.useState('');
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [newNotesCount, setNewNotesCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentContext, setCurrentContext] = useState<CurrentContext>({ type: 'general' });

  // Get address data to access cospend_id
  const { data: addressData } = useAddress(currentContext.type === 'address' ? currentContext.id || '' : '');
  const cospendId = addressData?.cospend_id;

  useEffect(() => {
    // Parse the current URL to determine context
    const path = location.pathname;
    const pathParts = path.split('/');

    // Check if we're viewing a transaction, address, or block
    if (pathParts.includes('transaction') && pathParts.length > 4) {
      const txId = pathParts[pathParts.length - 1];
      setCurrentContext({ type: 'transaction', id: txId });
    } else if (pathParts.includes('address') && pathParts.length > 4) {
      const address = pathParts[pathParts.length - 1];
      setCurrentContext({ type: 'address', id: address });
    } else if (pathParts.includes('block') && pathParts.length > 4) {
      const blockNumber = pathParts[pathParts.length - 1];
      setCurrentContext({ type: 'block', id: blockNumber });
    } else {
      setCurrentContext({ type: 'general' });
    }
  }, [location.pathname]);

  const onSearch = useCallback(async (value: string) => {
    if (!value) {
      setSearchError('Please enter a search value');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const type = determineInputType(value);
      if (!type) {
        setSearchError('Invalid input. Please enter a valid block number, transaction hash, or address.');
        setIsSearching(false);
        return;
      }

      navigate(`/home/block-explorer/${type}/${value}`);
      setSearchValue(''); // Clear the input after navigation
    } catch (error) {
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [navigate]);

  const showNotesModal = useCallback(() => {
    setNotesModalVisible(true);
  }, []);

  const hideNotesModal = useCallback(() => {
    setNotesModalVisible(false);
  }, []);

  const handleNewNotesCountChange = useCallback((count: number) => {
    setNewNotesCount(count);
  }, []);

  const searchPlaceholder = useMemo(
    () => 'Search by block number, tx hash or address',
    []
  );

  const isEmptyState = useMemo(
    () => !location.pathname.includes('/transaction/') &&
      !location.pathname.includes('/address/') &&
      !location.pathname.includes('/block/'),
    [location.pathname]
  );

  return (
    <ViewWrapper
      icon={<Globe className="w-8 h-8 text-orange-500" />}
      title="Block Explorer"
      fullWidth={true}
    >
      <div className="sticky top-[0] z-20 bg-background border-b border-border pt-2 py-4 mb-2">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 max-w-2xl">
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                if (searchError) setSearchError(null);
              }}
              onSearch={onSearch}
              loading={isSearching}
              error={!!searchError}
            />
          </div>
          {currentContext.type !== 'general' && (
            <NotesButton
              onClick={showNotesModal}
              title="View Notes"
              newNotesCount={newNotesCount}
            >
              Notes
            </NotesButton>
          )}
        </div>
        {searchError && (
          <div className="mt-2 text-sm text-red-500 dark:text-red-400 text-center">
            {searchError}
          </div>
        )}
      </div>

      {/* Main Content */}
      {
        isEmptyState ? (
          <BlockExplorerEmptyState />
        ) : (
          <Routes>
            <Route path="/transaction/:txid" element={<TransactionView />} />
            <Route path="/block/:block" element={<BlockView />} />
            <Route path="/address/:address" element={<Address />} />
          </Routes>
        )
      }

      {
        currentContext.type !== 'general' && (
          <NotesModal
            visible={notesModalVisible}
            onClose={hideNotesModal}
            type={currentContext.type}
            transactionId={currentContext.type === 'transaction' ? currentContext.id : undefined}
            address={currentContext.type === 'address' ? currentContext.id : undefined}
            blockNumber={currentContext.type === 'block' ? currentContext.id : undefined}
            cospendId={currentContext.type === 'address' ? cospendId : undefined}
            onNewNotesCountChange={handleNewNotesCountChange}
          />
        )
      }
    </ViewWrapper >
  );
};

export default BlockExplorer;