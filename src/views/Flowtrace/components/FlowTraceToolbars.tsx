/**
 * FlowTrace Toolbars compound component
 * Consolidates all toolbar-related components
 */

import React from 'react';

import { DesignToolbar } from './DesignToolbar';
import { NetworkGraphHandle } from './NetworkGraph';
import { Toolbar } from './Toolbar';

interface FlowTraceToolbarsProps {
  // Graph ref for zoom/pan controls
  graphRef: React.RefObject<NetworkGraphHandle | null>;

  // UTXO mode
  utxoCollapseMode: "aggregated" | "individual";
  onToggleUtxoMode: () => void;

  // Drawing color
  activeColor: string;
  onColorChange: (color: string) => void;

  // Drawing actions
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onAddNode: () => void;
  onEdit?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  isTextSelected?: boolean;

  // Cleanup callbacks
  onClearSelection?: () => void;
  onAnnotationDeselect?: () => void;
}

export const FlowTraceToolbars: React.FC<FlowTraceToolbarsProps> = ({
  graphRef,
  utxoCollapseMode,
  onToggleUtxoMode,
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
  isTextSelected,
  onAnnotationDeselect
}) => {
  return (
    <>
      {/* Main Toolbar - positioned on the right to avoid left panel */}
      <div className="absolute top-4 right-4 z-20">
        <Toolbar
          onZoomIn={() => graphRef.current?.zoomIn()}
          onZoomOut={() => graphRef.current?.zoomOut()}
          onReset={() => graphRef.current?.resetView()}
          onAddNode={onAddNode}
          utxoCollapseMode={utxoCollapseMode}
          onToggleUtxoMode={onToggleUtxoMode}
          onClearSelection={() => graphRef.current?.clearSelection()}
          onAnnotationDeselect={onAnnotationDeselect}
        />
      </div>

      {/* Design Toolbar - positioned below main toolbar */}
      <div className="absolute top-20 right-4 z-20">
        <DesignToolbar
          activeColor={activeColor}
          onColorChange={onColorChange}
          onUndo={onUndo}
          onRedo={onRedo}
          onDelete={onDelete}
          onAddNode={onAddNode}
          onEdit={onEdit}
          canUndo={canUndo}
          canRedo={canRedo}
          hasSelection={hasSelection}
          isTextSelected={isTextSelected}
        />
      </div>
    </>
  );
};