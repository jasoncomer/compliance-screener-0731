import { Route, Routes, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Input } from 'antd';
import React from 'react';

import { determineInputType } from '../../utils/crypto';
import TransactionView from './TransactionView';
import Address from './Address';

const { Search: AntSearch } = Input;

const Wrapper = styled.div`
  padding: 20px;
  color: black;
  width: 100%;
  line-height: 1.5em;
`;

const Search = styled(AntSearch)`
  margin-bottom: 20px;
  width: 600px;
`;

const BlockExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');

  const onSearch = (value: string) => {
    console.log('value', value);
    if (!value) return;

    // fetch data based on type
    const load = async () => {
      const type = determineInputType(value);
      console.log('type:', type);
      if (!type) return;
      console.log('navigating to /home/block-explorer/', type, value);
      navigate(`/home/block-explorer/${type}/${value}`);
      setSearchValue(''); // Clear the input after navigation
    }
  
    load();
  }

  const searchPlaceholder = 'Search by block number, tx hash or address';

  return (
    <Wrapper>
      <h3>Block Explorer</h3>

      <Search placeholder={searchPlaceholder} onSearch={onSearch} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />

      <Routes>
        <Route path="/transaction/:txid" element={<TransactionView />} />
        <Route path="/block/:block" element={<div>Block</div>} />
        <Route path="/address/:address" element={<Address />} />
      </Routes>
    </Wrapper>
  );
};

export default BlockExplorer;