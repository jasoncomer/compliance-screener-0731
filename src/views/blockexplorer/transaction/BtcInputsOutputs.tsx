import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { colors } from '../../../styles/variables';

import { satsToBTC, truncateAddress } from '../../../utils/crypto';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { useAttribution } from '../../../context/AttributionContext';

interface BtcInputsOutputsProps {
  data: BtcTransaction['inputs'];
  type: 'inputs' | 'outputs';
}

const Amount = styled.span``;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;

  div {
    display: flex;
    justify-content: space-between;
    flex-direction: row;
  }
  .attributed {
    color: ${colors.attribution};
    font-weight: bold;
    &:hover {
      color: ${colors.attributionHover};
    }
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
  const url = window.location.href;
  const currAddress = url.split('/').pop();
  const { attributions, referenceAttributions } = useAttribution();

  const attribution = attributions[address]?.entity;
  const referenceAttribution = referenceAttributions[address]?.entity;

  const truncatedAddress = truncateAddress(address);

  if (address === currAddress) {
    return <span className="monospace">{truncatedAddress}</span>;
  }
  
  // Split reference attribution by "." if it exists
  const splitReferenceAttribution = referenceAttribution ? referenceAttribution.split('.')[0] : '';
  
  // Check if attribution and reference attribution match after splitting
  const attributionsMatch = attribution && splitReferenceAttribution && 
    attribution.toLowerCase() === splitReferenceAttribution.toLowerCase();
  
  const bsAttribution = attribution ? attribution : truncatedAddress;
  
  // css
  let className = attribution ? 'attributed' : '';
  if (referenceAttribution && !attributionsMatch) {
    className = 'attributed reference';
  }

  return (
    <Link 
      className={className} 
      to={`/home/block-explorer/address/${address}`}
    >
      {bsAttribution} {(referenceAttribution && !attributionsMatch) ? `(${splitReferenceAttribution})` : ''}
    </Link>
  );
}

const BtcInputsOutputs: React.FC<BtcInputsOutputsProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayData = isExpanded ? data : data.slice(0, 5);
  const showToggle = data.length > 5;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderAmt = useCallback((amt: number) => {
    const sats = satsToBTC(amt);
    return sats.toFixed(8);
  }, []);

  return (
    <Wrapper>
      {displayData.map((input: BtcTransaction['inputs'][0], index: number) => (
        <Row key={index}>
          <BtcTxAddress address={input.addr} />
          <Amount>{renderAmt(input.amt)}</Amount>
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