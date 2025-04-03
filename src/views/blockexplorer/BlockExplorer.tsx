import { Route, Routes, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import React from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import Input from '../../components/common/Input';

import ViewWrapper from '../../components/ViewWrapper';
import { determineInputType } from '../../utils/crypto';
import TransactionView from './TransactionView';
import Address from './Address';

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
  border-bottom: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#303030' : '#e8e8e8'};
`;

const HeaderContent = styled.div`
  padding: 20px 20px;
`;

const ContentWrapper = styled.div`
  padding: 0 20px;
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
    padding: 0 20px;
    margin-bottom: 10px;
    top: 0;
    z-index: 11;
    background: ${({ theme }) => theme.theme === 'dark' ? '#141414' : '#ffffff'};
  }
`;

const BlockExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');

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

  const searchPlaceholder = 'Search by block number, tx hash or address';

  return (
    <StyledViewWrapper
      icon={<GlobalOutlined style={{ fontSize: '28px', color: '#C74D1B', fontWeight: 'bold' }} />}
      title="Block Explorer"
    >
      <ExplorerLayout>
        <FixedHeader>
          <HeaderContent>
            <Search 
              placeholder={searchPlaceholder} 
              value={searchValue} 
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={() => onSearch(searchValue)}
            />
          </HeaderContent>
        </FixedHeader>

        <ContentWrapper>
          <Routes>
            <Route path="/transaction/:txid" element={<TransactionView />} />
            <Route path="/block/:block" element={<div>Block</div>} />
            <Route path="/address/:address" element={<Address />} />
          </Routes>
        </ContentWrapper>
      </ExplorerLayout>
    </StyledViewWrapper>
  );
};

export default BlockExplorer;