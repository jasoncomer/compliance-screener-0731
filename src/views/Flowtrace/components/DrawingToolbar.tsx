import React, { useState } from 'react';

import { 
  Circle, 
  MousePointer, 
  Palette,
  PenTool, 
  Plus,
  Redo, 
  Square, 
  Trash2, 
  Type, 
  Undo} from 'lucide-react';

export type DrawingTool = 'select' | 'draw' | 'rectangle' | 'circle' | 'text';

interface DrawingToolbarProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onAddNode: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

const COLORS = [
  '#ff6b35', // orange
  '#ff0000', // red
  '#00ff00', // green
  '#0000ff', // blue
  '#00ffff', // cyan
  '#8000ff', // purple
  '#008080', // teal
  '#ffa500', // orange
  '#008000', // green
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  isVisible,
  onToggleVisibility,
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  onUndo,
  onRedo,
  onDelete,
  onAddNode,
  canUndo,
  canRedo,
  hasSelection
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute top-16 right-4 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex flex-col gap-3">
        {/* Drawing Tools */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Tools</div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onToolChange('select')}
              className={`p-2 rounded transition-colors ${
                activeTool === 'select' 
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Select"
            >
              <MousePointer className="h-4 w-4" />
            </button>
            <button
              onClick={() => onToolChange('draw')}
              className={`p-2 rounded transition-colors ${
                activeTool === 'draw' 
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Draw"
            >
              <PenTool className="h-4 w-4" />
            </button>
            <button
              onClick={() => onToolChange('rectangle')}
              className={`p-2 rounded transition-colors ${
                activeTool === 'rectangle' 
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Rectangle"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              onClick={() => onToolChange('circle')}
              className={`p-2 rounded transition-colors ${
                activeTool === 'circle' 
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Circle"
            >
              <Circle className="h-4 w-4" />
            </button>
            <button
              onClick={() => onToolChange('text')}
              className={`p-2 rounded transition-colors ${
                activeTool === 'text' 
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Text"
            >
              <Type className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action History */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Actions</div>
          <div className="flex flex-col gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded transition-colors ${
                canUndo 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded transition-colors ${
                canRedo 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              disabled={!hasSelection}
              className={`p-2 rounded transition-colors ${
                hasSelection 
                  ? 'hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Color Palette */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Colors</div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Color Picker"
            >
              <Palette className="h-4 w-4" />
            </button>
            <div className="grid grid-cols-2 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`w-6 h-6 rounded border-2 transition-all ${
                    activeColor === color 
                      ? 'border-blue-500 scale-110' 
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Color: ${color}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Add Node */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Add</div>
          <button
            onClick={onAddNode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Add Node"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Close Button */}
        <div className="flex justify-center">
          <button
            onClick={onToggleVisibility}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Hide Drawing Tools"
          >
            <span className="text-gray-600 dark:text-gray-300">×</span>
          </button>
        </div>
      </div>

      {/* Color Picker Dropdown */}
      {showColorPicker && (
        <div className="absolute left-full top-0 ml-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <input
            type="color"
            value={activeColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
          />
        </div>
      )}
    </div>
  );
};
