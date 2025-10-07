import React, { memo, useCallback, useMemo, useState } from 'react';

import { Check, Copy } from 'lucide-react';
import { useSelector } from 'react-redux';

import EntityQuickView from '@/components/EntityQuickView';
import { useAttribution } from '@/context/AttributionContext';
import { cn } from '@/lib/utils';
import { selectCurrentOrganization } from '@/store/slices/organizationsSlice';
import { RootState } from '@/store/store';
import { BtcTransaction } from '@/typings/BtcTransaction';
import { satsToBTC, truncateAddress } from '@/utils/crypto';

import BtcTxAddress from './components/BtcTxAddress';
import CospendTooltip from './components/CospendTooltip';

interface BtcInputsOutputsProps {
  data: BtcTransaction['inputs'] | BtcTransaction['outputs'];
  type: 'inputs' | 'outputs';
}

interface InputOutputRowProps {
  item: BtcTransaction['inputs'][0] | BtcTransaction['outputs'][0];
  entityDisplayName: string;
  boDisplayName: string;
  shouldShowBO: boolean;
  displayEntityId: string;
  scriptType: string | undefined;
  sot: any;
  cospendId?: string;
  renderAmt: (amt: number) => string;
  onViewFullProfile: (sot: any) => void;
  onQuickView: (e: React.MouseEvent, entityId: string) => void;
  index: number;
}

const InputOutputRow = memo(({
  item,
  entityDisplayName,
  boDisplayName,
  shouldShowBO,
  displayEntityId,
  scriptType,
  sot,
  cospendId,
  renderAmt,
  onViewFullProfile,
  onQuickView,
  index
}: InputOutputRowProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(item.addr)
      .then(() => {
        setCopySuccess(true);
        setShowCopyAlert(true);
        setTimeout(() => {
          setCopySuccess(false);
        }, 1000);
        setTimeout(() => {
          setShowCopyAlert(false);
        }, 1000);
      })
      .catch(err => {
        console.error('Failed to copy address: ', err);
      });
  };
  return (
    <>
      <div className={cn(
        "grid grid-cols-[1fr_160px_70px_120px] gap-2 items-center py-0.5 w-full min-w-0 px-2",
        index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-900/50"
      )}>
        <div className="flex items-center w-full min-w-0">
          <button
            onClick={copyToClipboard}
            title="Copy address"
            className={cn(
              "cursor-pointer text-gray-400 mr-2 text-lg flex items-center flex-shrink-0",
              "hover:text-orange-500 transition-colors duration-200",
              "dark:text-gray-500 dark:hover:text-orange-400"
            )}
          >
            {copySuccess ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <CospendTooltip address={item.addr} cospendId={cospendId}>
            {({ onMouseEnter, onMouseLeave }) => (
              <div
                onMouseEnter={(e) => onMouseEnter(item.addr, e.currentTarget, e)}
                onMouseLeave={onMouseLeave}
                className="w-full min-w-0"
              >
                <BtcTxAddress address={item.addr} />
              </div>
            )}
          </CospendTooltip>
        </div>

      <div className="flex items-center gap-2 min-w-[100px] overflow-hidden">
        <span
          className="font-mono text-sm text-left text-ellipsis whitespace-nowrap overflow-hidden"
          title={shouldShowBO ? boDisplayName : entityDisplayName || '-'}
        >
          {displayEntityId}
        </span>
        {sot && (
          <EntityQuickView
            entity={{
              _id: sot._id,
              proper_name: sot.proper_name,
              entity_id: sot.entity_id
            }}
            sot={sot}
            onViewFull={onViewFullProfile}
            onQuickView={onQuickView}
            popoverPlacement="right"
            popoverWidth={450}
          />
        )}
      </div>

      <span className="font-mono text-sm text-gray-600 text-left dark:text-gray-400">
        {scriptType || '-'}
      </span>

        <span className="font-mono text-sm text-right">
          {renderAmt(item.amt)}
        </span>
      </div>
      {showCopyAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-8 py-4 rounded-md shadow-lg z-[1000] text-lg animate-fadeIn">
          Address copied
        </div>
      )}
    </>
  );
});

InputOutputRow.displayName = 'InputOutputRow';

const BtcInputsOutputs: React.FC<BtcInputsOutputsProps> = ({ data, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayData = isExpanded ? data : data.slice(0, 5);
  const showToggle = data.length > 5;
  const { attributions } = useAttribution();
  const organization = useSelector(selectCurrentOrganization);
  const { itemsMap } = useSelector((state: RootState) => state.sot);

  const renderAmt = useCallback((amt: number) => {
    const sats = satsToBTC(amt);
    return sats.toFixed(8);
  }, []);

  const formatEntityId = useCallback((entityId: string | undefined, bo: string | undefined) => {
    if (!entityId) return '-';
    const displayId = (bo && bo !== entityId) ? bo : entityId;
    return displayId.length > 42 ? truncateAddress(displayId) : displayId;
  }, []);

  const getEntityDisplayName = useCallback((entityId: string) => {
    if (!entityId) return '';

    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    const entityType = entity?.entity_type;

    if (organization?.settings.allowCSAM === false && entityType === "csam") {
      return 'CSAM Related Entity';
    }

    return entity?.proper_name || entityId;
  }, [itemsMap, organization?.settings.allowCSAM]);

  const getEntitySot = useCallback((entityId: string) => {
    if (!entityId) return null;
    return Object.values(itemsMap).find(sot => sot.entity_id === entityId) || null;
  }, [itemsMap]);


  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Memoize row data processing
  const processedRows = useMemo(() => {
    return displayData.map(item => {
      const attribution = attributions[item.addr];
      const entityDisplayName = getEntityDisplayName(attribution?.entity);
      const boDisplayName = getEntityDisplayName(attribution?.bo);
      const shouldShowBO = !!(attribution?.bo && attribution?.bo !== attribution?.entity);
      const primaryEntityId = shouldShowBO ? attribution?.bo : attribution?.entity;
      const displayEntityId = formatEntityId(entityDisplayName, boDisplayName);
      const scriptType = attribution?.script_type;
      const sot = getEntitySot(primaryEntityId);
      const cospendId = attribution?.cospend_id;

      return {
        item,
        entityDisplayName,
        boDisplayName,
        shouldShowBO,
        displayEntityId,
        scriptType,
        sot,
        cospendId
      };
    });
  }, [displayData, attributions, getEntityDisplayName, formatEntityId, getEntitySot]);

  // Show mining reward message if no inputs and type is 'inputs'
  if (type === 'inputs' && data.length === 0) {
    return (
      <div className="flex flex-col w-full">
        <span className="text-white font-mono text-lg py-3">⛏️ Mining Reward</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {processedRows.map((rowData, index) => (
        <InputOutputRow
          key={index}
          {...rowData}
          index={index}
          renderAmt={renderAmt}
          onViewFullProfile={(s) => {
            if (s?.entity_id) window.open(`/home/vasp-explorer?entity=${s.entity_id}`, '_blank')?.focus();
          }}
          onQuickView={(e) => e.stopPropagation()}
        />
      ))}

      {showToggle && (
        <button
          onClick={toggleExpand}
          className={cn(
            "my-2 text-gray-700 px-2 py-1 bg-gray-100 border border-gray-300",
            "rounded cursor-pointer text-sm self-start transition-colors duration-200",
            "hover:bg-gray-200",
            "dark:text-white dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800"
          )}
        >
          {isExpanded ? 'Show Less' : `Show All (${data.length})`}
        </button>
      )}
    </div>
  );
};

export default memo(BtcInputsOutputs);