import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Save, 
  Trash2, 
  GitBranch, 
  Network,
  AlertTriangle
} from 'lucide-react';

interface StartNewGraphConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newAddress: string;
  existingNodeCount: number;
  existingConnectionCount: number;
  onSaveAndNew: () => void;
  onDiscardAndNew: () => void;
  onCancel: () => void;
}

export const StartNewGraphConfirmationDialog: React.FC<StartNewGraphConfirmationDialogProps> = ({
  open,
  onOpenChange,
  newAddress,
  existingNodeCount,
  existingConnectionCount,
  onSaveAndNew,
  onDiscardAndNew,
  onCancel,
}) => {
  const hasExistingWork = existingNodeCount > 0 || existingConnectionCount > 0;

  if (!hasExistingWork) {
    // If no existing work, just proceed with starting new graph
    onDiscardAndNew();
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-5">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Start New Graph</span>
          </DialogTitle>
          <DialogDescription className="space-y-4 text-base">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 w-full">
              <p className="font-medium text-gray-900 dark:text-gray-50 mb-3 text-base">
                You're about to start a new graph with this address:
              </p>
              <code className="block bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded border text-sm font-mono break-all w-full">
                {newAddress}
              </code>
            </div>
            
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 w-full">
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-3 text-base">
                You currently have work in progress:
              </p>
              <div className="flex flex-wrap gap-3 w-full">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded border text-sm flex-shrink-0">
                  <Network className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">
                    {existingNodeCount} node{existingNodeCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded border text-sm flex-shrink-0">
                  <GitBranch className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">
                    {existingConnectionCount} connection{existingConnectionCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 font-medium text-base">
              Choose how to proceed with your current work:
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-2 w-full">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full">
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto order-1"
            >
              Cancel
            </Button>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full">
            <Button
              variant="secondary"
              onClick={onSaveAndNew}
              className="w-full sm:w-auto flex items-center justify-center gap-2 order-2 text-sm"
            >
              <Save className="h-4 w-4" />
              Save & New
            </Button>
            
            <Button
              variant="destructive"
              onClick={onDiscardAndNew}
              className="w-full sm:w-auto flex items-center justify-center gap-2 order-3 text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Discard & New
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartNewGraphConfirmationDialog;