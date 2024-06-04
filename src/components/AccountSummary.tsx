import React from 'react';
import { IApiResponse } from '../typings/interfaces';
import styled from 'styled-components';

const AccountSummaryWrapper = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  margin: 1em;
  padding: 1em;

  width: 500px;
  height: auto;
  
  background-color: #000000ad;
  border: 1px solid #ccc;
  border-radius: 6px;
  z-index: 1;

  h4,
  span {
    line-height: 24px;
  }
`;

interface AccountSummaryProps {
  data: IApiResponse;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ data }) => {
  return (
    <AccountSummaryWrapper>
      <span style={{ fontWeight: 'bold' }}>Account Summary</span>
      <div style={{ display: 'flex', flexDirection: 'row'}}>
        <div style={{ display:'flex', flexDirection: 'column', alignItems: 'start', marginRight: '1em' }}>
          <span>Address:</span>
          <span>Current Balance:</span>
          <span>Transactions:</span>
          <span>Total Received:</span>
          <span>Total Sent:</span>
        </div>
        <div style={{ display:'flex', flexDirection: 'column', alignItems: 'start'  }}>
          <span>{data.address}</span>
          <span>{data.balance} BTC</span>
          <span>{data.txs.length}</span>
          <span>{data.total_received / 10e8} BTC</span>
          <span>{data.total_sent / 10e8} BTC</span>
        </div>
      </div>
    </AccountSummaryWrapper>
  );
};

export default AccountSummary;