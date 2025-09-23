import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { BsBlock } from '../../styles/Table';
import TransactionSummary from './transaction/TransactionSummary';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { api } from '../../api/api';
import { useTheme } from '../../context/ThemeContext';
import { useAttribution } from '../../context/AttributionContext';
import { useToast } from '../../hooks/use-toast';

const TransactionView: React.FC = () => {
  const { txid } = useParams();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [transaction, setTransaction] = React.useState<BtcTransaction>();
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const { fetchAttributions } = useAttribution();

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!txid || typeof txid != 'string') return;
      const response = await api.blockchain.getTransaction(txid);
      setTransaction(response);
    }

    fetchTransaction();
  }, [txid]);

  // Fetch attributions for all addresses in the transaction
  useEffect(() => {
    if (!transaction) return;
    
    // Extract all unique addresses from inputs and outputs
    const uniqueAddresses = new Set([
      ...transaction.inputs.map(input => input.addr),
      ...transaction.outputs.map(output => output.addr)
    ]);
    
    // Fetch attributions for all addresses
    fetchAttributions(Array.from(uniqueAddresses));
  }, [transaction, fetchAttributions]);

  const copyToClipboard = (e: React.MouseEvent) => {
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
  };

  if (!transaction) return <div>Loading...</div>;

  return (
    <div className="flex flex-col w-full">
      <TransactionSummary
        transaction={transaction}
        copySuccess={copySuccess}
        onCopyClick={copyToClipboard}
      />
      
      <div className="w-full">
        <BsBlock>
          <h3>Transaction Details</h3>
          <hr />
          <BtcTransactionTable transaction={transaction} theme={{ theme }} />
        </BsBlock>
      </div>
    </div>
  );
};

export default TransactionView;