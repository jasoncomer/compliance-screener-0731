import React from 'react';
import styled from 'styled-components';

import BtcInputsOutputs from './BtcInputsOutputs';
import { satsToBTC } from '../../../utils/crypto';
import { BtcTransaction } from '../../../typings/BtcTransaction';

interface BtcTransactionInputsOutputsProps {
  transaction: BtcTransaction;
}

const TableWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;

  .inputs, .outputs {
    display: flex;
    flex-direction: column;
    flex: 1;

    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
      margin-bottom: 10px;
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