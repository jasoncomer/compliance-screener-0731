import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Globe, MessageSquare, Box, ArrowLeftRight, Wallet } from 'lucide-react';
import Input from '../../components/common/Input';
import { Button } from 'antd';

import { determineInputType } from '../../utils/crypto';
import TransactionView from './TransactionView';
import Address from './Address';
import BlockView from './BlockView';
import NotesModal from '../../components/common/NotesModal';
import { cn } from '../../lib/utils';

interface ExplorerLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const ExplorerLayout: React.FC<ExplorerLayoutProps> = ({ children, className }) => (
  <div className={cn("flex flex-col h-screen overflow-hidden", className)}>
    {children}
  </div>
);

interface FixedHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const FixedHeader: React.FC<FixedHeaderProps> = ({ children, className }) => (
  <div className={cn(
    "sticky top-0 mb-3 bg-white dark:bg-[#141414] z-10 flex justify-between items-center px-5 py-2",
    className
  )}>
    {children}
  </div>
);

interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const ContentWrapper: React.FC<ContentWrapperProps> = ({ children, className }) => (
  <div className={cn("flex-1 overflow-hidden", className)}>
    {children}
  </div>
);

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

interface CustomHeaderProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ icon, title, children, className }) => (
  <div className={cn(
    "w-full min-h-screen bg-background text-foreground font-['Inter']",
    "px-6 py-6 lg:px-8 max-w-full",
    "overflow-hidden flex flex-col",
    className
  )}>
    <header className="mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 text-muted-foreground">
            {icon}
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground font-['Inter']">
          {title}
        </h1>
      </div>
    </header>
    <main className="flex-1 overflow-hidden">
      <div className="sticky mb-0 top-0 bg-white dark:bg-[#141414]">
        {children}
      </div>
    </main>
  </div>
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
  type: "primary" | "default" | "dashed" | "link" | "text";
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const NotesButton: React.FC<NotesButtonProps> = ({ type, icon, onClick, title, children, className }) => (
  <Button 
    type={type}
    icon={icon}
    onClick={onClick}
    title={title}
    className={cn(
      "h-10 rounded-[20px] flex items-center justify-center shadow-lg bg-[#C74D1B] border-[#C74D1B] ml-2.5 px-4 transition-all duration-300 ease-in-out font-semibold hover:bg-[#E35E29] hover:border-[#E35E29] hover:-translate-y-0.5 hover:shadow-xl",
      className
    )}
  >
    {children}
  </Button>
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
    <CustomHeader
      icon={<Globe className="w-7 h-7 text-[#C74D1B]" />}
      title="Block Explorer"
    >
      <ExplorerLayout>
        <FixedHeader>
          <Search 
            placeholder={searchPlaceholder} 
            value={searchValue} 
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={() => onSearch(searchValue)}
          />
          {(currentContext.type === 'transaction' || currentContext.type === 'address') && (
            <NotesButton 
              type="primary" 
              icon={<MessageSquare className="w-5 h-5" />} 
              onClick={showNotesModal} 
              title="View Notes"
            >
              NOTES
            </NotesButton>
          )}
        </FixedHeader>

        <ContentWrapper>
          {isEmptyState ? (
            <EmptyState />
          ) : (
            <Routes>
              <Route path="/transaction/:txid" element={<TransactionView />} />
              <Route path="/block/:block" element={<BlockView />} />
              <Route path="/address/:address" element={<Address />} />
            </Routes>
          )}
        </ContentWrapper>
      </ExplorerLayout>

      {(currentContext.type === 'transaction' || currentContext.type === 'address') && (
        <NotesModal
          visible={notesModalVisible}
          onClose={hideNotesModal}
          type={currentContext.type}
          transactionId={currentContext.type === 'transaction' ? currentContext.id : undefined}
          address={currentContext.type === 'address' ? currentContext.id : undefined}
        />
      )}
    </CustomHeader>
  );
};

export default BlockExplorer;