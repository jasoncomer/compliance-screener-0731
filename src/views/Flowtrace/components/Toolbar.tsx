import React from 'react'

import {
  Layers,
  MousePointer,
  MousePointerSquareDashed,
  PenTool,
  Plus,
  RotateCcw,
  Split,
  ZoomIn,
  ZoomOut
} from 'lucide-react'

import { useInteractionMode } from '../hooks/useInteractionMode'

// Re-export for compatibility
export type DrawingTool = 'select' | 'draw' | 'rectangle' | 'circle' | 'text';

interface ToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onAddNode: () => void
  utxoCollapseMode: "aggregated" | "individual"
  onToggleUtxoMode: () => void
  onClearSelection?: () => void
  onAnnotationDeselect?: () => void
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onAddNode,
  utxoCollapseMode,
  onToggleUtxoMode,
  onClearSelection,
  onAnnotationDeselect
}) => {
  // Use centralized interaction mode
  const { state: modeState, actions: modeActions } = useInteractionMode({
    onAnnotationDeselect,
    onNodeSelectionClear: onClearSelection
  });

  const { isSelectMode, isAreaSelectMode, isDesignMode } = modeState;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* View Controls */}
        <button
          onClick={onZoomIn}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={onReset}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Selection Mode */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1"></div>
        <button
          onClick={modeActions.enterSelectMode}
          className={`p-2 rounded transition-colors ${
            isSelectMode
              ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Select Mode (click nodes, pan view, drag nodes)"
        >
          <MousePointer className="h-4 w-4" />
        </button>
        <button
          onClick={modeActions.enterAreaSelectMode}
          className={`p-2 rounded transition-colors ${
            isAreaSelectMode
              ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title={isAreaSelectMode ? "Exit Area Selection Mode" : "Area Selection Mode (select multiple nodes)"}
        >
          <MousePointerSquareDashed className="h-4 w-4" />
        </button>

        {/* Design Mode Toggle */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1"></div>
        <button
          onClick={() => {
            if (isDesignMode) {
              modeActions.exitDesignMode();
            } else {
              modeActions.enterDesignMode();
            }
          }}
          className={`p-2 rounded transition-colors ${
            isDesignMode
              ? "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title={isDesignMode ? "Exit Design Mode" : "Enter Design Mode (annotations)"}
        >
          <PenTool className="h-4 w-4" />
        </button>

        {/* Graph Actions */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1"></div>
        <button
          onClick={onAddNode}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Add Node"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleUtxoMode}
          className={`p-2 rounded transition-colors ${
            utxoCollapseMode === "individual"
              ? "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title={utxoCollapseMode === "aggregated" ? "Show Individual UTXOs" : "Show Aggregated UTXOs"}
        >
          {utxoCollapseMode === "aggregated" ? <Split className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}


