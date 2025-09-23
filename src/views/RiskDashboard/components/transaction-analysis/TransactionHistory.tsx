import React, { useMemo,useState } from 'react';

import { ArrowDownRight,ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, ExternalLink, X } from 'lucide-react';

import { useAttribution } from '../../../../context/AttributionContext';
import { useTheme } from '../../../../context/ThemeContext';
import { useAddressTransactions } from '../../../../hooks/useAddressTransactions';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';
import { useAppSelector } from '../../../../store/hooks';
import { RootState } from '../../../../store/store';
import { truncateStringMiddle } from '../../../../utils/generic';
import { TransformedTransaction } from '../../../../utils/transactionTransformers';
import { transformBtcTransactions } from '../../../../utils/transactionTransformers';

interface TransactionHistoryProps {
  address: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  address
}) => {
  const { theme } = useTheme();
  const [txTab, setTxTab] = useState<'all' | 'in' | 'out'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedTransaction, setSelectedTransaction] = useState<TransformedTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { getPrice } = useCryptoPrices();
  const btcPrice = getPrice('BTC') || 35000; // Default fallback price
  
  // Attribution and SOT data hooks
  const { attributions } = useAttribution();
  const { itemsMap } = useAppSelector((state: RootState) => state.sot);

  // Helper function to get entity name for a counterparty address
  const getEntityName = (counterpartyAddress: string): string | null => {
    if (!counterpartyAddress || counterpartyAddress === 'Unknown') return null;
    
    const attribution = attributions[counterpartyAddress];
    if (!attribution) return null;
    
    const entityId = attribution.entity || attribution.bo || attribution.custodian;
    if (!entityId) return null;
    
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    // Only return proper_name if it exists and is not empty
    return entity?.proper_name || null;
  };

  // Fetch the 100 most recent transactions using React Query
  const { data: transactionData, isLoading, error } = useAddressTransactions(address, 1, 100);

  // Transform transaction data
  const transformedTransactions: TransformedTransaction[] = useMemo(() => {
    if (!transactionData?.txs) return [];
    return transformBtcTransactions(transactionData.txs, address, btcPrice);
  }, [transactionData?.txs, address, btcPrice]);


  // Function to open BlockScout explorer
  const handleViewInBlockScout = () => {
    if (address) {
      // Open in the internal block explorer
      const blockExplorerUrl = `/home/block-explorer/address/${address}`;
      window.open(blockExplorerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Modal functions
  const openModal = (transaction: TransformedTransaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    setCopiedField(null);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const openTransactionInExplorer = () => {
    if (selectedTransaction) {
      const explorerUrl = `/home/block-explorer/transaction/${selectedTransaction.txid}`;
      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Filtered tx data
  const filteredTx = useMemo(() => {
    // Only use real transactions, no mock data fallback
    return txTab === 'all' ? transformedTransactions : transformedTransactions.filter(tx => tx.type === txTab);
  }, [transformedTransactions, txTab]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTx.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredTx.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'inflow' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  const getDirectionBg = (direction: string) => {
    return direction === 'inflow' 
      ? 'bg-green-100 dark:bg-green-900/20' 
      : 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <>
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className={`text-lg font-semibold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Transaction History</h4>
        <button 
          className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
            theme === 'dark' 
              ? 'bg-orange-600 text-white hover:bg-orange-700' 
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
          onClick={handleViewInBlockScout}
          disabled={!address}
        >
          View in BlockScout Explorer
        </button>
      </div>
      
      {/* Tabs */}
      <div className={`border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
          <div className="flex px-4">
            {[
            { key: 'all', label: 'All Transactions' },
            { key: 'in', label: 'Inflows (Received)' },
            { key: 'out', label: 'Outflows (Sent)' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTxTab(tab.key as any)}
                className={`py-3 px-4 text-sm font-medium transition-colors ${
                  txTab === tab.key
                    ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
      </div>
      
        {/* Table Content */}
        <div className="flex-1 px-4 pt-4 pb-4 min-h-0">
        {error ? (
          <div className={`p-4 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-red-900/20 border-red-700 text-red-200' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-medium">Error</span>
            </div>
            <p className="mt-1">{error.message}</p>
          </div>
        ) : (
            <>
              {/* Table */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                ) : filteredTx.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    No transactions found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <th className={`text-left py-3 px-2 text-xs font-semibold ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Time</th>
                            <th className={`text-left py-3 px-2 text-xs font-semibold ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Direction</th>
                            <th className={`text-left py-3 px-2 text-xs font-semibold ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Amount (USD)</th>
                            <th className={`text-left py-3 px-2 text-xs font-semibold ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Amount (BTC)</th>
                            <th className={`text-left py-3 px-2 text-xs font-semibold ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Counterparty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((transaction, index) => (
                            <tr 
                              key={`${transaction.txid}-${index}`}
                              className={`border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                              }`}
                              onClick={() => openModal(transaction)}
                            >
                              <td className="py-3 px-2">
                                <span className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {formatTime(transaction.time)}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  transaction.type === 'in'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {transaction.type === 'in' ? (
                                    <ArrowUpRight className="w-3 h-3" />
                                  ) : (
                                    <ArrowDownRight className="w-3 h-3" />
                                  )}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <span className={`text-sm font-medium ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {transaction.usd}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <span className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {transaction.value.toFixed(8)} BTC
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex flex-col">
                                  {(() => {
                                    const counterpartyAddress = transaction.type === 'in' ? transaction.from : transaction.to;
                                    const entityName = getEntityName(counterpartyAddress);
                                    return (
                                      <>
                                        {entityName && (
                                          <span className={`text-xs font-medium mb-1 ${
                                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                          }`}>
                                            {entityName}
                                          </span>
                                        )}
                                        <span className={`text-sm ${
                                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                          {truncateStringMiddle(counterpartyAddress, 16)}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredTx.length > 0 && (
                <div className={`flex items-center justify-between mt-4 pt-4 border-t ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Show
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className={`text-sm border rounded px-2 py-1 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-300' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      {[5, 8, 12].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      of {filteredTx.length} transactions
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-1 rounded ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-1 rounded ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
        )}
      </div>
    </div>

      {/* Transaction Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Transaction Details
              </h3>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Transaction Hash */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Transaction Hash
                </label>
                <div className="flex items-center space-x-2">
                  <code className={`flex-1 p-3 rounded-lg text-sm font-mono break-all ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedTransaction.txid}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedTransaction.txid, 'txid')}
                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {copiedField === 'txid' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={openTransactionInExplorer}
                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Direction and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Direction
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${getDirectionBg(selectedTransaction.direction)} ${getDirectionColor(selectedTransaction.direction)}`}>
                      {selectedTransaction.direction === 'inflow' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Amount
                  </label>
                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="text-lg font-semibold">{selectedTransaction.description}</div>
                    <div className="text-sm opacity-75">{selectedTransaction.usd}</div>
                  </div>
                </div>
              </div>

              {/* From Address */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  From Address
                </label>
                <div className="space-y-2">
                  {(() => {
                    const entityName = getEntityName(selectedTransaction.from);
                    return entityName && (
                      <div className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {entityName}
                      </div>
                    );
                  })()}
                  <div className="flex items-center space-x-2">
                    <code className={`flex-1 p-3 rounded-lg text-sm font-mono break-all ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTransaction.from}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedTransaction.from, 'from')}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {copiedField === 'from' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* To Address */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  To Address
                </label>
                <div className="space-y-2">
                  {(() => {
                    const entityName = getEntityName(selectedTransaction.to);
                    return entityName && (
                      <div className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {entityName}
                      </div>
                    );
                  })()}
                  <div className="flex items-center space-x-2">
                    <code className={`flex-1 p-3 rounded-lg text-sm font-mono break-all ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTransaction.to}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedTransaction.to, 'to')}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {copiedField === 'to' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Timestamp
                </label>
                <div className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                }`}>
                  {formatTime(selectedTransaction.time)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex justify-end p-6 border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={closeModal}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionHistory; 