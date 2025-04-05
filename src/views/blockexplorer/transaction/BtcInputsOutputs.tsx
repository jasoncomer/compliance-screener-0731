import React, { useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { colors } from '../../../styles/variables';

import { satsToBTC } from '../../../utils/crypto';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { useAttribution } from '../../../context/AttributionContext';
import { api } from '../../../api/api';
import { IBtcAddress } from '../../../typings/BtcAddress';

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
    gap: 16px;
    align-items: center;
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
    text-decoration: none;
    &:hover {
      color: ${colors.link};
      text-decoration: underline;
    }
  }
  .address.highlighted {
    color: white;
    text-decoration: none;
  }
  .address-container {
    display: flex;
    align-items: center;
    position: relative;
    width: 100%;
    min-width: 240px;
  }
  .address-wrapper {
    min-width: 240px;
    display: flex;
    align-items: center;
    position: relative;
  }
  .copy-button {
    cursor: pointer;
    color: #888;
    margin-right: 8px;
    font-size: 18px;
    display: flex;
    align-items: center;
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
  .attribution-tooltip {
    position: absolute;
    top: 0;
    left: 100%;
    margin-left: 10px;
    background-color: #222;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 100;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .address-wrapper:hover .attribution-tooltip {
    opacity: 1;
  }
  .entity-id {
    min-width: 150px;
    font-family: monospace;
    color: ${colors.attribution};
    text-align: left;
  }
  .script-type {
    min-width: 100px;
    font-family: monospace;
    color: ${colors.gray[600]};
    text-align: left;
  }
  .amount {
    min-width: 100px;
    text-align: right;
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
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const attribution = attributions[address]?.entity;
  const referenceAttribution = referenceAttributions[address]?.entity;

  // No more address truncation
  const displayAddress = address;
  
  // Split reference attribution by "." if it exists
  const splitReferenceAttribution = referenceAttribution ? referenceAttribution.split('.')[0] : '';
  
  // Check if attribution and reference attribution match after splitting
  const attributionsMatch = attribution && splitReferenceAttribution && 
    attribution.toLowerCase() === splitReferenceAttribution.toLowerCase();
  
  // Prepare tooltip content
  const hasAttributions = attribution || referenceAttribution;
  let tooltipContent = '';
  
  if (attribution) {
    tooltipContent += attribution;
  }
  
  if (referenceAttribution && !attributionsMatch) {
    if (tooltipContent) tooltipContent += ' | ';
    tooltipContent += splitReferenceAttribution;
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
            <span className="address highlighted">
              {displayAddress}
            </span>
            {hasAttributions && <div className="attribution-tooltip">{tooltipContent}</div>}
          </div>
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
            className="address"
            to={`/home/block-explorer/address/${address}`}
          >
            {displayAddress}
          </Link>
          {hasAttributions && <div className="attribution-tooltip">{tooltipContent}</div>}
        </div>
      </div>
      {showCopyAlert && <div className="copy-alert">Address copied</div>}
    </>
  );
}

const BtcInputsOutputs: React.FC<BtcInputsOutputsProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayData = isExpanded ? data : data.slice(0, 5);
  const showToggle = data.length > 5;
  const { attributions } = useAttribution();
  const [addressInfo, setAddressInfo] = useState<Record<string, IBtcAddress>>({});

  useEffect(() => {
    const fetchAddressInfo = async () => {
      const uniqueAddresses = [...new Set(displayData.map(input => input.addr))];
      const addressData: Record<string, IBtcAddress> = {};
      
      await Promise.all(
        uniqueAddresses.map(async (addr) => {
          try {
            const response = await api.blockchain.getAddress(addr);
            addressData[addr] = response.data;
          } catch (error) {
            console.error(`Failed to fetch address info for ${addr}:`, error);
          }
        })
      );
      
      setAddressInfo(addressData);
    };

    fetchAddressInfo();
  }, [displayData]);

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
          <span className="entity-id">{attributions[input.addr]?.entity || '-'}</span>
          <span className="script-type">{addressInfo[input.addr]?.script_type || '-'}</span>
          <Amount className="amount">{renderAmt(input.amt)}</Amount>
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