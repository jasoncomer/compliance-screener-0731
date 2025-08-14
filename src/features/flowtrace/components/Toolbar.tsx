import React from 'react';
import { Button } from '../../../components/ui/button';

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onAddNode: () => void;
  onPickColor: (color: string) => void;
  activeColor?: string;
};

const COLORS = ['#9ca3af', '#f97316', '#ef4444', '#10b981', '#3b82f6', '#a855f7'];

const Toolbar: React.FC<Props> = ({ onZoomIn, onZoomOut, onReset, onAddNode, onPickColor, activeColor }) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-white/60 dark:bg-black/40 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-md">
      <Button size="sm" variant="outline" onClick={onZoomOut}>-</Button>
      <Button size="sm" variant="outline" onClick={onZoomIn}>+</Button>
      <Button size="sm" variant="outline" onClick={onReset}>Reset</Button>
      <div className="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-700" />
      <div className="flex items-center gap-1">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onPickColor(c)}
            className="h-5 w-5 rounded-full border"
            style={{ backgroundColor: c, outline: activeColor === c ? `2px solid ${c}` : 'none' }}
            aria-label={`Pick ${c}`}
          />
        ))}
      </div>
      <div className="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-700" />
      <Button size="sm" variant="outline" onClick={onAddNode}>Add Node</Button>
    </div>
  );
};

export default Toolbar;


