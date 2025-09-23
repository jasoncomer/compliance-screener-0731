import React from 'react'

import { Layers, Palette, Plus, RotateCcw, Split,ZoomIn, ZoomOut } from 'lucide-react'

interface ToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onAddNode: () => void
  onColorPicker: () => void
  utxoCollapseMode: "aggregated" | "individual"
  onToggleUtxoMode: () => void
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onAddNode,
  onColorPicker,
  utxoCollapseMode,
  onToggleUtxoMode
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <div className="flex items-center gap-2">
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
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-2"></div>
        <button
          onClick={onAddNode}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Add Node"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={onColorPicker}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Color Picker"
        >
          <Palette className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-2"></div>
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


