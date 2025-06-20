import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { GlobalOutlined, MessageOutlined } from '@ant-design/icons';
import Input from '../../components/common/Input';
import { Button } from 'antd';

import ViewWrapper from '../../components/ViewWrapper';
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
    "sticky top-0 mb-5 bg-white dark:bg-[#141414] z-10 flex justify-between items-center px-5",
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
    className={cn("w-[400px] my-2.5", className)}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onPressEnter={onPressEnter}
  />
);

interface StyledViewWrapperProps {
  icon: React.ReactNode;
  title: string;
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
}

const StyledViewWrapper: React.FC<StyledViewWrapperProps> = ({ icon, title, fullWidth, children, className }) => (
  <ViewWrapper 
    icon={icon}
    title={title}
    fullWidth={fullWidth}
    className={cn(
      "h-full overflow-hidden flex flex-col",
      className
    )}
  >
    <div className="sticky mb-0 top-0 bg-white dark:bg-[#141414]">
      {children}
    </div>
  </ViewWrapper>
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

  return (
    <StyledViewWrapper
      icon={<GlobalOutlined style={{ fontSize: '28px', color: '#C74D1B', fontWeight: 'bold' }} />}
      title="Block Explorer"
      fullWidth={true}
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
              icon={<MessageOutlined style={{ fontSize: 20 }} />} 
              onClick={showNotesModal} 
              title="View Notes"
            >
              NOTES
            </NotesButton>
          )}
        </FixedHeader>

        <ContentWrapper>
          <Routes>
            <Route path="/transaction/:txid" element={<TransactionView />} />
            <Route path="/block/:block" element={<BlockView />} />
            <Route path="/address/:address" element={<Address />} />
          </Routes>
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
    </StyledViewWrapper>
  );
};

export default BlockExplorer;