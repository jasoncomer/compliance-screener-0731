import React, { useState, useEffect } from 'react';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { BsBlock } from '../../../styles/Table';
import BtcTransactionInputsOutputs from './BtcTransactionTableInputsOutputs';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Theme } from '../../../context/ThemeContext';
import { satsToBTC, truncateAddress } from '../../../utils/crypto';

// Custom hook to track window size
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const HeaderWrapper = styled.div<{ theme?: { theme: Theme } }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: ${props => props.theme?.theme === 'dark' ? '#141414' : '#f5f5f5'};
  border-radius: 4px;
  margin-bottom: 10px;
`;

const HeaderItem = styled.div<{ theme?: { theme: Theme } }>`
  display: flex;
  flex-direction: column;
  font-family: monospace;
  color: ${props => props.theme?.theme === 'dark' ? '#ffffff' : '#000000'};

  span:first-child {
    font-weight: bold;
    margin-bottom: 4px;
  }

  a {
    color: ${props => props.theme?.theme === 'dark' ? '#ffffff' : '#000000'};
    &:hover {
      color: ${props => props.theme?.theme === 'dark' ? '#e87e4f' : '#b6420f'};
    }
  }
`;

interface BtcTransactionHeaderProps {
  txHash: string;
  blockHeight: number;
  date: string;
  fee: number;
  theme?: { theme: Theme };
  isSmallScreen: boolean;
}

const BtcTransactionHeader: React.FC<BtcTransactionHeaderProps> = ({ 
  txHash, 
  blockHeight, 
  date, 
  fee, 
  theme,
  isSmallScreen 
}) => (
  <HeaderWrapper theme={theme}>
    <HeaderItem theme={theme} style={{ fontFamily: 'monospace' }}>
      <span>Transaction Hash:</span>
      <Link to={`/home/block-explorer/transaction/${txHash}`} style={{ fontFamily: 'monospace' }}>
        {isSmallScreen ? truncateAddress(txHash) : txHash}
      </Link>
    </HeaderItem>
    <HeaderItem theme={theme} style={{fontFamily: 'monospace'}}>
      <span>Block Height:</span>
      <span style={{ fontFamily: 'monospace' }}>{blockHeight.toLocaleString()}</span>
    </HeaderItem>
    <HeaderItem theme={theme} style={{fontFamily: 'monospace'}}>
      <span>Fee:</span>
      <span style={{ fontFamily: 'monospace' }}>{satsToBTC(fee).toFixed(8)} BTC</span>
    </HeaderItem>
    <HeaderItem theme={theme} style={{fontFamily: 'monospace'}}>
      <span>Date:</span>
      <span>{date}</span>
    </HeaderItem>
  </HeaderWrapper>
);

interface BtcTransactionTableProps {
  transaction: BtcTransaction;
  theme?: { theme: Theme };
}

const BtcTransactionTable: React.FC<BtcTransactionTableProps> = ({ transaction, theme }) => {
  if (!transaction) return null;
  const { width } = useWindowSize();
  const isSmallScreen = width < 1080;

  return (
    <BsBlock theme={theme} style={{ fontFamily: 'monospace' }}>
      <BtcTransactionHeader
        txHash={transaction.txid}
        blockHeight={transaction.block}
        fee={transaction.fee_amt}
        date={new Date(transaction.timestamp * 1000).toLocaleString()}
        theme={theme}
        isSmallScreen={isSmallScreen}
      />

      <BtcTransactionInputsOutputs transaction={transaction} />
    </BsBlock>
  );
};

export default BtcTransactionTable;