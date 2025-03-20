import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { colors } from '../../../styles/variables';

import { satsToBTC } from '../../../utils/crypto';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { useAttribution } from '../../../context/AttributionContext';

interface BtcInputsOutputsProps {
  data: BtcTransaction['inputs'];
  type: 'inputs' | 'outputs';
}

const Amount = styled.span`
  font-family: monospace;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  left: 0;

  div {
    display: flex;
    justify-content: space-between;
    flex-direction: row;
  }
  .row-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  .attributed {
    color: ${colors.attribution};
    font-weight: bold;
    &:hover {
      color: ${colors.attributionHover};
    }
  }
  .address {
    font-family: monospace;
    left: 0;
    color: ${colors.primary};
    &:hover {
      color: ${colors.link};
    }
  }
  .toggle-button {
    color: #888;
    cursor: pointer;
    position: absolute;
    margin-left: 85%;
    &:hover {
      color: orange;
    }
  }
  .address-container {
    display: flex;
    align-items: center;
    position: relative;
    width: 100%;
  }
  .address-wrapper {
    min-width: 240px;
    display: flex;
    align-items: center;
  }
  .copy-button {
    cursor: pointer;
    color: #888;
    margin-right: 8px;
    &:hover {
      color: ${colors.primary};
    }
  }
  .copy-alert {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: ${colors.primary};
    color: white;
    padding: 15px 30px;
    border-radius: 6px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    font-size: 18px;
    animation: fadeIn 0.3s, fadeOut 0.3s 1.7s;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;

const Row = styled.div`
  margin-bottom: 8px;
  left: 0;
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
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const attribution = attributions[address]?.entity;
  const referenceAttribution = referenceAttributions[address]?.entity;

  // Show first 6 characters with ellipsis instead of truncating
  const shortenedAddress = `${address.substring(0, 6)}...`;
  const displayAddress = showFullAddress ? address : shortenedAddress;

  // Split reference attribution by "." if it exists
  const splitReferenceAttribution = referenceAttribution ? referenceAttribution.split('.')[0] : '';
  
  // Check if attribution and reference attribution match after splitting
  const attributionsMatch = attribution && splitReferenceAttribution && 
    attribution.toLowerCase() === splitReferenceAttribution.toLowerCase();
  
  const bsAttribution = attribution ? attribution : displayAddress;
  
  // css
  let className = attribution ? 'attributed' : '';
  if (referenceAttribution && !attributionsMatch) {
    className = 'attributed reference';
  }

  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address)
      .then(() => {
        setCopySuccess(true);
        setShowCopyAlert(true);
        setTimeout(() => setCopySuccess(false), 2000);
        setTimeout(() => setShowCopyAlert(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy address: ', err);
      });
  };

  if (address === currAddress) {
    return (
      <>
        <div className="address-container">
          <div className="address-wrapper">
            <span className="copy-button" onClick={copyToClipboard} title="Copy address">
              {copySuccess ? '✓' : '⧉'}
            </span>
            <span className="address" style={{ cursor: 'pointer' }} onClick={() => setShowFullAddress(!showFullAddress)}>
              {displayAddress}
            </span>
          </div>
          <small className="toggle-button" onClick={() => setShowFullAddress(!showFullAddress)}>
            {!showFullAddress ? 'Show more' : 'Show less'}
          </small>
        </div>
        {showCopyAlert && <div className="copy-alert">Address copied</div>}
      </>
    );
  }

  return (
    <>
      <div className="address-container">
        <div className="address-wrapper">
          <span className="copy-button" onClick={copyToClipboard} title="Copy address">
            {copySuccess ? '✓' : '⧉'}
          </span>
          <Link 
            className={`address ${className}`}
            to={`/home/block-explorer/address/${address}`}
          >
            {bsAttribution} {(referenceAttribution && !attributionsMatch) ? `(${splitReferenceAttribution})` : ''}
          </Link>
        </div>
        <small 
          className="toggle-button"
          onClick={(e) => { e.preventDefault(); setShowFullAddress(!showFullAddress); }}
        >
          {!showFullAddress ? 'Show more' : 'Show less'}
        </small>
      </div>
      {showCopyAlert && <div className="copy-alert">Address copied</div>}
    </>
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
        <Row key={index} className="row-container">
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