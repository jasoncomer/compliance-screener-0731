import React from 'react';
import styled from 'styled-components';

import BtcInputsOutputs from './BtcInputsOutputs';
import { satsToBTC } from '../../../utils/crypto';
import { BtcTransaction } from '../../../typings/BtcTransaction';

interface BtcTransactionInputsOutputsProps {
  transaction: BtcTransaction;
}

const TableWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%;
  min-width: 0; /* Prevent grid from overflowing */

  @media (max-width: 1680px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .inputs, .outputs {
    display: flex;
    flex-direction: column;
    min-width: 0; /* Allow content to shrink below its minimum content size */
    
    .header {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
      margin-bottom: 10px;
      position: relative;
      top: 0;
      z-index: 2;
      padding: 8px 10px ;
   

      hr {
        margin: 0;
        border: none;
        width: 100%;
      }

      span {
        white-space: nowrap;
        font-weight: 500;
      }
    }

    /* Ensure content can be scrolled horizontally if needed */
    > div:not(.header) {
      overflow-x: auto;
      max-width: 100%;
    }
  }
`;

const BtcTransactionInputsOutputs: React.FC<BtcTransactionInputsOutputsProps> = ({ transaction }) => {
  const { inputs: cpin, outputs: cpout } = transaction;
  const totalInput = cpin.reduce((acc, input) => acc + input.amt, 0);
  const totalOutput = cpout.reduce((acc, output) => acc + output.amt, 0);

  return (
    <TableWrapper>
      <div className='inputs'>
        <div className='header'>
          <span>Inputs</span>
          <hr />
          <span>{satsToBTC(totalInput)} BTC</span>
        </div>
        <BtcInputsOutputs data={cpin} type='inputs' />
      </div>

      <div className='outputs'>
        <div className='header'>
          <span>Outputs</span>
          <hr />
          <span>{satsToBTC(totalOutput)} BTC</span>
        </div>
        <BtcInputsOutputs data={cpout} type='outputs' />
      </div>

    </TableWrapper>
  );
};

export default BtcTransactionInputsOutputs;