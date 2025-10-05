import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchClientOverview,
  selectClientOverview,
  selectClientCases,
  selectTopCounterparties,
  selectClientOverviewLoading,
  selectClientOverviewError
} from '../../../../store/slices/clientOverviewSlice';
import { selectAvailableClientIds, fetchUniqueClientIds } from '../../../../store/slices/complianceTransactionsSlice';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Activity,
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  StickyNote
} from 'lucide-react';
import { format } from 'date-fns';
import { getClientTypeStyle } from '../../../../constants/clientTypes';
import NotesPanel from '../../../../components/common/NotesPanel';

const ClientOverviewTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const overview = useAppSelector(selectClientOverview);
  const cases = useAppSelector(selectClientCases);
  const topCounterparties = useAppSelector(selectTopCounterparties);
  const loading = useAppSelector(selectClientOverviewLoading);
  const error = useAppSelector(selectClientOverviewError);
  const availableClientIds = useAppSelector(selectAvailableClientIds);

  const [clientId, setClientId] = useState('');
  const [searchClientId, setSearchClientId] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Debug: Log cases data
  useEffect(() => {
    if (clientId) {
      console.log(`Debug: Cases for client ${clientId}:`, cases);
      console.log(`Debug: Cases length:`, cases?.length);
      console.log(`Debug: Cases type:`, typeof cases);
    }
  }, [cases, clientId]);

  // Add error boundary for cases data
  const safeCases = useMemo(() => {
    if (!Array.isArray(cases)) {
      console.warn('Cases is not an array:', cases);
      return [];
    }
    return cases;
  }, [cases]);

  // Cases are now actual Case records, no mapping needed

  // Filter suggestions based on search input
  const filteredSuggestions = useMemo(() => {
    if (!searchClientId.trim()) return availableClientIds;
    return availableClientIds.filter(id => 
      id.toLowerCase().includes(searchClientId.toLowerCase())
    );
  }, [searchClientId, availableClientIds]);

  const handleSearch = () => {
    if (searchClientId.trim()) {
      setClientId(searchClientId.trim());
      dispatch(fetchClientOverview({ clientId: searchClientId.trim() }));
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        setSearchClientId(filteredSuggestions[highlightedIndex]);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchClientId(value);
    setShowSuggestions(value.length > 0);
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchClientId(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (searchClientId.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };


  // Fetch unique client IDs on component mount
  useEffect(() => {
    dispatch(fetchUniqueClientIds());
  }, [dispatch]);

  // Get risk trend icon
  const getRiskTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get risk trend color
  const getRiskTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-500';
      case 'decreasing':
        return 'text-green-500';
      case 'stable':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-950/30">

      <div className="px-6 py-4">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Apple-style Search */}
          <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Client ID..."
                    value={searchClientId}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-0 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                  />
                </div>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 max-h-60 overflow-y-auto backdrop-blur-xl">
                    {filteredSuggestions.slice(0, 10).map((suggestion, index) => (
                      <div
                        key={suggestion}
                        className={`px-4 py-3 cursor-pointer text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ${
                          index === highlightedIndex ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                        } ${index === 0 ? 'rounded-t-xl' : ''} ${index === Math.min(9, filteredSuggestions.length - 1) ? 'rounded-b-xl' : ''}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-mono">{suggestion}</span>
                        </div>
                      </div>
                    ))}
                    {filteredSuggestions.length > 10 && (
                      <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
                        Showing 10 of {filteredSuggestions.length} results
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchClientId.trim()}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                Search
              </button>
            </div>
            {availableClientIds.length > 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                {availableClientIds.length} client IDs available
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                No client IDs found in compliance transactions
              </p>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading client data...</p>
              </div>
            </div>
          )}

          {overview && (
            <>
              {/* Apple-style Client Info */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Client Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Client ID</p>
                    <p className="font-mono text-xl font-semibold text-gray-900 dark:text-white">{overview.clientId}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Client Name</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{overview.clientName || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Client Type</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">{overview.clientType || 'Not specified'}</span>
                      {overview.clientType && (() => {
                        const style = getClientTypeStyle(overview.clientType);
                        return (
                          <div className={`px-3 py-1 ${style.bgColor} rounded-full flex items-center space-x-1`}>
                            <span className="text-xs">{style.icon}</span>
                            <span className={`text-xs font-medium ${style.textColor} capitalize`}>
                              {overview.clientType}
                            </span>
                          </div>
                        );
                      })()}
                      {!overview.clientType && (
                        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Unknown</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Apple-style Metrics Overview - Sticky */}
              <div className="sticky top-[72px] z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-800/50">
                {/* Transaction Metrics */}
                <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-6 hover:shadow-md transition-shadow duration-200 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{overview.totalTransactions.toLocaleString()}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">transactions</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Total Transactions</p>
                    {overview.averageTransactionSize > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Avg: ${overview.averageTransactionSize.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-6 hover:shadow-md transition-shadow duration-200 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${(overview.totalInflow / 1000000000).toFixed(1)}B
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">total inflow</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Total Inflow</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Largest: ${(overview.largestTransaction / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                {/* Case Metrics */}
                <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-6 hover:shadow-md transition-shadow duration-200 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{overview.totalCases}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">cases</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Total Cases</p>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-green-600 dark:text-green-400">Open: {overview.openCases}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 dark:text-gray-400">Closed: {overview.closedCases}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-6 hover:shadow-md transition-shadow duration-200 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{overview.averageRiskScore.toFixed(1)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">risk score</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Risk Score</p>
                    <div className="flex items-center space-x-2 text-xs">
                      {getRiskTrendIcon(overview.riskTrend)}
                      <span className={`${getRiskTrendColor(overview.riskTrend)} capitalize`}>
                        {overview.riskTrend}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apple-style Activity Timeline */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Timeline</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">First Transaction</p>
                    </div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {overview.firstTransactionDate 
                        ? format(new Date(overview.firstTransactionDate), 'MMM dd, yyyy')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Transaction</p>
                    </div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {overview.lastTransactionDate 
                        ? format(new Date(overview.lastTransactionDate), 'MMM dd, yyyy')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Case</p>
                    </div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {overview.lastCaseDate 
                        ? format(new Date(overview.lastCaseDate), 'MMM dd, yyyy')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Apple-style Top Counterparties */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Top 5 Counterparties</h2>
                  </div>
                  <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{Math.min(topCounterparties.length, 5)} entities</span>
                  </div>
                </div>
                {topCounterparties.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No counterparty data available</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      This client has no counterparty entities identified in their transactions. 
                      This could mean:
                    </p>
                    <ul className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-left max-w-md mx-auto">
                      <li>• Transactions haven't been processed for entity attribution yet</li>
                      <li>• Counterparty addresses couldn't be attributed to known entities</li>
                      <li>• All transactions are with unlabeled addresses</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topCounterparties.slice(0, 5).map((counterparty, index) => (
                      <div key={counterparty.entityId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                              {counterparty.entityId.length > 24 
                                ? `${counterparty.entityId.substring(0, 24)}...`
                                : counterparty.entityId
                              }
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Last activity: {format(new Date(counterparty.lastTransactionDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${(counterparty.totalAmount / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">total volume</p>
                          </div>
                          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {counterparty.count} txns
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Apple-style Cases List */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Cases</h2>
                  </div>
                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{safeCases.length} cases</span>
                </div>
              </div>
              {safeCases.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No cases found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    This client has no compliance cases or transactions requiring review
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {safeCases.slice(0, 5).map((caseItem) => {
                    if (!caseItem || !caseItem._id) {
                      console.warn('Invalid case item:', caseItem);
                      return null;
                    }
                    
                    return (
                      <div key={caseItem._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            caseItem.isTransactionCase 
                              ? 'bg-blue-100 dark:bg-blue-900/30' 
                              : 'bg-orange-100 dark:bg-orange-900/30'
                          }`}>
                            <FileText className={`h-4 w-4 ${
                              caseItem.isTransactionCase 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-orange-600 dark:text-orange-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{caseItem.title || 'Untitled Case'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {caseItem.caseNumber || 'N/A'}
                              {caseItem.isTransactionCase && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">
                                  Transaction
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {caseItem.totalAmount ? `$${(caseItem.totalAmount / 1000000).toFixed(1)}M` : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(caseItem.openedAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              caseItem.status === 'OPEN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              caseItem.status === 'CLOSED' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {caseItem.status.replace('_', ' ')}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              caseItem.priority === 'HIGH' || caseItem.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {caseItem.priority}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                    <StickyNote className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Client Notes</h2>
                </div>
                <NotesPanel 
                  type="general"
                  address={clientId}
                  inline={true}
                />
              </div>
            </>
          )}

          {!overview && !loading && clientId && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No data found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No data available for client: {clientId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientOverviewTab;