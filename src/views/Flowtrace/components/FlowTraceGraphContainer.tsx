/**
 * FlowTrace Graph Container component
 * Wraps the graph rendering logic with left panel
 */

import React from 'react';

import { LeftPanel } from './LeftPanel';
import { FTConnection, FTNode, NetworkGraph, NetworkGraphHandle } from './NetworkGraph';
import { NetworkGraphV2 } from './NetworkGraphV2';

interface FlowTraceGraphContainerProps {
  // Graph configuration
  graphRef: React.RefObject<NetworkGraphHandle | null>;
  useD3Force: boolean;
  nodes: FTNode[];
  connections: FTConnection[];
  utxoCollapseMode: "aggregated" | "individual";
  centerNodeId: string | null;

  // Drawing state
  activeColor: string;
  drawingHistory: any[];
  onDrawingAction: (action: { type: string; data: any }) => void;
  selectedAnnotationIndex?: number | null;
  onAnnotationSelect?: (index: number | null) => void;
  onAnnotationUpdate?: (index: number, data: any) => void;

  // Graph event handlers
  onNodeClick: (node: FTNode) => void;
  onNodeDoubleClick: (node: FTNode) => void;
  onNodeAdd: (node: FTNode) => Promise<void>;
  onNodeDrag: (nodeId: string, x: number, y: number) => void;
  onEdgeClick: (connection: FTConnection) => void;
  onNodeRemove: (nodeId: string) => void;
  onBulkNodeRemove?: (nodeIds: string[]) => void;

  // Left panel data
  currentAddress: string;
  leftPanelData: any | null;
  isExpanded: boolean;
  isLeftPanelLoading: boolean;
  onTogglePanel: () => void;
  onSetExpanded: (expanded: boolean) => void;
  isLeftPanelLocked: boolean;
  onToggleLock: () => void;
  onConnectionColorChange?: (txHash: string, color: string) => void;
}

export const FlowTraceGraphContainer: React.FC<FlowTraceGraphContainerProps> = ({
  graphRef,
  useD3Force,
  nodes,
  connections,
  utxoCollapseMode,
  centerNodeId,
  activeColor,
  drawingHistory,
  onDrawingAction,
  selectedAnnotationIndex,
  onAnnotationSelect,
  onAnnotationUpdate,
  onNodeClick,
  onNodeDoubleClick,
  onNodeAdd,
  onNodeDrag,
  onEdgeClick,
  onNodeRemove,
  onBulkNodeRemove,
  currentAddress,
  leftPanelData,
  isExpanded,
  isLeftPanelLoading,
  onTogglePanel,
  onSetExpanded,
  isLeftPanelLocked,
  onToggleLock,
  onConnectionColorChange,
}) => {
  return (
    <div className="relative h-full w-full">
      {/* Graph container - full width, no margin */}
      <div className="absolute inset-0">
        {/* Conditionally render the appropriate graph component */}
        {useD3Force ? (
          <NetworkGraphV2
            ref={graphRef as React.Ref<NetworkGraphHandle>}
            nodes={nodes}
            connections={connections}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeAdd={onNodeAdd}
            onNodeDrag={onNodeDrag}
            onEdgeClick={onEdgeClick}
            onNodeRemove={onNodeRemove}
            onBulkNodeRemove={onBulkNodeRemove}
            utxoCollapseMode={utxoCollapseMode}
            activeColor={activeColor}
            onDrawingAction={onDrawingAction}
            drawingHistory={drawingHistory}
            centerNodeId={centerNodeId}
            selectedAnnotationIndex={selectedAnnotationIndex}
            onAnnotationSelect={onAnnotationSelect}
            onAnnotationUpdate={onAnnotationUpdate}
          />
        ) : (
          <NetworkGraph
            ref={graphRef as React.Ref<NetworkGraphHandle>}
            nodes={nodes}
            connections={connections}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeAdd={onNodeAdd}
            onNodeDrag={onNodeDrag}
            onEdgeClick={onEdgeClick}
            onNodeRemove={onNodeRemove}
            onBulkNodeRemove={onBulkNodeRemove}
            utxoCollapseMode={utxoCollapseMode}
            activeColor={activeColor}
            onDrawingAction={onDrawingAction}
            drawingHistory={drawingHistory}
            centerNodeId={centerNodeId}
          />
        )}
      </div>

      {/* Left Panel */}
      <div className="absolute top-0 left-0 h-full z-20">
        <LeftPanel
          data={leftPanelData}
          nodeData={nodes.find(n => n.id === currentAddress || n.id === centerNodeId)}
          isExpanded={isExpanded}
          onToggle={onTogglePanel}
          onSetExpanded={onSetExpanded}
          isLoading={isLeftPanelLoading}
          isLocked={isLeftPanelLocked}
          onLockToggle={onToggleLock}
          onConnectionColorChange={onConnectionColorChange}
        />
      </div>
    </div>
  );
};