import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { flowtraceService } from '../../../services/flowtraceService';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Button } from '../../../components/ui/button';
import { Search, Filter, TrendingUp, CheckSquare, Square, Copy } from 'lucide-react';
import { useCryptoPrices } from '../../../hooks/useCryptoPrices';

type Props = {
  open: boolean;
  address: string | null;
  onOpenChange: (open: boolean) => void;
  onAdd: (payload: { address: string; selectedTxs: any[] }) => void;
  nodeLabel?: string;
  existingConnections?: { from: string; to: string; utxoKey?: string }[];
};

// Enhanced transaction type with entity and risk information
interface EnhancedTransaction {
  txid: string;
  time: number;
  inputs: any[];
  outputs: any[];
  entityName?: string;
  entityId?: string;
  riskScore?: number;
  amount?: string;
  currency?: string;
  usdValue?: string;
  direction?: 'in' | 'out';
  entityType?: string;
  logo?: string;
  date?: string;
  entityTags?: string[];
  ofac?: boolean;
  isBeneficialOwnerOverride?: boolean;
  displayTitle?: string;
  cospendId?: string;
  transactionCount?: number;
  originalTxHash?: string;
  attribution?: any;
  entityProfile?: any;
}

/**
 * Optimized NodeTxPicker using the new FlowTrace optimized service
 * Dramatically faster than the original implementation
 */
const NodeTxPickerOptimized: React.FC<Props> = ({ 
  open, 
  address, 
  onOpenChange, 
  onAdd, 
  nodeLabel, 
  existingConnections = [] 
}) => {
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<EnhancedTransaction[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date_desc' | 'date_asc' | 'entity_name' | 'entity_id' | 'risk' | 'amount'>('date_desc');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [groupByEntity, setGroupByEntity] = useState<boolean>(true);
  const [copiedTxHash, setCopiedTxHash] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Get crypto prices for USD calculations
  const { getPrice } = useCryptoPrices();

  // Build set of already-expanded counterparty addresses for pre-selection
  const { expandedAddresses, expandedUtxoKeys } = useMemo(() => {
    const addrSet = new Set<string>();
    const keySet = new Set<string>();
    if (!address) return { expandedAddresses: addrSet, expandedUtxoKeys: keySet };

    const collect = (conn: any) => {
      if (!conn) return;
      if (conn.utxoKey) keySet.add(conn.utxoKey);
    };

    existingConnections.forEach((c: any) => {
      if (c.from === address && c.to) addrSet.add(c.to);
      if (c.to === address && c.from) addrSet.add(c.from);

      collect(c);
      if (Array.isArray(c.originalConnections)) {
        c.originalConnections.forEach((oc: any) => collect(oc));
      }
    });

    return { expandedAddresses: addrSet, expandedUtxoKeys: keySet };
  }, [existingConnections, address]);

  // Copy transaction hash to clipboard
  const copyTxHash = async (txHash: string) => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopiedTxHash(txHash);
      setTimeout(() => setCopiedTxHash(null), 2000);
    } catch (error) {
      console.error('Failed to copy transaction hash:', error);
    }
  };


  // Calculate USD value from BTC amount
  const calculateUsdValue = (btcAmount: number, currency: string = 'BTC'): string => {
    if (currency === 'BTC') {
      const btcPrice = getPrice('BTC');
      if (btcPrice) {
        const usdValue = btcAmount * btcPrice;
        return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        const fallbackPrice = 45000;
        const usdValue = btcAmount * fallbackPrice;
        return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    } else if (currency === 'USDC' || currency === 'USDT') {
      return `$${btcAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return '$0.00';
    }
  };

  // Pre-select already-expanded addresses only on initial load
  useEffect(() => {
    if (!open) return;
    if (selected.size > 0) return;

    const pre = new Set<string>();
    txs.forEach((tx) => {
      const counterparty = tx.direction === 'in' ? tx.inputs?.[0]?.addr : tx.outputs?.[0]?.addr;

      let utxoKey: string | null = null;
      if (tx.direction === 'in') {
        utxoKey = `${tx.originalTxHash || tx.txid}::${address}::in`;
      } else {
        utxoKey = `${tx.originalTxHash || tx.txid}::${counterparty}::out`;
      }

      if ((counterparty && expandedAddresses.has(counterparty)) || (utxoKey && expandedUtxoKeys.has(utxoKey))) {
        pre.add(tx.txid);
      }
    });
    if (pre.size > 0) {
      setSelected(pre);
    }
  }, [txs, expandedAddresses, expandedUtxoKeys, open, selected.size]);

  // OPTIMIZED: Use the new FlowTrace optimized service
  useEffect(() => {
    const run = async () => {
      if (!open || !address) return;
      setLoading(true);
      
      try {
        console.log(`🚀 NodeTxPicker: Using optimized FlowTrace service for ${address}`);
        const startTime = Date.now();

        // Use the optimized FlowTrace service
        const optimizedResponse = await flowtraceService.expandNodeOptimized(address, {
          includeRiskScores: true,
          includeTransactions: true
        });

        const endTime = Date.now();
        const loadTime = endTime - startTime;

        console.log(`✅ NodeTxPicker: Optimized data loaded in ${loadTime}ms`);
        console.log(`📊 Performance: ${optimizedResponse.performance.apiCallsSaved} API calls saved`);

        // Store performance metrics
        setPerformanceMetrics(optimizedResponse.performance);

        // Convert optimized response to the format expected by the component
        const enhancedTxs: EnhancedTransaction[] = optimizedResponse.data.enhancedData.map((item: any, index: number) => {
          const entityName = item.attribution?.entity || item.entityProfile?.proper_name || 'Unknown Entity';
          const entityId = item.attribution?.entity || 'unknown';
          const entityType = item.entityProfile?.entity_type || 'wallet';
          const logo = item.entityProfile?.logo_url || null;
          const riskScore = item.entityProfile?.risk_score || 0;

          return {
            txid: `tx_${item.direction}_${index}`,
            time: item.timestamp || 0,
            inputs: item.direction === 'in' ? [item] : [],
            outputs: item.direction === 'out' ? [item] : [],
            entityName,
            entityId,
            entityType,
            logo,
            riskScore,
            amount: item.amount?.toString() || '0',
            currency: item.currency || 'BTC',
            direction: item.direction,
            usdValue: calculateUsdValue(parseFloat(item.amount || '0'), item.currency || 'BTC'),
            date: item.timestamp ? new Date(item.timestamp * 1000).toISOString().split('T')[0] : 'Unknown',
            entityTags: item.entityProfile?.entity_tags || [],
            ofac: item.entityProfile?.entity_tags?.includes('ofac sanctioned') || false,
            isBeneficialOwnerOverride: false,
            displayTitle: entityName,
            cospendId: item.attribution?.cospend_id || item.addr,
            transactionCount: 1,
            originalTxHash: item.txid,
            attribution: item.attribution,
            entityProfile: item.entityProfile
          };
        });

        setTxs(enhancedTxs);
        setTotal(enhancedTxs.length);

        console.log(`NodeTxPicker Optimized: Found ${enhancedTxs.length} UTXOs for address ${address}`);
        console.log('Enhanced UTXOs:', enhancedTxs.slice(0, 3));

        // Log data availability summary
        const dataSummary = {
          totalUTXOs: enhancedTxs.length,
          withEntityName: enhancedTxs.filter(tx => tx.entityName && tx.entityName !== 'Unknown Entity').length,
          withEntityId: enhancedTxs.filter(tx => tx.entityId && tx.entityId !== 'unknown').length,
          withEntityType: enhancedTxs.filter(tx => tx.entityType && tx.entityType !== 'unknown').length,
          withRiskScore: enhancedTxs.filter(tx => tx.riskScore !== undefined).length,
          withLogo: enhancedTxs.filter(tx => tx.logo).length,
          loadTime: `${loadTime}ms`,
          apiCallsSaved: optimizedResponse.performance.apiCallsSaved
        };
        console.log('Optimized data availability summary:', dataSummary);

      } catch (error) {
        console.error('Error in optimized NodeTxPicker:', error);
        // Fallback to empty state
        setTxs([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    
    run();
  }, [open, address]);

  const toggle = (txid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(txid)) next.delete(txid); else next.add(txid);
      return next;
    });
  };

  const allOnPageIds = useMemo(() => txs.map((t) => t.txid).filter(Boolean), [txs]);

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = allOnPageIds.every((id) => next.has(id));
      if (allSelected) {
        allOnPageIds.forEach((id) => next.delete(id));
      } else {
        allOnPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const confirm = () => {
    if (!address) return;
    const rows = txs.filter((t) => selected.has(t.txid));
    onAdd({ address, selectedTxs: rows });
    onOpenChange(false);
    setSelected(new Set());
  };

  const handleSort = (newSort: typeof sort) => {
    if (sort === newSort) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(newSort);
      setSortDirection('asc');
    }
  };

  // Filter and sort transactions
  const filteredTxs = useMemo(() => {
    const filtered = txs.filter(tx => {
      const searchLower = search.toLowerCase();
      return (
        tx.txid.toLowerCase().includes(searchLower) ||
        ((tx.inputs || []).some((i: any) => (i.addr || '').toLowerCase().includes(searchLower))) ||
        ((tx.outputs || []).some((o: any) => (o.addr || '').toLowerCase().includes(searchLower))) ||
        (tx.entityName || '').toLowerCase().includes(searchLower) ||
        (tx.entityId || '').toLowerCase().includes(searchLower) ||
        (tx.amount || '').includes(searchLower)
      );
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sort) {
        case 'date_desc':
        case 'date_asc':
          aValue = new Date(a.date || a.time * 1000).getTime();
          bValue = new Date(b.date || b.time * 1000).getTime();
          break;
        case 'entity_name':
          aValue = (a.entityName || '').toLowerCase();
          bValue = (b.entityName || '').toLowerCase();
          break;
        case 'entity_id':
          aValue = (a.entityId || '').toLowerCase();
          bValue = (b.entityId || '').toLowerCase();
          break;
        case 'risk':
          aValue = a.riskScore || 0;
          bValue = b.riskScore || 0;
          break;
        case 'amount':
          aValue = parseFloat(a.amount || '0');
          bValue = parseFloat(b.amount || '0');
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [txs, search, sort, sortDirection]);


  // Helper functions for styling
  const getRiskColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    if (score > 70) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600';
    if (score > 40) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600';
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600';
  };

  const getEntityTypeColor = (type: string | undefined) => {
    if (!type) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    const colors: Record<string, string> = {
      'exchange': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600',
      'wallet': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600',
      'mixer': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600',
      'defi': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600',
      'service': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600',
      'csam': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600',
      'gambling': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600',
      'mining': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-600',
      'unknown': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
  };

  const formatEntityType = (type: string | undefined) => {
    if (!type) return 'Unknown';
    const typeMap: Record<string, string> = {
      'defi': 'DeFi',
      'csam': 'CSAM',
      'dex': 'DEX',
      'cex': 'CEX'
    };
    const mappedType = typeMap[type.toLowerCase()] || type;
    return mappedType.charAt(0).toUpperCase() + mappedType.slice(1).toLowerCase();
  };

  const formatDateForDisplay = (dateString: string | undefined, timestamp: number | undefined) => {
    if (dateString && dateString !== 'Unknown') {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch (e) {
        console.warn('Failed to parse date string:', dateString, e);
      }
    }

    if (timestamp) {
      return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    return 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); }}>
      <DialogContent className="w-full max-w-7xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-xl font-semibold">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                <span>Expand Node: {nodeLabel || address || 'Address'}</span>
                {loading && (
                  <span className="ml-2 text-sm text-orange-500">Loading…</span>
                )}
                {performanceMetrics && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                    ⚡ Optimized: {performanceMetrics.apiCallsSaved} calls saved
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {total} UTXOs available
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Search and Controls */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Search UTXOs, entities, or addresses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-900"
            >
              <option value="date_desc">Date (Newest)</option>
              <option value="date_asc">Date (Oldest)</option>
              <option value="entity_name">Entity Name</option>
              <option value="entity_id">Entity ID</option>
              <option value="risk">Risk Score</option>
              <option value="amount">Amount</option>
            </select>

            {/* Sort Direction */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </Button>

            {/* Grouping Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGroupByEntity(!groupByEntity)}
              className="px-3 py-2"
            >
              <Filter className="h-4 w-4 mr-2" />
              {groupByEntity ? 'Grouped' : 'Ungrouped'}
            </Button>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAll}
                className="flex items-center gap-2"
              >
                {selected.size === filteredTxs.length ? (
                  <>
                    <Square className="h-4 w-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Select All
                  </>
                )}
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-orange-600">{selected.size}</span> of{' '}
                <span className="font-medium">{filteredTxs.length}</span> selected
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-950">
          <div className="h-full overflow-auto" style={{ position: 'relative' }}>
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="text-gray-500">Loading UTXOs with optimized service...</span>
                </div>
              </div>
            ) : filteredTxs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No UTXOs found
              </div>
            ) : (
              // Simplified table display for optimized version
              <div className="border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <div className="p-4 bg-white dark:bg-gray-800">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 shadow-sm">
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left p-3 w-12 text-gray-700 dark:text-gray-200 font-medium">
                          <Checkbox
                            checked={selected.size === filteredTxs.length && filteredTxs.length > 0}
                            onCheckedChange={toggleAll}
                            className="h-4 w-4"
                          />
                        </th>
                        <th className="text-left p-3 w-28 text-gray-700 dark:text-gray-200 font-medium">Entity Name</th>
                        <th className="text-left p-3 w-28 text-gray-700 dark:text-gray-200 font-medium">Entity ID</th>
                        <th className="text-left p-3 w-28 text-gray-700 dark:text-gray-200 font-medium">Amount</th>
                        <th className="text-left p-3 w-24 text-gray-700 dark:text-gray-200 font-medium">Date</th>
                        <th className="text-left p-3 w-16 text-gray-700 dark:text-gray-200 font-medium">Risk</th>
                        <th className="text-left p-3 w-20 text-gray-700 dark:text-gray-200 font-medium">Type</th>
                        <th className="text-left p-3 w-20 text-gray-700 dark:text-gray-200 font-medium">Direction</th>
                        <th className="text-left p-3 w-28 text-gray-700 dark:text-gray-200 font-medium">TXID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxs.map((tx) => (
                        <tr
                          key={tx.txid}
                          className="border-b border-gray-100 dark:border-gray-700 hover:opacity-80 transition-colors"
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={selected.has(tx.txid)}
                              onCheckedChange={() => toggle(tx.txid)}
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {tx.logo ? (
                                <img
                                  src={tx.logo}
                                  alt={tx.entityName || 'Entity'}
                                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-500 bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-200">
                                    {tx.entityName?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {tx.entityName || 'Unknown Entity'}
                                </div>
                                <div className="text-gray-600 dark:text-gray-300 font-mono text-xs truncate">
                                  {(() => {
                                    const address = tx.direction === 'in' ? tx.inputs?.[0]?.addr : tx.outputs?.[0]?.addr || 'Unknown Address';
                                    return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-6)}` : address;
                                  })()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                              {tx.entityId ? (tx.entityId.slice(0, 12) + (tx.entityId.length > 12 ? '...' : '')) : '-'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                              {tx.amount} {tx.currency}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{tx.usdValue}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {formatDateForDisplay(tx.date, tx.time)}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={`text-xs border ${getRiskColor(tx.riskScore)}`}>
                              {tx.riskScore !== undefined ? `${tx.riskScore}%` : '-'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={`text-xs border ${getEntityTypeColor(tx.entityType)}`}>
                              {formatEntityType(tx.entityType)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={tx.direction === 'in' ? 'default' : 'secondary'}
                              className={`text-xs ${
                                tx.direction === 'in'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600'
                              }`}
                            >
                              {tx.direction === 'in' ? 'In' : 'Out'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-24" title={tx.originalTxHash || tx.txid}>
                                {(tx.originalTxHash || tx.txid).length > 12 ? `${(tx.originalTxHash || tx.txid).slice(0, 6)}...${(tx.originalTxHash || tx.txid).slice(-6)}` : (tx.originalTxHash || tx.txid)}
                              </div>
                              <button
                                onClick={() => copyTxHash(tx.originalTxHash || tx.txid)}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                                title="Copy transaction hash"
                              >
                                <Copy className={`h-3 w-3 ${copiedTxHash === (tx.originalTxHash || tx.txid) ? 'text-green-500' : 'text-gray-600'}`} />
                              </button>
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
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total UTXOs: {total}
            </span>
            {performanceMetrics && (
              <span className="text-xs text-green-600 dark:text-green-400">
                ⚡ {performanceMetrics.apiCallsSaved} API calls saved
              </span>
            )}
            <Button
              onClick={confirm}
              disabled={selected.size === 0}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Confirm Expansion ({selected.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NodeTxPickerOptimized;
