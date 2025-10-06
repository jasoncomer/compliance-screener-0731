import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { TransactionLoader } from '../../components/ui/blockchain-loader';
import { Button } from '../../components/ui/button';
import { useAttribution } from '../../context/AttributionContext';
import { useToast } from '../../hooks/use-toast';
import { useTransaction } from '../../hooks/useTransaction';

import BtcTransactionTable from './transaction/BtcTransactionTable';
import TransactionSummary from './transaction/TransactionSummary';

const TransactionView: React.FC = () => {
  const { txid } = useParams();
  const { toast } = useToast();
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const { fetchAttributions } = useAttribution();

  // Use React Query hook for transaction data
  const {
    data: transaction,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useTransaction(txid, {
    onError: (err) => {
      console.error('Failed to fetch transaction:', err);
      toast({
        title: "Failed to load transaction",
        description: err.message || "Unable to fetch transaction data. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Extract unique addresses with proper null checking
  const uniqueAddresses = useMemo(() => {
    if (!transaction) return [];

    const addresses = new Set<string>();

    // Safely extract addresses from inputs
    transaction.inputs?.forEach(input => {
      if (input.addr) addresses.add(input.addr);
    });

    // Safely extract addresses from outputs
    transaction.outputs?.forEach(output => {
      if (output.addr) addresses.add(output.addr);
    });

    return Array.from(addresses);
  }, [transaction]);

  // Fetch attributions in parallel with transaction
  useEffect(() => {
    if (uniqueAddresses.length > 0) {
      fetchAttributions(uniqueAddresses);
    }
  }, [uniqueAddresses, fetchAttributions]);

  const copyToClipboard = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!txid) return;

    navigator.clipboard.writeText(txid)
      .then(() => {
        setCopySuccess(true);
        toast({
          title: "Transaction hash copied",
          description: "The transaction hash has been copied to your clipboard.",
        });
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy transaction hash: ', err);
        toast({
          title: "Copy failed",
          description: "Failed to copy transaction hash to clipboard.",
          variant: "destructive",
        });
      });
  }, [txid, toast]);

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Transaction</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message || 'Failed to load transaction details.'}
            {txid && (
              <div className="mt-2 text-xs text-muted-foreground">
                Transaction ID: {txid}
              </div>
            )}
            <Button
              onClick={() => refetch()}
              className="mt-4"
              variant="default"
              size="sm"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state - show skeleton UI
  if (isLoading || !transaction) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <TransactionLoader txid={txid} />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Show refetching indicator */}
      {isRefetching && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md border">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Updating...</span>
          </div>
        </div>
      )}

      <TransactionSummary
        transaction={transaction}
        copySuccess={copySuccess}
        onCopyClick={copyToClipboard}
      />

      <div className="w-full">
        <div className="flex py-2 items-center justify-between">
          <h3>Transaction Details</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>

        <BtcTransactionTable transaction={transaction} />
      </div>
    </div>
  );
};

export default TransactionView;