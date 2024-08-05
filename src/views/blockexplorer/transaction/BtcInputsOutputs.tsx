import React from 'react';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import styled from 'styled-components';
import { satsToBTC } from '../../../utils/crypto';
import { Link } from 'react-router-dom';

interface BtcInputsOutputsProps {
  data: BtcTransaction['cpin'];
  type: 'inputs' | 'outputs';
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;

  div {
    display: flex;
    justify-content: space-between;
    flex-direction: row;
  }
`;

const Row = styled.div`
  margin-bottom: 8px;
`;

interface BtcTxAddressProps {
  address: string;
}

const BtcTxAddress: React.FC<BtcTxAddressProps> = ({ address }) => {
  // get current url
  const url = window.location.href;
  const currAddress = url.split('/').pop();
  if (address === currAddress) {
    return <span>{address}</span>;
  }

  return <Link to={`/home/block-explorer/address/${address}`}>{address}</Link>;
}

const BtcInputsOutputs: React.FC<BtcInputsOutputsProps> = ({ data }) => {
  return (
    <Wrapper>
      {data.map((input, index) => (
        <Row key={index}>
          <BtcTxAddress address={input.addr} />
          <span>{satsToBTC(input.amt)}</span>
        </Row>
      ))}
    </Wrapper>
  );
};

export default BtcInputsOutputs;