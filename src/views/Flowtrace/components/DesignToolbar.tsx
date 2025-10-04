/**
 * DesignToolbar - Separate vertical toolbar for drawing tools, colors, and actions
 * Extracted from main toolbar for better organization
 */

import React, { useState } from 'react';

import {
  Circle,
  Edit3,
  MousePointer,
  Palette,
  PenTool,
  Plus,
  Redo,
  Square,
  Trash2,
  Type,
  Undo,
  X
} from 'lucide-react';

import { useInteractionMode, FlowtraceDesignTool } from '../hooks/useInteractionMode';

export type DrawingTool = FlowtraceDesignTool;

interface DesignToolbarProps {
  activeColor: string;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onAddNode: () => void;
  onEdit?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  isTextSelected?: boolean;
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

export const DesignToolbar: React.FC<DesignToolbarProps> = ({
  activeColor,
  onColorChange,
  onUndo,
  onRedo,
  onDelete,
  onAddNode,
  onEdit,
  canUndo,
  canRedo,
  hasSelection,
  isTextSelected = false
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Use centralized interaction mode
  const { state: modeState, actions: modeActions } = useInteractionMode();
  const { isDesignMode, designTool } = modeState;

  // Only render when in design mode
  if (!isDesignMode) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <div className="flex flex-col gap-3">
        {/* Header with close button */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Design Tools</span>
          <button
            onClick={modeActions.exitDesignMode}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Close Design Tools"
          >
            <X className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>

        {/* Drawing Tools Section */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 px-1">Tools</span>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => modeActions.setDesignTool('select')}
              className={`p-2 rounded transition-colors flex items-center gap-2 ${
                designTool === 'select'
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title="Select"
            >
              <MousePointer className="h-4 w-4" />
              <span className="text-xs">Select</span>
            </button>
            <button
              onClick={() => modeActions.setDesignTool('draw')}
              className={`p-2 rounded transition-colors flex items-center gap-2 ${
                designTool === 'draw'
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title="Draw"
            >
              <PenTool className="h-4 w-4" />
              <span className="text-xs">Draw</span>
            </button>
            <button
              onClick={() => modeActions.setDesignTool('rectangle')}
              className={`p-2 rounded transition-colors flex items-center gap-2 ${
                designTool === 'rectangle'
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title="Rectangle"
            >
              <Square className="h-4 w-4" />
              <span className="text-xs">Rectangle</span>
            </button>
            <button
              onClick={() => modeActions.setDesignTool('circle')}
              className={`p-2 rounded transition-colors flex items-center gap-2 ${
                designTool === 'circle'
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title="Circle"
            >
              <Circle className="h-4 w-4" />
              <span className="text-xs">Circle</span>
            </button>
            <button
              onClick={() => modeActions.setDesignTool('text')}
              className={`p-2 rounded transition-colors flex items-center gap-2 ${
                designTool === 'text'
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title="Text"
            >
              <Type className="h-4 w-4" />
              <span className="text-xs">Text</span>
            </button>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 px-1">Actions</span>
          <div className="flex flex-col gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded transition-colors flex items-center gap-2 ${
                canUndo
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
              }`}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
              <span className="text-xs">Undo</span>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded transition-colors flex items-center gap-2 ${
                canRedo
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
              }`}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
              <span className="text-xs">Redo</span>
            </button>
            <button
              onClick={onEdit}
              disabled={!isTextSelected}
              className={`p-2 rounded transition-colors flex items-center gap-2 ${
                isTextSelected
                  ? 'hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
              }`}
              title="Edit Text"
            >
              <Edit3 className="h-4 w-4" />
              <span className="text-xs">Edit</span>
            </button>
            <button
              onClick={onDelete}
              disabled={!hasSelection}
              className={`p-2 rounded transition-colors flex items-center gap-2 ${
                hasSelection
                  ? 'hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400'
                  : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
              }`}
              title="Delete Selected"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-xs">Delete</span>
            </button>
          </div>
        </div>

        {/* Colors Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 px-1">Colors</span>
          <div className="flex flex-col gap-2">
            {/* Current Color Display */}
            <div className="flex items-center gap-2 px-1">
              <div
                className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: activeColor }}
                title={`Current color: ${activeColor}`}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">{activeColor}</span>
            </div>

            {/* Color Grid */}
            <div className="grid grid-cols-3 gap-1.5 px-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    activeColor === color
                      ? 'border-blue-500 dark:border-blue-400 scale-110 shadow-md'
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Color: ${color}`}
                />
              ))}
            </div>

            {/* Color Picker Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`w-full p-2 rounded transition-colors flex items-center justify-center gap-2 ${
                  showColorPicker
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                title="Custom Color Picker"
              >
                <Palette className="h-4 w-4" />
                <span className="text-xs">Custom</span>
              </button>

              {/* Custom Color Picker Dropdown */}
              {showColorPicker && (
                <div className="absolute left-0 right-0 top-full mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-30">
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Node Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onAddNode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300"
            title="Add Custom Node"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs">Add Node</span>
          </button>
        </div>
      </div>
    </div>
  );
};