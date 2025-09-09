import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Globe, MessageSquare, Box, ArrowLeftRight, Wallet, Building, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import ViewWrapper from '../../components/ViewWrapper';
import SearchInput from '../../components/common/SearchInput';
import EmptyState from '../../components/common/EmptyState';

import { determineInputType } from '../../utils/crypto';
import TransactionView from './TransactionView';
import Address from './address-page/Address';
import BlockView from './BlockView';
import NotesModal from '../../components/common/NotesModal';

const EntityAndBeneficialOwnersSection: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mb-6">
    <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-3 mx-auto">
        <Building className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
      </div>
      <h3 className="font-medium text-foreground mb-2">Entity Intelligence</h3>
      <p className="text-sm text-muted-foreground">
        Explore entity relationships and corporate structures
      </p>
    </div>

    <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3 mx-auto">
        <Users className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
      </div>
      <h3 className="font-medium text-foreground mb-2">Beneficial Owners</h3>
      <p className="text-sm text-muted-foreground">
        Identify ultimate beneficial owners and control structures
      </p>
    </div>
  </div>
);

const BlockExplorerEmptyState: React.FC = () => (
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

        <div className="p-3 rounded-lg bg-muted/50 border border-border max-w-md">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Simply paste a transaction hash, wallet address, or block number in the search bar above to get started.
          </p>
        </div>
      </>
    }
  />
);

interface NotesButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  newNotesCount?: number;
}

const NotesButton: React.FC<NotesButtonProps> = ({ onClick, title, children, className, newNotesCount = 0 }) => (
  <div className="relative inline-block">
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "relative h-9 px-4 rounded-lg bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-colors flex items-center gap-2",
        className
      )}
    >
      <MessageSquare className="w-4 h-4" />
      {children}
      {newNotesCount > 0 && (
        <div 
          style={{ 
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: '#A53D10',
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '2px solid white',
            borderRadius: '10px',
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {newNotesCount}
        </div>
      )}
    </button>
  </div>
);

const BlockExplorer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = React.useState('');
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [newNotesCount, setNewNotesCount] = useState(0);
  const [currentContext, setCurrentContext] = useState<{
    type: 'general' | 'transaction' | 'address';
    id?: string;
  }>({ type: 'general' });

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
    } else {
      setCurrentContext({ type: 'general' });
    }
  }, [location.pathname]);

  const onSearch = (value: string) => {
    if (!value) return;

    // fetch data based on type
    const load = async () => {
      const type = determineInputType(value);
      if (!type) return;
      navigate(`/home/block-explorer/${type}/${value}`);
      setSearchValue(''); // Clear the input after navigation
    }

    load();
  }

  const showNotesModal = () => {
    setNotesModalVisible(true);
  };

  const hideNotesModal = () => {
    setNotesModalVisible(false);
  };

  const handleNewNotesCountChange = (count: number) => {
    setNewNotesCount(count);
  };

  const searchPlaceholder = 'Search by block number, tx hash or address';

  const isEmptyState = !location.pathname.includes('/transaction/') &&
    !location.pathname.includes('/address/') &&
    !location.pathname.includes('/block/');

  return (
    <ViewWrapper
      icon={<Globe className="w-8 h-8 text-orange-500" />}
      title="Block Explorer"
      fullWidth={true}
    >
      <div className="sticky top-[0] z-20 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 px-4 pt-2 py-4 mb-2">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 max-w-2xl">
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={onSearch}
            />
          </div>
          {(currentContext.type === 'transaction' || currentContext.type === 'address') && (
            <NotesButton
              onClick={showNotesModal}
              title="View Notes"
              newNotesCount={newNotesCount}
            >
              Notes
            </NotesButton>
          )}
        </div>
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
        (currentContext.type === 'transaction' || currentContext.type === 'address') && (
          <NotesModal
            visible={notesModalVisible}
            onClose={hideNotesModal}
            type={currentContext.type}
            transactionId={currentContext.type === 'transaction' ? currentContext.id : undefined}
            address={currentContext.type === 'address' ? currentContext.id : undefined}
            onNewNotesCountChange={handleNewNotesCountChange}
          />
        )
      }
    </ViewWrapper >
  );
};

export default BlockExplorer;