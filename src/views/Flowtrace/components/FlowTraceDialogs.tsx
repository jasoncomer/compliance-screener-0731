/**
 * FlowTrace Dialogs compound component
 * Consolidates all dialog components with their state and handlers
 */

import React from 'react';

import { FlowTraceState } from '../hooks/useFlowTraceState';
import { mergeEdges } from '../lib/connectionUtils';
import { connectionInvolvesAddress, ensureConnectionKeys, findConnectionsForAddress, generateConnectionKey, generateUTXOKey } from '../utils/utxoKeyGeneration';

import {
  AggregatedNodeDialog,
  CustomNodeDialog,
  CustomNodeExpandDialog,
  DuplicateNodeDialog,
  EdgeDialog,
  NodeTxPicker,
  SaveAndNewDialog,
  SearchConfirmationDialog,
  StartNewGraphConfirmationDialog,
} from './index';
import { FTConnection, FTNode } from './NetworkGraph';

interface FlowTraceDialogsProps {
  // State
  state: FlowTraceState;

  // Node and connection setters
  setNodes: React.Dispatch<React.SetStateAction<FTNode[]>>;
  setConnections: React.Dispatch<React.SetStateAction<FTConnection[]>>;

  // Dialog state setters
  setSearchConfirmationOpen: (open: boolean) => void;
  setDuplicateNodeDialogOpen: (open: boolean) => void;
  setStartNewGraphConfirmationOpen: (open: boolean) => void;
  setSaveAndNewDialogOpen: (open: boolean) => void;
  setEdgeDialogOpen: (open: boolean) => void;
  setCustomExpandOpen: (open: boolean) => void;
  setExpandSourceNode: (node: FTNode | null) => void;
  setNodeTxPickerOpen: (open: boolean) => void;
  setNodeTxPickerSourceNode: (nodeId: string | null) => void;
  setAggregatedNodeDialogOpen: (open: boolean) => void;

  // Handlers
  handleAddToGraph: () => Promise<void>;
  handleSaveAndNew: () => void;
  handleDiscardAndNew: () => Promise<void>;
  handleCancelSearch: () => void;
  handleViewExisting: () => void;
  handleStartNewGraph: () => void;
  handleCancelDuplicate: () => void;
  handleSaveAndStartNewGraph: () => Promise<void>;
  handleDiscardAndStartNewGraph: () => Promise<void>;
  handleCancelStartNewGraph: () => void;
  handleSaveToExisting: (workspaceId: string) => Promise<void>;
  handleCreateNewWorkspace: (name: string, description: string) => Promise<void>;
  handleCancelSaveAndNew: () => void;
  handleConnectionColorChange: (txHash: string, color: string) => void;
  onAdd: (payload: { address: string; selectedTxs: any[] }) => void;
  findDuplicateNode: (address: string) => FTNode | undefined;
}

export const FlowTraceDialogs: React.FC<FlowTraceDialogsProps> = ({
  state,
  setNodes,
  setConnections,
  setSearchConfirmationOpen,
  setDuplicateNodeDialogOpen,
  setStartNewGraphConfirmationOpen,
  setSaveAndNewDialogOpen,
  setEdgeDialogOpen,
  setCustomExpandOpen,
  setExpandSourceNode,
  setNodeTxPickerOpen,
  setNodeTxPickerSourceNode,
  setAggregatedNodeDialogOpen,
  handleAddToGraph,
  handleSaveAndNew,
  handleDiscardAndNew,
  handleCancelSearch,
  handleViewExisting,
  handleStartNewGraph,
  handleCancelDuplicate,
  handleSaveAndStartNewGraph,
  handleDiscardAndStartNewGraph,
  handleCancelStartNewGraph,
  handleSaveToExisting,
  handleCreateNewWorkspace,
  handleCancelSaveAndNew,
  handleConnectionColorChange,
  onAdd,
  findDuplicateNode,
}) => {
  return (
    <>
      {/* Search Confirmation Dialog */}
      <SearchConfirmationDialog
        open={state.searchConfirmationOpen}
        onOpenChange={setSearchConfirmationOpen}
        newAddress={state.pendingAddress || ''}
        existingNodeCount={state.nodes.length}
        existingConnectionCount={state.connections.length}
        onAddToGraph={handleAddToGraph}
        onSaveAndNew={handleSaveAndNew}
        onDiscardAndNew={handleDiscardAndNew}
        onCancel={handleCancelSearch}
      />

      {/* Duplicate Node Dialog */}
      <DuplicateNodeDialog
        open={state.duplicateNodeDialogOpen}
        onOpenChange={setDuplicateNodeDialogOpen}
        duplicateAddress={state.duplicateAddress || ''}
        existingNodeLabel={findDuplicateNode(state.duplicateAddress || '')?.label}
        onViewExisting={handleViewExisting}
        onStartNewGraph={handleStartNewGraph}
        onCancel={handleCancelDuplicate}
      />

      {/* Start New Graph Confirmation Dialog */}
      <StartNewGraphConfirmationDialog
        open={state.startNewGraphConfirmationOpen}
        onOpenChange={setStartNewGraphConfirmationOpen}
        newAddress={state.pendingNewGraphAddress || ''}
        existingNodeCount={state.nodes.length}
        existingConnectionCount={state.connections.length}
        onSaveAndNew={handleSaveAndStartNewGraph}
        onDiscardAndNew={handleDiscardAndStartNewGraph}
        onCancel={handleCancelStartNewGraph}
      />

      {/* Save and New Dialog */}
      <SaveAndNewDialog
        open={state.saveAndNewDialogOpen}
        onOpenChange={setSaveAndNewDialogOpen}
        onSaveToExisting={handleSaveToExisting}
        onCreateNew={handleCreateNewWorkspace}
        onCancel={handleCancelSaveAndNew}
      />

      {/* Edge Dialog */}
      <EdgeDialog
        open={state.edgeDialogOpen}
        onOpenChange={setEdgeDialogOpen}
        data={state.selectedEdge ? {
          from: state.selectedEdge.from,
          to: state.selectedEdge.to,
          amount: state.selectedEdge.amount,
          currency: state.selectedEdge.currency,
          txHash: state.selectedEdge.txHash,
          date: state.selectedEdge.date,
          usdValue: state.selectedEdge.usdValue,
          note: state.selectedEdge.note
        } : undefined}
        onSetColor={(color) => {
          if (state.selectedEdge) {
            handleConnectionColorChange(state.selectedEdge.txHash, color);
          }
        }}
      />

      {/* Node Transaction Picker */}
      <NodeTxPicker
        open={state.nodeTxPickerOpen}
        onOpenChange={(open) => {
          setNodeTxPickerOpen(open);
          if (!open) {
            setNodeTxPickerSourceNode(null);
          }
        }}
        address={state.currentAddress || ''}
        nodeLabel={state.nodes.find(n => n.id === state.currentAddress)?.label}
        onAdd={onAdd}
        existingConnections={state.currentAddress ? findConnectionsForAddress(ensureConnectionKeys(state.connections), state.currentAddress) : []}
        sourceNode={state.nodeTxPickerSourceNode}
      />

      {/* Custom Node Dialog */}
      <CustomNodeDialog
        open={state.customDialogOpen}
        onOpenChange={(_open) => setNodes(prev => prev)} // Placeholder - actual implementation in parent
        existingNodes={state.nodes}
        onCreate={({ label, currencyCode: _currencyCode, logo, notes, edges }) => {
          const nodeId = `custom-${Date.now()}`;
          const newNode: FTNode = {
            id: nodeId,
            label,
            x: 300,
            y: 240,
            type: 'custom',
            logoUrl: logo,
            notes: notes ? [{ id: `note-${Date.now()}`, userId: 'current_user', userName: 'Current User', content: notes, timestamp: new Date().toISOString() }] : undefined,
          };
          setNodes(prev => [...prev, newNode]);
          if (edges && edges.length) {
            const newEdges: FTConnection[] = edges.map((e, idx) => ({
              from: e.direction === 'out' ? nodeId : e.targetId,
              to: e.direction === 'out' ? e.targetId : nodeId,
              amount: e.amount,
              currency: e.currency,
              date: e.date,
              txHash: `cn-${Date.now()}-${idx}`,
              type: e.direction,
            } as FTConnection));
            setConnections(prev => mergeEdges(prev, newEdges));
          }
        }}
      />

      {/* Custom Node Expand Dialog */}
      {state.expandSourceNode && (
        <CustomNodeExpandDialog
          open={state.customExpandOpen}
          onOpenChange={(open) => {
            setCustomExpandOpen(open);
            if (!open) {
              setExpandSourceNode(null);
            }
          }}
          sourceNode={state.expandSourceNode}
          existingNodes={state.nodes}
          onCreateEdges={(edges) => {
            const newEdges: FTConnection[] = edges.map((e, idx) => {
              const from = e.direction === 'out' ? state.expandSourceNode!.id : e.targetId;
              const to = e.direction === 'out' ? e.targetId : state.expandSourceNode!.id;
              const txHash = `ce-${Date.now()}-${idx}`;

              let utxoKey: string | undefined;
              try {
                utxoKey = generateUTXOKey({
                  txid: txHash,
                  sourceAddress: from,
                  destinationAddress: to,
                  amount: e.amount
                });
              } catch (error) {
                console.warn('Failed to generate UTXO key for new connection:', error);
              }

              const connection: FTConnection = {
                from,
                to,
                amount: e.amount,
                currency: e.currency,
                date: e.date,
                txHash,
                type: e.direction,
                utxoKey
              };

              connection.connectionKey = generateConnectionKey(connection);
              return connection;
            });
            setConnections(prev => mergeEdges(prev, newEdges));
          }}
          existingConnections={(() => {
            const connectionsWithKeys = ensureConnectionKeys(state.connections);
            return findConnectionsForAddress(connectionsWithKeys, state.expandSourceNode.id);
          })()}
          onEditEdges={(edges) => {
            setConnections(prev => {
              const targetsKept = new Set(edges.map(e => e.targetId));
              const filtered = prev.filter(c => {
                const isCustomEdge = connectionInvolvesAddress(c, state.expandSourceNode!.id);
                if (!isCustomEdge) return true;
                const otherId = c.from === state.expandSourceNode!.id ? c.to : c.from;
                return targetsKept.has(otherId);
              });

              const updated = [...filtered];
              edges.forEach((e, idx) => {
                const from = e.direction === 'out' ? state.expandSourceNode!.id : e.targetId;
                const to = e.direction === 'out' ? e.targetId : state.expandSourceNode!.id;
                const txHash = `edit-${Date.now()}-${idx}`;

                let utxoKey: string | undefined;
                try {
                  utxoKey = generateUTXOKey({
                    txid: txHash,
                    sourceAddress: from,
                    destinationAddress: to,
                    amount: e.amount
                  });
                } catch (error) {
                  console.warn('Failed to generate UTXO key for edited connection:', error);
                }

                const connection: FTConnection = {
                  from,
                  to,
                  amount: e.amount,
                  currency: e.currency,
                  date: e.date,
                  txHash,
                  type: e.direction,
                  utxoKey
                };

                connection.connectionKey = generateConnectionKey(connection);
                updated.push(connection);
              });
              return updated;
            });
          }}
        />
      )}

      {/* Aggregated Node Dialog */}
      <AggregatedNodeDialog
        open={state.aggregatedNodeDialogOpen}
        onOpenChange={setAggregatedNodeDialogOpen}
        aggregatedNode={state.selectedAggregatedNode}
        originalNodes={state.selectedAggregatedNode ?
          state.aggregationMap.current[state.selectedAggregatedNode.id]?.nodes || [] : []}
        originalConnections={state.selectedAggregatedNode ?
          state.aggregationMap.current[state.selectedAggregatedNode.id]?.connections || [] : []}
        allMemberConnections={state.selectedAggregatedNode ?
          state.aggregationMap.current[state.selectedAggregatedNode.id]?.allMemberConnections || [] : []}
        allConnections={state.connections}
      />
    </>
  );
};