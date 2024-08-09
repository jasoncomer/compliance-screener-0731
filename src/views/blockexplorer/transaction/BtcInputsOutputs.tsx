import React, { useState } from 'react';
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

const ToggleButton = styled.button`
  margin-top: 8px;
  color: #333;
  padding: 4px 8px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #e0e0e0;
  }
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
  const [isExpanded, setIsExpanded] = useState(false);

  const displayData = isExpanded ? data : data.slice(0, 5);
  const showToggle = data.length > 5;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Wrapper>
      {displayData.map((input, index) => (
        <Row key={index}>
          <BtcTxAddress address={input.addr} />
          <span>{satsToBTC(input.amt)}</span>
        </Row>
      ))}
      {showToggle && (
        <ToggleButton onClick={toggleExpand}>
          {isExpanded ? 'Show Less' : `Show All (${data.length})`}
        </ToggleButton>
      )}
    </Wrapper>
  );
};

export default BtcInputsOutputs;