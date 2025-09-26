import React, { useCallback, useMemo, useState } from 'react';

import { BtcTransaction } from '../../../typings/BtcTransaction';
import { satsToBTC } from '../../../utils/crypto';

import BtcInputsOutputs from './BtcInputsOutputs';

interface BtcTransactionInputsOutputsProps {
  transaction: BtcTransaction;
  isLoading?: boolean;
}

// Loading skeleton component
const LoadingSkeleton = React.memo(() => (
  <div className="grid grid-cols-2 gap-5 w-full min-w-0 h-4/5 max-[1680px]:grid-cols-1 max-[1680px]:gap-8">
    {[0, 1].map((index) => (
      <div key={index} className="flex flex-col min-w-0 min-h-0 relative max-h-[400px]">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[1px] border-b border-border px-[10px] py-2 mb-[10px]">
          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
          <hr className="m-0 border-none w-full" />
          <div className="h-5 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-2 px-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="grid grid-cols-4 gap-2">
              <div className="h-4 bg-muted animate-pulse rounded col-span-2" />
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

const BtcTransactionInputsOutputs: React.FC<BtcTransactionInputsOutputsProps> = React.memo(({ transaction, isLoading = false }) => {
  const [expandedInputs, setExpandedInputs] = useState(false);
  const [expandedOutputs, setExpandedOutputs] = useState(false);

  const INITIAL_DISPLAY_COUNT = 10;
  const LARGE_LIST_THRESHOLD = 50;

  // Safely extract inputs and outputs
  const { inputs: cpin = [], outputs: cpout = [] } = transaction || {};

  const totalInput = useMemo(() =>
    cpin.reduce((acc, input) => acc + input.amt, 0),
    [cpin]
  );

  const totalOutput = useMemo(() =>
    cpout.reduce((acc, output) => acc + output.amt, 0),
    [cpout]
  );

  const formattedInputTotal = useMemo(() =>
    satsToBTC(totalInput),
    [totalInput]
  );

  const formattedOutputTotal = useMemo(() =>
    satsToBTC(totalOutput),
    [totalOutput]
  );

  // Optimize display for large lists
  const displayedInputs = useMemo(() => {
    if (expandedInputs || cpin.length <= INITIAL_DISPLAY_COUNT) {
      return cpin;
    }
    return cpin.slice(0, INITIAL_DISPLAY_COUNT);
  }, [cpin, expandedInputs]);

  const displayedOutputs = useMemo(() => {
    if (expandedOutputs || cpout.length <= INITIAL_DISPLAY_COUNT) {
      return cpout;
    }
    return cpout.slice(0, INITIAL_DISPLAY_COUNT);
  }, [cpout, expandedOutputs]);

  const handleExpandInputs = useCallback(() => {
    setExpandedInputs(true);
  }, []);

  const handleExpandOutputs = useCallback(() => {
    setExpandedOutputs(true);
  }, []);

  // Show loading skeleton if loading
  if (isLoading || !transaction) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="grid grid-cols-2 gap-5 w-full min-w-0 h-4/5 max-[1680px]:grid-cols-1 max-[1680px]:gap-8 pb-2">
      <div className="flex flex-col min-w-0 min-h-0 relative max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[1px] border-b border-border px-[10px] py-2 sticky top-0 z-[2] bg-background/90 backdrop-blur-lg">
          <span className="whitespace-nowrap font-medium text-foreground">
            Inputs {cpin.length > LARGE_LIST_THRESHOLD && `(${cpin.length})`}
          </span>
          <hr className="m-0 border-none w-full" />
          <span className="whitespace-nowrap font-medium text-foreground">{formattedInputTotal} BTC</span>
        </div>
        <BtcInputsOutputs data={displayedInputs} type='inputs' />
        {!expandedInputs && cpin.length > INITIAL_DISPLAY_COUNT && (
          <button
            onClick={handleExpandInputs}
            className="mt-2 mx-2 py-2 px-4 text-sm font-medium text-primary hover:text-primary/80 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Show {cpin.length - INITIAL_DISPLAY_COUNT} more inputs
          </button>
        )}
      </div>

      <div className="flex flex-col min-w-0 min-h-0 relative max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[1px] border-b border-border px-[10px] py-2 sticky top-0 z-[2] bg-background/90 backdrop-blur-lg">
          <span className="whitespace-nowrap font-medium text-foreground">
            Outputs {cpout.length > LARGE_LIST_THRESHOLD && `(${cpout.length})`}
          </span>
          <hr className="m-0 border-none w-full" />
          <span className="whitespace-nowrap font-medium text-foreground">{formattedOutputTotal} BTC</span>
        </div>
        <BtcInputsOutputs data={displayedOutputs} type='outputs' />
        {!expandedOutputs && cpout.length > INITIAL_DISPLAY_COUNT && (
          <button
            onClick={handleExpandOutputs}
            className="mt-2 mx-2 py-2 px-4 text-sm font-medium text-primary hover:text-primary/80 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Show {cpout.length - INITIAL_DISPLAY_COUNT} more outputs
          </button>
        )}
      </div>
    </div>
  );
});

BtcTransactionInputsOutputs.displayName = 'BtcTransactionInputsOutputs';

export default BtcTransactionInputsOutputs;