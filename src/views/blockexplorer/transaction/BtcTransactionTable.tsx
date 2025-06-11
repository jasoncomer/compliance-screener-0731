import React, { useState } from 'react';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { BsBlock } from '../../../styles/Table';
import BtcTransactionInputsOutputs from './BtcTransactionTableInputsOutputs';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Theme } from '../../../context/ThemeContext';
import { satsToBTC, truncateAddress } from '../../../utils/crypto';
import useWindowSize from '../../../hooks/useWindowSize';

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

const CopyButton = styled.span`
  cursor: pointer;
  color: #888;
  font-size: 18px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: 8px;
  &:hover {
    color: ${props => props.theme?.theme === 'dark' ? '#ffffff' : '#000000'};
  }
`;

const CopyAlert = styled.div<{ theme?: { theme: Theme } }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${props => props.theme?.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  padding: 8px 16px;
  border-radius: 4px;
  z-index: 1000;
`;

const TransactionHashContainer = styled.div`
  display: flex;
  align-items: center;
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
}) => {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [showCopyAlert, setShowCopyAlert] = useState<boolean>(false);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    navigator.clipboard.writeText(txHash)
      .then(() => {
        setCopySuccess(true);
        setShowCopyAlert(true);
        setTimeout(() => setCopySuccess(false), 2000);
        setTimeout(() => setShowCopyAlert(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy transaction hash: ', err);
      });
  };

  return (
    <HeaderWrapper theme={theme}>
      <HeaderItem theme={theme} style={{ fontFamily: 'monospace' }}>
        <span>Transaction Hash:</span>
        <TransactionHashContainer>
          <CopyButton onClick={copyToClipboard} title="Copy transaction hash">
            {copySuccess ? '✓' : '⧉'}
          </CopyButton>
          <Link to={`/home/block-explorer/transaction/${txHash}`} style={{ fontFamily: 'monospace' }}>
            {isSmallScreen ? truncateAddress(txHash) : txHash}
          </Link>
        </TransactionHashContainer>
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
      {showCopyAlert && <CopyAlert theme={theme}>Transaction hash copied</CopyAlert>}
    </HeaderWrapper>
  );
};

interface BtcTransactionTableProps {
  transaction: BtcTransaction;
  theme?: { theme: Theme };
}

const BtcTransactionTable: React.FC<BtcTransactionTableProps> = ({ transaction, theme }) => {
  const { width } = useWindowSize();

  if (!transaction) return null;
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