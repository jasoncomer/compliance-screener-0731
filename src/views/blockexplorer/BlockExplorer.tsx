import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Globe, MessageSquare, Box, ArrowLeftRight, Wallet } from 'lucide-react';
import Input from '../../components/common/Input';
import { cn } from '../../lib/utils';

import { determineInputType } from '../../utils/crypto';
import TransactionView from './TransactionView';
import Address from './address-page/Address';
import BlockView from './BlockView';
import NotesModal from '../../components/common/NotesModal';

interface SearchProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPressEnter: () => void;
  className?: string;
}

const Search: React.FC<SearchProps> = ({ placeholder, value, onChange, onPressEnter, className }) => (
  <Input
    className={cn("w-[400px] my-1", className)}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onPressEnter={onPressEnter}
  />
);

interface EmptyStateProps {
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div className={cn(
    "flex flex-col items-center justify-center py-12 px-6 text-center",
    className
  )}>
    <h2 className="text-xl font-semibold text-foreground mb-3">
      Search the Blockchain
    </h2>

    <p className="text-muted-foreground mb-6 max-w-md">
      Use the search bar above to explore transactions, addresses, and blocks on the blockchain.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
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

    <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border max-w-md">
      <p className="text-sm text-muted-foreground">
        <strong>Tip:</strong> Simply paste a transaction hash, wallet address, or block number in the search bar above to get started.
      </p>
    </div>
  </div>
);

interface NotesButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const NotesButton: React.FC<NotesButtonProps> = ({ onClick, title, children, className }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "h-9 px-4 rounded-lg bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-colors flex items-center gap-2",
      className
    )}
  >
    <MessageSquare className="w-4 h-4" />
    {children}
  </button>
);

const BlockExplorer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = React.useState('');
  const [notesModalVisible, setNotesModalVisible] = useState(false);
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

  const searchPlaceholder = 'Search by block number, tx hash or address';

  const isEmptyState = !location.pathname.includes('/transaction/') &&
    !location.pathname.includes('/address/') &&
    !location.pathname.includes('/block/');

  return (
    <div className="w-full min-h-screen text-foreground font-['Inter'] px-6 py-6 lg:px-8 max-w-full overflow-hidden flex flex-col">

      {/* Header */}
      <header className="mb-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Globe className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Block Explorer
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Search
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={() => onSearch(searchValue)}
            />
            {(currentContext.type === 'transaction' || currentContext.type === 'address') && (
              <NotesButton
                onClick={showNotesModal}
                title="View Notes"
              >
                Notes
              </NotesButton>
            )}
          </div>
        </div>
      </header >

      {/* Main Content */}
      {
        isEmptyState ? (
          <EmptyState />
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
          />
        )
      }
    </div >
  );
};

export default BlockExplorer;