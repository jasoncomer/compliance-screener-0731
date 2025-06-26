import React, { useState, useMemo } from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import { TransformedTransaction } from '../../../../utils/transactionTransformers';
import { X, ExternalLink, Copy, Check, TrendingUp, BarChart3 } from 'lucide-react';

interface Counterparty {
  entity: string;
  direction: 'inflow' | 'outflow';
  amount: string;
  btcAmount: string;
  txns: number;
  address: string;
}

interface TopCounterpartiesProps {
  incoming: Counterparty[];
  outgoing: Counterparty[];
  onCounterpartyClick?: (address: string) => void;
  transactions?: TransformedTransaction[];
}

const TopCounterparties: React.FC<TopCounterpartiesProps> = ({ 
  incoming, 
  outgoing, 
  onCounterpartyClick,
  transactions = []
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [counterpartyMode, setCounterpartyMode] = useState<'volume' | 'txns'>('volume');
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Get transactions for a specific counterparty
  const getCounterpartyTransactions = (address: string) => {
    return transactions.filter(tx => 
      (tx.type === 'in' && tx.from === address) || 
      (tx.type === 'out' && tx.to === address)
    );
  };

  // Modal functions
  const openModal = (record: Counterparty) => {
    if (record.entity && record.address) {
      setSelectedCounterparty(record);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCounterparty(null);
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

  const openAddressInExplorer = () => {
    if (selectedCounterparty?.address) {
      const explorerUrl = `/home/block-explorer/address/${selectedCounterparty.address}`;
      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const allCounterparties = useMemo(() => {
    return [...incoming, ...outgoing].sort((a, b) => {
      if (counterpartyMode === 'volume') {
        const aAmount = parseFloat(a.amount.replace(/[$,]/g, ''));
        const bAmount = parseFloat(b.amount.replace(/[$,]/g, ''));
        return bAmount - aAmount;
      }
      return b.txns - a.txns;
    });
  }, [incoming, outgoing, counterpartyMode]);

  const filteredData = useMemo(() => {
    switch(activeTab) {
      case 'inflow':
        return allCounterparties.filter(c => c.direction === 'inflow');
      case 'outflow':
        return allCounterparties.filter(c => c.direction === 'outflow');
      case 'all':
      default:
        return allCounterparties;
    }
  }, [activeTab, allCounterparties]);

  return (
    <>
      <div className="flex-1 min-w-[320px] flex flex-col justify-stretch">
        <div className={`rounded-2xl border h-full flex flex-col ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Top Counterparties
            </h4>
            <div className="flex space-x-2">
              <button
                onClick={() => setCounterpartyMode('volume')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  counterpartyMode === 'volume'
                    ? theme === 'dark' 
                      ? 'bg-blockscout-orange text-white hover:bg-blockscout-orange/90'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                    : theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-3 h-3 inline mr-1" />
                By Volume
              </button>
              <button
                onClick={() => setCounterpartyMode('txns')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  counterpartyMode === 'txns'
                    ? theme === 'dark' 
                      ? 'bg-blockscout-orange text-white hover:bg-blockscout-orange/90'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                    : theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-3 h-3 inline mr-1" />
                By Transactions
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className={`border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex px-4">
              {[
                { key: 'all', label: `All (${allCounterparties.length})` },
                { key: 'inflow', label: `Inflow (${incoming.length})` },
                { key: 'outflow', label: `Outflow (${outgoing.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-orange-600 dark:text-blockscout-orange border-b-2 border-orange-600 dark:border-blockscout-orange'
                      : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-blockscout-orange'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 px-4 pt-4 pb-4 min-h-0 flex flex-col">
            <div className="flex-1 overflow-hidden">
              {filteredData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  No counterparties found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-[348px] min-h-[348px] overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b h-8 ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <th className={`text-left py-3 px-2 text-xs font-semibold ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Entity</th>
                          <th className={`text-left py-3 px-2 text-xs font-semibold ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Direction</th>
                          <th className={`text-left py-3 px-2 text-xs font-semibold ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>USD</th>
                          <th className={`text-left py-3 px-2 text-xs font-semibold ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>BTC</th>
                          <th className={`text-left py-3 px-2 text-xs font-semibold ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Txns</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((counterparty) => (
                          <tr 
                            key={`${counterparty.address}-${counterparty.direction}`}
                            className={`border-b h-8 ${
                              theme === 'dark' 
                                ? 'border-gray-700 hover:bg-gray-700/50' 
                                : 'border-gray-100 hover:bg-gray-50'
                            } transition-colors cursor-pointer`}
                            onClick={() => openModal(counterparty)}
                          >
                            <td className={`py-3 px-2 text-xs ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              <span 
                                className="hover:text-orange-600 dark:hover:text-blockscout-orange transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCounterpartyClick?.(counterparty.address);
                                }}
                                title={`Click to view ${counterparty.entity} address`}
                              >
                                {counterparty.entity || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                counterparty.direction === 'inflow' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {counterparty.direction === 'inflow' ? '↗' : '↘'}
                              </span>
                            </td>
                            <td className={`py-3 px-2 text-xs font-mono ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {counterparty.amount}
                            </td>
                            <td className={`py-3 px-2 text-xs font-mono ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {counterparty.btcAmount}
                            </td>
                            <td className={`py-3 px-2 text-xs ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {counterparty.txns} txns
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Counterparty Details Modal */}
      {isModalOpen && selectedCounterparty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Transactions with {selectedCounterparty.entity}
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
              {/* Counterparty Info */}
              <div className={`p-4 rounded-lg grid grid-cols-2 gap-x-6 gap-y-4 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Entity</label>
                  <div className={`text-base ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{selectedCounterparty.entity}</div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>USD Amount</label>
                  <div className={`text-base font-mono ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{selectedCounterparty.amount}</div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>BTC Amount</label>
                  <div className={`text-base font-mono ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{selectedCounterparty.btcAmount}</div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Address</label>
                  <div className="flex items-center space-x-2">
                    <code className={`flex-1 text-sm font-mono break-all ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                    }`}>
                      {selectedCounterparty.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedCounterparty.address, 'address')}
                      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                        theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {copiedField === 'address' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={openAddressInExplorer}
                      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                        theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Transactions</label>
                  <div className={`text-base ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{selectedCounterparty.txns}</div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Recent Transactions</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <th className={`text-left py-2 px-2 text-xs font-semibold ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Time</th>
                        <th className={`text-left py-2 px-2 text-xs font-semibold ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Direction</th>
                        <th className={`text-left py-2 px-2 text-xs font-semibold ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Amount</th>
                        <th className={`text-left py-2 px-2 text-xs font-semibold ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>USD Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCounterpartyTransactions(selectedCounterparty.address).slice(0, 4).map((tx, index) => (
                        <tr 
                          key={index}
                          className={`border-b ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          }`}
                        >
                          <td className={`py-2 px-2 text-xs ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {formatTime(tx.time)}
                          </td>
                          <td className="py-2 px-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              tx.direction === 'inflow' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {tx.direction === 'inflow' ? '↗' : '↘'}
                            </span>
                          </td>
                          <td className={`py-2 px-2 text-xs font-mono ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {tx.description}
                          </td>
                          <td className={`py-2 px-2 text-xs ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {tx.usd}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex justify-end space-x-3 p-6 border-t ${
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
              <button
                onClick={() => {
                  onCounterpartyClick?.(selectedCounterparty.address);
                  closeModal();
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                View Address
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopCounterparties; 