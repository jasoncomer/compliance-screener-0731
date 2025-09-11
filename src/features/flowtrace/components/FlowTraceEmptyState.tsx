import React from 'react';
import { ArrowLeftRight, Network, GitBranch, Zap, Shield, TrendingUp, Play } from 'lucide-react';
import EmptyState from '../../../components/common/EmptyState';
import { Button } from '@/components/ui/button';

interface FlowTraceEmptyStateProps {
  onLoadSampleData?: () => void;
}

const FlowTraceEmptyState: React.FC<FlowTraceEmptyStateProps> = ({ onLoadSampleData }) => (
  <EmptyState
    variant="initial"
    icon={<Network className="w-12 h-12" />}
    title="Trace Address Flow"
    description="Enter a Bitcoin address to visualize its transaction flow, connections, and network relationships. Discover how funds move through the blockchain network."
    action={
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mb-6">
          <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3 mx-auto">
              <ArrowLeftRight className="text-blue-600 dark:text-blue-400 w-5 h-5" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Transaction Flow</h3>
            <p className="text-sm text-muted-foreground">
              Visualize how funds move between addresses
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3 mx-auto">
              <GitBranch className="text-green-600 dark:text-green-400 w-5 h-5" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Network Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Discover connections and relationships
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3 mx-auto">
              <Shield className="text-purple-600 dark:text-purple-400 w-5 h-5" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Risk Assessment</h3>
            <p className="text-sm text-muted-foreground">
              Identify potential risk factors and patterns
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mb-6">
          <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-3 mx-auto">
              <Zap className="text-orange-600 dark:text-orange-400 w-5 h-5" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Real-time Updates</h3>
            <p className="text-sm text-muted-foreground">
              Get live transaction data and network changes
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3 mx-auto">
              <TrendingUp className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Pattern Recognition</h3>
            <p className="text-sm text-muted-foreground">
              Identify transaction patterns and behaviors
            </p>
          </div>
        </div>

        {onLoadSampleData && (
          <div className="mb-4">
            <Button 
              onClick={onLoadSampleData}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Play className="w-4 h-4" />
              Load Sample Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Try the app with sample Bitcoin addresses and connections
            </p>
          </div>
        )}

        <div className="p-3 rounded-lg bg-muted/50 border border-border max-w-md">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Simply paste a Bitcoin address in the search bar above to start tracing its transaction flow and discover network connections.
          </p>
        </div>
      </>
    }
  />
);

export default FlowTraceEmptyState;
