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
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle,
  Network,
  Eye,
  Plus
} from 'lucide-react';

interface DuplicateNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateAddress: string;
  existingNodeLabel?: string;
  onViewExisting: () => void;
  onStartNewGraph: () => void;
  onCancel: () => void;
}

export const DuplicateNodeDialog: React.FC<DuplicateNodeDialogProps> = ({
  open,
  onOpenChange,
  duplicateAddress,
  existingNodeLabel,
  onViewExisting,
  onStartNewGraph,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            Address Already Exists
          </DialogTitle>
          <DialogDescription className="space-y-4 text-base">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                This address already exists in your graph:
              </p>
              <code className="block bg-white dark:bg-gray-900 px-3 py-2 rounded border text-sm font-mono break-all">
                {duplicateAddress}
              </code>
            </div>
            
            {existingNodeLabel && existingNodeLabel !== duplicateAddress && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Network className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Currently labeled as:
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {existingNodeLabel}
                  </Badge>
                </div>
              </div>
            )}
            
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              You can view the existing node, start a new graph with this address, or cancel to try a different address.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          
          <Button
            variant="outline"
            onClick={onStartNewGraph}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Start New Graph
          </Button>
          
          <Button
            onClick={onViewExisting}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Existing Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateNodeDialog;