import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { RotateCcw } from 'lucide-react';

interface EdgeColorPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  txHash: string;
  currentColor?: string;
  onColorChange: (color: string) => void;
  onReset: () => void;
}

const COLOR_PALETTE = [
  "#6b7280", // Gray (Default)
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#ef4444", // Red
  "#84cc16", // Lime
  "#ec4899", // Pink
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#a855f7", // Violet
  "#0891b2"  // Sky
];

export const EdgeColorPicker: React.FC<EdgeColorPickerProps> = ({
  open,
  onOpenChange,
  txHash,
  currentColor,
  onColorChange,
  onReset
}) => {
  const displayTxHash = txHash.length > 8 ? `${txHash.slice(0, 8)}...` : txHash;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Edge Color</DialogTitle>
          <DialogDescription>
            Choose a custom color for transaction: {displayTxHash}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Color Palette */}
          <div className="grid grid-cols-4 gap-2">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                  currentColor === color 
                    ? 'border-blue-500 scale-110' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color }}
                title={`Color: ${color}`}
              />
            ))}
          </div>

          {/* Custom Color Input */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Custom Color:</label>
            <input
              type="color"
              value={currentColor || '#6b7280'}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
