import React from 'react';
import { Hash, Bitcoin, Clock, DollarSign, Building2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import { IComplianceTransaction, EComplianceTransactionStatus } from '@/typings/compliance';

interface TransactionInfoSummaryProps {
  transaction: IComplianceTransaction;
}

export const TransactionInfoSummary: React.FC<TransactionInfoSummaryProps> = ({
  transaction
}) => {
  const formatCurrency = (amount: number, blockchain: string) => {
    // This would typically use real price data
    const btcPrice = 45000; // Example BTC price
    const ethPrice = 3000; // Example ETH price
    
    let usdValue = amount;
    if (blockchain.toLowerCase() === "bitcoin") {
      usdValue = (amount / 100000000) * btcPrice;
    } else if (blockchain.toLowerCase() === "ethereum") {
      usdValue = amount * ethPrice;
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(usdValue);
  };

  const getChainTicker = (blockchain: string) => {
    switch (blockchain.toLowerCase()) {
      case 'bitcoin':
        return 'BTC';
      case 'ethereum':
        return 'ETH';
      default:
        return blockchain.toUpperCase();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transaction ID */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-blue-500" />
              <Label className="text-sm font-medium text-gray-600">Transaction ID</Label>
            </div>
            <p className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
              {transaction.txId}
            </p>
          </CardContent>
        </Card>

        {/* Client ID */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-green-500" />
              <Label className="text-sm font-medium text-gray-600">Client ID</Label>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {transaction.clientId}
            </p>
          </CardContent>
        </Card>

        {/* Blockchain */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bitcoin className="h-4 w-4 text-orange-500" />
              <Label className="text-sm font-medium text-gray-600">Blockchain</Label>
            </div>
            <Badge variant="secondary" className="capitalize">
              {transaction.blockchain}
            </Badge>
          </CardContent>
        </Card>

        {/* Timestamp */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <Label className="text-sm font-medium text-gray-600">Timestamp</Label>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {new Date(transaction.timestamp).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Amount */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <Label className="text-sm font-medium text-gray-600">Amount</Label>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {(transaction.amount / 100000000).toFixed(8)} {getChainTicker(transaction.blockchain)}
              </p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(transaction.amount, transaction.blockchain)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <Label className="text-sm font-medium text-gray-600">Status</Label>
            </div>
            <Badge
              variant={transaction.status === EComplianceTransactionStatus.APPROVED ? 'default' : 'secondary'}
              className={
                transaction.status === EComplianceTransactionStatus.APPROVED
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              }
            >
              {transaction.status || EComplianceTransactionStatus.UNASSIGNED}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};