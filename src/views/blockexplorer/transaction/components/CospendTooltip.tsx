import React, { memo, useCallback,useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import CopyButton from '@/components/CopyButton';
import { cn } from '@/lib/utils';

interface CospendTooltipProps {
  children: (props: {
    onMouseEnter: (address: string, element: HTMLDivElement, event: React.MouseEvent) => void;
    onMouseLeave: () => void;
  }) => React.ReactNode;
  address: string;
  cospendId?: string;
}

const CospendTooltip: React.FC<CospendTooltipProps> = ({ children, address, cospendId }) => {
  const navigate = useNavigate();
  const [tooltipState, setTooltipState] = useState<{
    isVisible: boolean;
    position: { top: number; left: number };
    isHovered: boolean;
  }>({
    isVisible: false,
    position: { top: 0, left: 0 },
    isHovered: false
  });

  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback((addr: string, element: HTMLDivElement, _event: React.MouseEvent) => {
    // Only show tooltip if there's a cospend ID
    if (!cospendId || addr !== address) return;

    // Clear any existing timeouts
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Set tooltip to show after 300ms
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = element.getBoundingClientRect();
      setTooltipState({
        isVisible: true,
        position: {
          top: rect.top,
          left: rect.left + (rect.width / 2)
        },
        isHovered: false
      });
    }, 300);
  }, [address, cospendId]);

  const handleMouseLeave = useCallback(() => {
    // Clear hover timeout if tooltip hasn't shown yet
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipState(prev =>
        prev.isHovered ? prev : { ...prev, isVisible: false }
      );
    }, 100);
  }, []);

  const handleTooltipMouseEnter = useCallback(() => {
    // Clear timeout when hovering over tooltip
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setTooltipState(prev => ({ ...prev, isHovered: true }));
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    // Clear timeout and hide tooltip immediately when leaving tooltip
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setTooltipState({ isVisible: false, position: { top: 0, left: 0 }, isHovered: false });
  }, []);

  return (
    <>
      {children({ onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave })}

      {tooltipState.isVisible && cospendId && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: `${tooltipState.position.top - 50}px`,
            left: `${tooltipState.position.left - 65}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="pointer-events-auto animate-fadeIn"
            style={{
              animationDuration: '150ms',
              animationFillMode: 'both'
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            <div className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg whitespace-nowrap",
              "border backdrop-blur-sm",
              "shadow-xl shadow-black/10",
              "bg-white/95 border-gray-200 text-gray-800",
              "dark:bg-gray-900/95 dark:border-gray-700 dark:text-gray-100",
              "dark:shadow-black/30"
            )}>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-medium uppercase tracking-wide",
                  "text-gray-500 dark:text-gray-400"
                )}>
                  Cospend ID
                </span>
                <span className={cn(
                  "font-mono text-sm font-medium",
                  "text-gray-900 dark:text-white"
                )}>
                  {cospendId}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CopyButton
                  text={cospendId}
                  title="Copy cospend ID"
                  className={cn(
                    "w-7 h-7 m-0 flex items-center justify-center rounded",
                    "transition-colors duration-200",
                    "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                    "dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                  )}
                />
                <button
                  onClick={() => navigate(`/blockexplorer/address/${address}`)}
                  title="View address in block explorer"
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded",
                    "transition-colors duration-200",
                    "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                    "dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                  )}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className={cn(
              "absolute w-3 h-3 rotate-45",
              "bg-white border-b border-r border-gray-200",
              "dark:bg-gray-900 dark:border-gray-700",
              "-bottom-1.5 left-1/2 -translate-x-1/2"
            )} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default memo(CospendTooltip);