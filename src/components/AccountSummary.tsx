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

const SummaryContent = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 20px;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
`;

const Label = styled.span`
  color: #aaa;
  font-weight: 500;
`;

const Value = styled.span`
  color: #fff;
  text-align: right;
`;

interface AccountSummaryProps {
  data: IApiResponse;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ data }) => {
  return (
    <AccountSummaryWrapper>
      <span style={{ fontWeight: 'bold' }}>Account Summary</span>
      <SummaryContent>
        <Column>
          <SummaryRow>
            <Label>Address:</Label>
            <Value>{data.address}</Value>
          </SummaryRow>
          <SummaryRow>
            <Label>Current Balance:</Label>
            <Value>{data.balance} BTC</Value>
          </SummaryRow>
          <SummaryRow>
            <Label>Transactions:</Label>
            <Value>{data.txs.length}</Value>
          </SummaryRow>
        </Column>
        <Column>
          <SummaryRow>
            <Label>Total Received:</Label>
            <Value>{(data.total_received / 10e8).toFixed(8)} BTC</Value>
          </SummaryRow>
          <SummaryRow>
            <Label>Total Sent:</Label>
            <Value>{(data.total_sent / 10e8).toFixed(8)} BTC</Value>
          </SummaryRow>
        </Column>
      </SummaryContent>
    </AccountSummaryWrapper>
  );
};

export default AccountSummary;