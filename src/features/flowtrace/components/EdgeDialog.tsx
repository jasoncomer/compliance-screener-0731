import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    from: string;
    to: string;
    amount?: number | string;
    currency?: string;
    txHash?: string;
  } | null;
  onReverse?: () => void;
  onSetColor?: (color: string) => void;
};

const EdgeDialog: React.FC<Props> = ({ open, onOpenChange, data, onReverse, onSetColor }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connection Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>From</span><span>{data?.from}</span></div>
          <div className="flex justify-between"><span>To</span><span>{data?.to}</span></div>
          {data?.amount !== undefined && (
            <div className="flex justify-between"><span>Amount</span><span>{String(data.amount)} {data?.currency || ''}</span></div>
          )}
          {data?.txHash && (
            <div className="flex justify-between"><span>Tx Hash</span><span className="truncate max-w-[240px]">{data.txHash}</span></div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {onReverse && (
            <button className="px-3 py-1 text-sm border rounded" onClick={onReverse}>Reverse Direction</button>
          )}
          {onSetColor && (
            <div className="flex items-center gap-1">
              {['#9ca3af','#f97316','#ef4444','#10b981','#3b82f6','#a855f7'].map(c => (
                <button key={c} className="h-5 w-5 rounded-full border" style={{ backgroundColor: c }} onClick={() => onSetColor(c)} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EdgeDialog;


