import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { 
  Bitcoin, 
  Users, 
  ArrowUpDown, 
  Hash,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { FTNode, FTConnection } from './NetworkGraph';

interface AggregatedNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aggregatedNode: FTNode | null;
  originalNodes: FTNode[];
  originalConnections: FTConnection[];
  allMemberConnections?: FTConnection[];
  allConnections: FTConnection[];
}

interface TransactionData {
  txHash: string;
  amount: string;
  direction: 'in' | 'out';
  fromAddress: string;
  toAddress: string;
  timestamp?: string;
  blockHeight?: number;
  nodeId: string;
  nodeLabel: string;
}

export const AggregatedNodeDialog: React.FC<AggregatedNodeDialogProps> = ({
  open,
  onOpenChange,
  aggregatedNode,
  originalNodes,
  originalConnections,
  allMemberConnections,
  allConnections
}) => {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    if (open && aggregatedNode && originalNodes.length > 0) {
      loadTransactions();
    }
  }, [open, aggregatedNode, originalNodes]);

  const loadTransactions = async () => {
    if (!aggregatedNode) return;
    
    setLoading(true);
    try {
      // Collect all transactions from the member connections
      const allTxs: TransactionData[] = [];
      
      // Use allMemberConnections if available, otherwise fall back to originalConnections
      const connectionsToUse = allMemberConnections || originalConnections;
      
      console.log('🔍 Loading transactions for aggregated node:', {
        aggregatedNodeId: aggregatedNode.id,
        originalNodesCount: originalNodes.length,
        allMemberConnectionsCount: allMemberConnections?.length || 0,
        originalConnectionsCount: originalConnections.length,
        connectionsToUseCount: connectionsToUse.length
      });
      
      connectionsToUse.forEach(conn => {
        // Find the original node that this connection belongs to
        const fromNode = originalNodes.find(n => n.id === conn.from);
        const toNode = originalNodes.find(n => n.id === conn.to);
        
        if (fromNode || toNode) {
          const nodeId = fromNode?.id || toNode?.id || '';
          const nodeLabel = fromNode?.label || toNode?.label || nodeId.substring(0, 12) + '...';
          
          allTxs.push({
            txHash: conn.txHash || `${conn.from}-${conn.to}-${Date.now()}`,
            amount: conn.amount,
            direction: conn.type === 'in' ? 'in' : 'out',
            fromAddress: conn.from,
            toAddress: conn.to,
            nodeId,
            nodeLabel
          });
        }
      });

      // Sort by amount (descending) then by direction
      allTxs.sort((a, b) => {
        const amountA = parseFloat(a.amount) || 0;
        const amountB = parseFloat(b.amount) || 0;
        if (amountA !== amountB) return amountB - amountA;
        return a.direction.localeCompare(b.direction);
      });

      setTransactions(allTxs);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount) || 0;
    return (num / 100000000).toFixed(8);
  };

  const getTotalUtxoCount = () => {
    return originalConnections.length;
  };

  const getTotalUtxoValue = () => {
    return originalConnections.reduce((sum, conn) => {
      return sum + (parseFloat(conn.amount) || 0);
    }, 0);
  };

  const getIncomingTxs = () => {
    return transactions.filter(tx => tx.direction === 'in');
  };

  const getOutgoingTxs = () => {
    return transactions.filter(tx => tx.direction === 'out');
  };

  if (!aggregatedNode) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[90vw] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {aggregatedNode.logoUrl && (
              <img 
                src={aggregatedNode.logoUrl} 
                alt="" 
                className="w-6 h-6 rounded" 
              />
            )}
            <span>{aggregatedNode.label}</span>
            <Badge variant="outline" className="text-xs">
              {aggregatedNode.entityType || 'entity'}
            </Badge>
            <Badge variant="default" className="text-xs bg-blue-600">
              Aggregated
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Member Nodes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{originalNodes.length}</div>
                <p className="text-xs text-muted-foreground">Original nodes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Total UTXOs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalUtxoCount()}</div>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bitcoin className="h-4 w-4" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(getTotalUtxoValue().toString())}</div>
                <p className="text-xs text-muted-foreground">BTC</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allConnections.filter(c => c.from === aggregatedNode.id || c.to === aggregatedNode.id).length}
                </div>
                <p className="text-xs text-muted-foreground">External edges</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions">All Transactions</TabsTrigger>
              <TabsTrigger value="incoming">Incoming</TabsTrigger>
              <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              <TransactionList 
                transactions={transactions} 
                loading={loading}
                title="All Transactions"
              />
            </TabsContent>

            <TabsContent value="incoming" className="space-y-4">
              <TransactionList 
                transactions={getIncomingTxs()} 
                loading={loading}
                title="Incoming Transactions"
              />
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-4">
              <TransactionList 
                transactions={getOutgoingTxs()} 
                loading={loading}
                title="Outgoing Transactions"
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface TransactionListProps {
  transactions: TransactionData[];
  loading: boolean;
  title: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, loading, title }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading transactions...</div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title} ({transactions.length})</h3>
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {transactions.map((tx, index) => (
            <Card key={`${tx.txHash}-${index}`} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {tx.direction === 'in' ? (
                      <ArrowLeft className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-red-600" />
                    )}
                    <Badge variant={tx.direction === 'in' ? 'default' : 'secondary'}>
                      {tx.direction}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="font-mono text-sm">
                      {tx.txHash.substring(0, 16)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tx.nodeLabel}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-semibold">
                    {formatAmount(tx.amount)} BTC
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tx.fromAddress.substring(0, 8)}... → {tx.toAddress.substring(0, 8)}...
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const formatAmount = (amount: string) => {
  const num = parseFloat(amount) || 0;
  return (num / 100000000).toFixed(8);
};