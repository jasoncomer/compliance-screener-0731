import { Route, Routes, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import React from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import Input from '../../components/common/Input';

import ViewWrapper from '../../components/ViewWrapper';
import { determineInputType } from '../../utils/crypto';
import TransactionView from './TransactionView';
import Address from './Address';

const Search = styled(Input)`
  margin-bottom: 20px;
  width: 600px;
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
    <ViewWrapper
      icon={<GlobalOutlined style={{ fontSize: '28px', color: '#C74D1B', fontWeight: 'bold' }} />}
      title="Block Explorer"
    >
      <Search 
        placeholder={searchPlaceholder} 
        value={searchValue} 
        onChange={(e) => setSearchValue(e.target.value)}
        onPressEnter={() => onSearch(searchValue)}
        style={{ width: '400px' }}
      />

      <Routes>
        <Route path="/transaction/:txid" element={<TransactionView />} />
        <Route path="/block/:block" element={<div>Block</div>} />
        <Route path="/address/:address" element={<Address />} />
      </Routes>
    </ViewWrapper>
  );
};

export default BlockExplorer;