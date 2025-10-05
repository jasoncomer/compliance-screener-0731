import React, { useMemo } from 'react';

import { Activity,TrendingDown, TrendingUp, Wallet } from 'lucide-react';

interface AddressSummaryProps {
  inputAmount?: number;
  outputAmount?: number;
  balance?: number;
  isLoading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  percentage?: number;
  isLoading?: boolean;
}

// Format Bitcoin values with appropriate units and precision
const formatBitcoin = (value: number): string => {
  if (value === 0) return '0 BTC';
  if (value >= 1000) return `${(value / 1000).toFixed(2)}k BTC`;
  if (value >= 1) return `${value.toFixed(4)} BTC`;
  if (value >= 0.01) return `${value.toFixed(6)} BTC`;
  return `${value.toFixed(8)} BTC`;
};

// Get flow percentage for visual indicators
const getFlowPercentage = (input: number, output: number): number => {
  const total = input + output;
  if (total === 0) return 50;
  return (input / total) * 100;
};

// Get background gradient based on trend
const getBgGradient = (trend?: 'up' | 'down' | 'neutral'): string => {
  switch(trend) {
    case 'up':
      return 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20';
    case 'down':
      return 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20';
    default:
      return 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20';
  }
};

// Loading skeleton for StatCard
const StatCardSkeleton: React.FC = React.memo(function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
});

// Individual stat card component - Memoized for performance
const StatCard = React.memo<StatCardProps>(function StatCard({
  icon,
  label,
  value,
  trend,
  percentage,
  isLoading
}) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`p-2 rounded-lg bg-gradient-to-br ${getBgGradient(trend)} group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}
            aria-hidden="true">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {label}
            </p>
            <p
              className="text-base font-semibold text-gray-900 dark:text-white font-mono truncate"
              aria-label={`${label}: ${value}`}>
              {value}
            </p>
          </div>
        </div>
        {trend && percentage !== undefined && (
          <div className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
            trend === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
            trend === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{percentage.toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
});


function AddressSummaryComponent({
  inputAmount = 0,
  outputAmount = 0,
  balance = 0,
  isLoading = false
}: AddressSummaryProps) {
  // Calculate flow percentage and trends with memoization for performance
  const { flowPercentage, netFlow, flowTrend } = useMemo(() => {
    const percentage = getFlowPercentage(inputAmount, outputAmount);
    const net = inputAmount - outputAmount;
    const trend: 'up' | 'down' | 'neutral' = net > 0 ? 'up' : net < 0 ? 'down' : 'neutral';
    return { flowPercentage: percentage, netFlow: net, flowTrend: trend };
  }, [inputAmount, outputAmount]);

  // Memoize percentage calculations for stat cards
  const inputPercentage = useMemo(() =>
    inputAmount > 0 ? flowPercentage : undefined,
    [inputAmount, flowPercentage]
  );

  const outputPercentage = useMemo(() =>
    outputAmount > 0 ? (100 - flowPercentage) : undefined,
    [outputAmount, flowPercentage]
  );

  const balancePercentage = useMemo(() =>
    balance > 0 && (inputAmount + outputAmount) > 0 ?
      Math.abs((netFlow / (inputAmount + outputAmount)) * 100) : undefined,
    [balance, inputAmount, outputAmount, netFlow]
  );

  if (isLoading) {
    return (
      <section
        className="rounded-2xl border p-4 sm:p-6 h-full bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
        aria-label="Address summary loading"
        aria-busy="true"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
          Summary
        </h2>
        <div className="space-y-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border p-4 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700 h-full flex flex-col"
      aria-label="Address summary"
    >
      <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
        <Activity className="w-4 h-4 text-orange-500 flex-shrink-0" />
        <span>Summary</span>
      </h2>

      {/* Stats Cards */}
      <div className="space-y-3 flex-1">
        <StatCard
          icon={<TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />}
          label="Received"
          value={formatBitcoin(inputAmount)}
          trend={inputAmount > 0 ? 'up' : 'neutral'}
          percentage={inputPercentage}
        />

        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />}
          label="Sent"
          value={formatBitcoin(outputAmount)}
          trend={outputAmount > 0 ? 'down' : 'neutral'}
          percentage={outputPercentage}
        />

        <StatCard
          icon={<Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          label="Balance"
          value={formatBitcoin(balance)}
          trend={flowTrend}
          percentage={balancePercentage}
        />
      </div>

      {/* Flow Indicator Bar */}
      {(inputAmount > 0 || outputAmount > 0) && (
        <div
          className="mt-4 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 flex-shrink-0"
          role="progressbar"
          aria-label="Transaction flow indicator"
          aria-valuenow={flowPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1.5">
            <span>In</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {flowPercentage.toFixed(0)}%/{(100 - flowPercentage).toFixed(0)}%
            </span>
            <span>Out</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full flex relative">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500 ease-out"
                style={{ width: `${flowPercentage}%` }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500 ease-out"
                style={{ width: `${100 - flowPercentage}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Export memoized component for better performance
export const AddressSummary = React.memo(AddressSummaryComponent); 