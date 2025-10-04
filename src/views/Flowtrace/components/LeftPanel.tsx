import React, { useState } from 'react';

import { Lock, LockOpen } from 'lucide-react';

import { logoService } from '../../../services/logoService';
import { LeftPanelData, isNodePanelData, isEdgePanelData, isAggregatedNodePanelData } from '../types/leftPanelTypes';

import { AggregatedNodeDetailsView } from './AggregatedNodeDetailsView';
import { EdgeDetailsView } from './EdgeDetailsView';
import { FTNode } from './NetworkGraph';
import { NodeDetailsView } from './NodeDetailsView';

// Helper to get selection type display name
const getSelectionTypeName = (data: LeftPanelData | null): string => {
  if (!data) return 'Entity Details';
  if (isNodePanelData(data)) return 'Node Details';
  if (isEdgePanelData(data)) return 'Edge Details';
  if (isAggregatedNodePanelData(data)) return 'Aggregated Node Details';
  return 'Entity Details';
};

// Helper to get selection badge
const getSelectionBadge = (data: LeftPanelData | null): React.ReactNode | null => {
  if (!data) return null;
  if (isNodePanelData(data)) {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
        Node
      </span>
    );
  }
  if (isEdgePanelData(data)) {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
        Edge
      </span>
    );
  }
  if (isAggregatedNodePanelData(data)) {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
        Aggregated
      </span>
    );
  }
  return null;
};

type Props = {
  // New unified data prop
  data?: LeftPanelData | null;
  // Legacy compatibility - kept for backward compatibility
  address?: string;
  network?: string;
  balance?: number | string;
  usdValue?: number | string;
  txCount?: number;
  riskScore?: number;
  selectedEntity?: {
    label?: string;
    address?: string;
    entityId?: string;
    logoUrl?: string | null;
    type?: string;
    riskScore?: number;
    bo?: string;
    custodian?: string;
    ofac?: boolean;
    entityTags?: string[];
  };
  nodeData?: FTNode;
  // UI state
  isExpanded?: boolean;
  onToggle?: () => void;
  onSetExpanded?: (expanded: boolean) => void;
  isLoading?: boolean;
  isLocked?: boolean;
  onLockToggle?: () => void;
  // Edge-specific handlers
  onConnectionColorChange?: (txHash: string, color: string) => void;
};

const LeftPanel: React.FC<Props> = ({
  data: newData,
  // Legacy props for backward compatibility
  address,
  network,
  balance,
  usdValue,
  txCount,
  riskScore,
  selectedEntity,
  nodeData,
  // UI props
  isExpanded = true,
  onSetExpanded,
  isLoading = false,
  isLocked = true,
  onLockToggle,
  onConnectionColorChange
}) => {
  const [internalExpanded, setInternalExpanded] = useState(isExpanded);
  const [loadedLogoUrl, setLoadedLogoUrl] = useState<string | null>(null);

  // Convert legacy props to new data format if newData is not provided
  const panelData = React.useMemo((): LeftPanelData | null => {
    if (newData) {
      return newData;
    }

    // Backward compatibility: convert legacy props to NodePanelData
    // Check if we have ANY meaningful data (even during loading)
    if (address || selectedEntity || balance !== undefined || txCount !== undefined) {
      return {
        selectionType: 'node',
        address: address || '',
        network,
        balance,
        usdValue,
        txCount,
        riskScore,
        selectedEntity
      };
    }

    return null;
  }, [newData, address, network, balance, usdValue, txCount, riskScore, selectedEntity]);

  // Mouse event handlers for auto expand/collapse when unlocked
  const handleMouseEnter = () => {
    if (!isLocked) {
      setInternalExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isLocked) {
      setInternalExpanded(false);
    }
  };

  const handleLockToggle = () => {
    const currentExpandedState = isLocked ? isExpanded : internalExpanded;

    // When toggling lock, update parent's isExpanded state to match current visual state
    if (onSetExpanded && currentExpandedState !== undefined) {
      onSetExpanded(currentExpandedState);
    }

    // When unlocking, sync internalExpanded with current visual state
    if (isLocked) {
      setInternalExpanded(currentExpandedState);
    }

    if (onLockToggle) {
      onLockToggle();
    }
  };

  // Sync internal state with prop
  React.useEffect(() => {
    setInternalExpanded(isExpanded);
  }, [isExpanded, isLocked]);

  const currentExpandedState = isLocked ? isExpanded : internalExpanded;

  // Get collapsed icon - show logo if available from panel data
  const collapsedIcon = React.useMemo(() => {
    if (!panelData) return null;

    if (isNodePanelData(panelData) && panelData.selectedEntity) {
      return panelData.selectedEntity;
    }

    if (isAggregatedNodePanelData(panelData)) {
      return panelData.selectedEntity || { label: panelData.aggregatedNode.label };
    }

    return null;
  }, [panelData]);

  // Load logo for collapsed state
  React.useEffect(() => {
    if (!collapsedIcon?.entityId && !collapsedIcon?.logoUrl) {
      setLoadedLogoUrl(null);
      return;
    }

    const logoUrl = logoService.getLogoUrl(collapsedIcon?.entityId, collapsedIcon?.logoUrl);
    if (!logoUrl) {
      setLoadedLogoUrl(null);
      return;
    }

    let cancelled = false;
    logoService.loadImage(logoUrl).then((img) => {
      if (!cancelled && img) {
        setLoadedLogoUrl(img.src);
      } else if (!cancelled) {
        setLoadedLogoUrl(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [collapsedIcon]);

  return (
    <div
      className={`relative h-full border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${currentExpandedState ? 'w-[28rem]' : 'w-12'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >

      {/* Collapsed State */}
      {!currentExpandedState && (
        <div className="flex flex-col items-center py-4 space-y-4">
          {/* Lock/Unlock Button in collapsed state */}
          <button
            onClick={handleLockToggle}
            className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isLocked ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}
            title={isLocked ? 'Unlock panel (auto collapse/expand on hover)' : 'Lock panel (keep collapsed)'}
          >
            {isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <LockOpen className="h-4 w-4" />
            )}
          </button>

          {collapsedIcon && (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex items-center justify-center shadow-lg">
              {loadedLogoUrl ? (
                <img
                  src={loadedLogoUrl}
                  alt="logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-white font-semibold text-xs">
                  {(() => {
                    // Use node label (entity name) if available, otherwise fall back to address
                    const entityName = nodeData?.label || selectedEntity?.label;
                    if (entityName && !entityName.startsWith('1') && !entityName.startsWith('3') && !entityName.startsWith('bc1')) {
                      return entityName.charAt(0).toUpperCase();
                    }
                    // For addresses, use 'B' for Bitcoin or first char
                    return 'B';
                  })()}
                </div>
              )}
            </div>
          )}
          <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
          <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
          <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {currentExpandedState && (
        <>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {getSelectionTypeName(panelData)}
                </h2>
                {getSelectionBadge(panelData)}
              </div>
              {/* Lock/Unlock Button */}
              <button
                onClick={handleLockToggle}
                className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isLocked ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}
                title={isLocked ? 'Unlock panel (auto collapse/expand)' : 'Lock panel (keep expanded)'}
              >
                {isLocked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <LockOpen className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Content - Render appropriate view based on selection type */}
          {panelData && isNodePanelData(panelData) && (
            <NodeDetailsView
              data={panelData}
              nodeData={nodeData}
              isLoading={isLoading}
            />
          )}

          {panelData && isEdgePanelData(panelData) && (
            <EdgeDetailsView
              data={panelData}
              onConnectionColorChange={onConnectionColorChange}
            />
          )}

          {panelData && isAggregatedNodePanelData(panelData) && (
            <AggregatedNodeDetailsView
              data={panelData}
              isLoading={isLoading}
            />
          )}

          {!panelData && isLoading && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Loading entity data...</span>
              </div>
            </div>
          )}

          {!panelData && !isLoading && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Select a node or edge to view details
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export { LeftPanel };

