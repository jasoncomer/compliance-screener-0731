import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
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

const ExplorerLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const FixedHeader = styled.div`
  position: sticky;
  top: 0;
  margin-bottom: 20px;
  background: ${({ theme }) => theme.theme === 'dark' ? '#141414' : '#ffffff'};
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;

  input {
    margin: 10px 0px;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow: hidden;
`;

const Search = styled(Input)`
  width: 400px;
`;

const StyledViewWrapper = styled(ViewWrapper)`
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  > div:first-child {
    position: sticky;
    margin-bottom: 0px;
    top: 0;
    background: ${({ theme }) => theme.theme === 'dark' ? '#141414' : '#ffffff'};
  }
`;

const NotesButton = styled(Button)`
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #C74D1B;
  border-color: #C74D1B;
  margin-left: 10px;
  padding: 0 16px;
  transition: all 0.3s ease;
  font-weight: 600;
  
  &:hover, &:focus {
    background-color: #E35E29;
    border-color: #E35E29;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  
  .anticon {
    margin-right: 0;
    font-size: 18px;
  }
`;

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