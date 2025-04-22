import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { colors } from '../../../styles/variables';

import { satsToBTC, truncateAddress } from '../../../utils/crypto';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { useAttribution } from '../../../context/AttributionContext';
import { truncateStringMiddle } from '../../../utils/generic';

interface BtcInputsOutputsProps {
  data: BtcTransaction['inputs'] | BtcTransaction['outputs'];
  type: 'inputs' | 'outputs';
}

const Amount = styled.span`
  font-family: monospace;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  left: 0;
  position: relative;
  width: 100%;
  overflow-x: auto; /* Enable horizontal scroll if needed */

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
    min-width: min-content; /* Prevent content from wrapping */
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
    text-align: left;
    &:hover {
      color: ${colors.link};
      text-decoration: underline;
    }
  }
  .address.highlighted {
    color: white;
    text-decoration: none;
    margin-left: 23px;
  }
  .address-container {
    display: flex;
    align-items: center;
    position: relative;
    width: 100%;
    min-width: 240px;
    justify-content: flex-start;
  }
  .address-wrapper {
    min-width: 240px;
    display: flex;
    align-items: center;
    position: relative;
    justify-content: flex-start;
  }
  .copy-button {
    cursor: pointer;
    color: #888;
    margin-right: 8px;
    font-size: 18px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
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
  .cospend-tooltip {
    background-color: #222;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    font-size: 14px;
    font-family: monospace;
    animation: fadeIn .5s;
    pointer-events: auto;
    white-space: nowrap;

    &:after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #222;

    }
  }
  .tooltip-content {
    display: flex;
    align-items: center;
    gap: 15px;
    pointer-events: auto;
  }
  .tooltip-content .copy-button {
    background: none;
    border: none;
    color: #888;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    margin: 0;
    transition: color 0.2s ease;
    &:hover {
      color: ${colors.primary};
    }
    &:active {
      transform: scale(0.95);
    }
  }
  .entity-id {
    min-width: 150px;
    font-family: monospace;
    color: ${colors.attribution};
    text-align: left;
    margin-right: 50px;
  }
  .cospend-id {
    min-width: 150px;
    font-family: monospace;
    color: ${colors.attributionReference};
    text-align: left;
    margin-right: 50px;
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
  width: 100%;
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
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  // Truncate address if it's longer than 42 characters
  const displayAddress = truncateStringMiddle(address, 42);

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
            <span className="address highlighted" title={address}>
              {displayAddress}
            </span>
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
            title={address}
          >
            {displayAddress}
          </Link>
        </div>
      </div>
      {showCopyAlert && <div className="copy-alert">Address copied</div>}
    </>
  );
};

const BtcInputsOutputs: React.FC<BtcInputsOutputsProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayData = isExpanded ? data : data.slice(0, 5);
  const showToggle = data.length > 5;
  const { attributions } = useAttribution();
  const [hoveredAddress, setHoveredAddress] = useState<string | null>(null);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [isEntityTooltipHovered, setIsEntityTooltipHovered] = useState(false);
  const [entityTooltipPosition, setEntityTooltipPosition] = useState({ top: 0, left: 0 });

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderAmt = useCallback((amt: number) => {
    const sats = satsToBTC(amt);
    return sats.toFixed(8);
  }, []);

  const copyCospendId = (cospendId: string) => {
    navigator.clipboard.writeText(cospendId)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy cospend ID: ', err);
      });
  };

  const copyEntityId = (entityId: string) => {
    navigator.clipboard.writeText(entityId)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy entity ID: ', err);
      });
  };

  // Handle mouse leave for both address and tooltip
  const handleMouseLeave = () => {
    // Use a small timeout to prevent tooltip from disappearing when moving between address and tooltip
    setTimeout(() => {
      if (!isTooltipHovered) {
        setHoveredAddress(null);
      }
    }, 100);
  };

  const handleMouseEnter = (address: string, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top - 10, // Position above the address with a small gap
      left: rect.left + (rect.width / 2) // Center horizontally
    });
    setHoveredAddress(address);
  };

  // Handle mouse leave for entity ID tooltip
  const handleEntityMouseLeave = () => {
    setTimeout(() => {
      if (!isEntityTooltipHovered) {
        setHoveredEntityId(null);
      }
    }, 100);
  };

  const handleEntityMouseEnter = (entityId: string, event: React.MouseEvent<HTMLSpanElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setEntityTooltipPosition({
      top: rect.top - 10,
      left: rect.left + (rect.width / 2)
    });
    setHoveredEntityId(entityId);
  };

  // Function to format entity ID with truncation if needed
  const formatEntityId = (entityId: string | undefined) => {
    if (!entityId) return '-';
    return entityId.length > 42 ? truncateAddress(entityId) : entityId;
  };

  // Check if entity ID is truncated
  const isEntityIdTruncated = (entityId: string | undefined) => {
    if (!entityId) return false;
    return entityId.length > 42;
  };

  return (
    <Wrapper>
      {displayData.map((item: BtcTransaction['inputs'][0] | BtcTransaction['outputs'][0], index: number) => (
        <Row key={index} className="row-container">
          <div
            className="address-container"
            onMouseEnter={(e) => handleMouseEnter(item.addr, e)}
            onMouseLeave={handleMouseLeave}
          >
            <BtcTxAddress
              address={item.addr}
            />
          </div>

          <span 
            className="entity-id" 
            title={attributions[item.addr]?.entity || '-'}
            onMouseEnter={(e) => isEntityIdTruncated(attributions[item.addr]?.entity) && handleEntityMouseEnter(attributions[item.addr]?.entity || '', e)}
            onMouseLeave={handleEntityMouseLeave}
          >
            {formatEntityId(attributions[item.addr]?.entity)}
          </span>

          <span className="script-type">{attributions[item.addr]?.script_type || '-'}</span>
          <Amount className="amount">{renderAmt(item.amt)}</Amount>
        </Row>
      ))}
      {showToggle && (
        <ToggleButton onClick={toggleExpand}>
          {isExpanded ? 'Show Less' : `Show All (${data.length})`}
        </ToggleButton>
      )}

      {/* Cospend ID Tooltip */}
      {hoveredAddress && attributions[hoveredAddress]?.cospend_id && (
        <div
          className="cospend-tooltip"
          style={{
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left + 50}px`,
            transform: 'translate(-50%, -100%)'
          }}
          onMouseEnter={() => setIsTooltipHovered(true)}
          onMouseLeave={() => {
            setIsTooltipHovered(false);
            setHoveredAddress(null);
          }}
        >
          <div className="tooltip-content">
            <span>Cospend ID: {attributions[hoveredAddress].cospend_id}</span>
            <button
              className="copy-button"
              onClick={() => copyCospendId(attributions[hoveredAddress].cospend_id || '')}
              title="Copy cospend ID"
            >
              {copySuccess ? '✓' : '⧉'}
            </button>
          </div>
        </div>
      )}

      {/* Entity ID Tooltip */}
      {hoveredEntityId && (
        <div
          className="cospend-tooltip"
          style={{
            position: 'fixed',
            top: `${entityTooltipPosition.top}px`,
            left: `${entityTooltipPosition.left + 20}px`,
            transform: 'translate(-50%, -100%)'
          }}
          onMouseEnter={() => setIsEntityTooltipHovered(true)}
          onMouseLeave={() => {
            setIsEntityTooltipHovered(false);
            setHoveredEntityId(null);
          }}
        >
          <div className="tooltip-content">
            <span>Entity ID: {hoveredEntityId}</span>
            <button
              className="copy-button"
              onClick={() => copyEntityId(hoveredEntityId)}
              title="Copy entity ID"
            >
              {copySuccess ? '✓' : '⧉'}
            </button>
          </div>
        </div>
      )}
    </Wrapper>
  );
};

export default BtcInputsOutputs;