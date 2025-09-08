import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { flowtraceService } from '../../../services/flowtraceService';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { SOT } from '../../../typings/interfaces';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Button } from '../../../components/ui/button';
import { Search, Filter, TrendingUp, CheckSquare, Square, Copy } from 'lucide-react';
import { applyBeneficialOwnerOverride } from '../../../utils/entityUtils';
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
  date?: string; // Formatted date string for display
  // Additional fields from working example
  entityTags?: string[];
  ofac?: boolean;
  isBeneficialOwnerOverride?: boolean;
  displayTitle?: string;
  cospendId?: string;
  transactionCount?: number;
  originalTxHash?: string; // The original transaction hash
}

const NodeTxPicker: React.FC<Props> = ({ open, address, onOpenChange, onAdd, nodeLabel, existingConnections = [] }) => {
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<EnhancedTransaction[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date_desc' | 'date_asc' | 'entity_name' | 'entity_id' | 'risk' | 'amount'>('date_desc');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [groupByEntity, setGroupByEntity] = useState<boolean>(true);
  const [copiedTxHash, setCopiedTxHash] = useState<string | null>(null);

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
      // If aggregated, iterate originals
      if (Array.isArray(c.originalConnections)) {
        c.originalConnections.forEach((oc: any) => collect(oc));
      }
    });

    return { expandedAddresses: addrSet, expandedUtxoKeys: keySet };
  }, [existingConnections, address]);

  // Get SOT data from Redux store
  const itemsMap = useSelector((state: RootState) => state.sot.itemsMap);
  const [localSotData, setLocalSotData] = useState<SOT[]>([]);

  // Copy transaction hash to clipboard
  const copyTxHash = async (txHash: string) => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopiedTxHash(txHash);
      setTimeout(() => setCopiedTxHash(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy transaction hash:', error);
    }
  };


  // Count unique transactions
  const countUniqueTransactions = (transactions: EnhancedTransaction[]): number => {
    const uniqueTxHashes = new Set<string>();
    transactions.forEach(tx => {
      if (tx.originalTxHash) {
        uniqueTxHashes.add(tx.originalTxHash);
      }
    });
    return uniqueTxHashes.size;
  };

  // Cache for historical prices to avoid repeated API calls
  const [historicalPriceCache, setHistoricalPriceCache] = useState<Map<string, number>>(new Map());

  // State to store calculated USD values for transactions
  const [calculatedUsdValues, setCalculatedUsdValues] = useState<Map<string, string>>(new Map());

  // Note: Rate limiting is now handled by the backend service

  // Fetch historical Bitcoin price for a specific date using our backend API
  const fetchHistoricalBtcPrice = async (date: string | number): Promise<number | null> => {
    try {
      let targetDate: string;

      if (typeof date === 'number') {
        // Convert timestamp to date string (YYYY-MM-DD format)
        targetDate = new Date(date * 1000).toISOString().split('T')[0];
      } else {
        // Use the date string directly
        targetDate = date.split('T')[0];
      }

      // Validate date format (should be YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        console.error('Invalid date format:', targetDate);
        return null;
      }

      // Check cache first
      if (historicalPriceCache.has(targetDate)) {
        return historicalPriceCache.get(targetDate)!;
      }

      // Use our backend API instead of direct CoinGecko calls
      const response = await fetch(
        `/api/crypto/historical-price?date=${targetDate}&symbol=BTC`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Historical price not found for ${targetDate}, using fallback price`);
          return null; // Will trigger fallback to current price
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate response structure
      if (typeof data.price !== 'number' || data.price <= 0) {
        console.error('Invalid price data from backend API:', data);
        return null;
      }

      // Cache the result
      setHistoricalPriceCache(prev => new Map(prev).set(targetDate, data.price));

      return data.price;
    } catch (error) {
      console.error('Error fetching historical Bitcoin price:', error);
      return null;
    }
  };

  // Calculate USD value from BTC amount using historical or current prices
  const calculateUsdValue = (btcAmount: number, currency: string = 'BTC'): string => {
    if (currency === 'BTC') {
      // For now, use current price as we don't have historical price API yet
      // TODO: Implement historical price fetching based on transaction date
      const btcPrice = getPrice('BTC');
      if (btcPrice) {
        const usdValue = btcAmount * btcPrice;
        return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        // Fallback to a reasonable price if API is unavailable
        const fallbackPrice = 45000; // $45,000 per BTC
        const usdValue = btcAmount * fallbackPrice;
        return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    } else if (currency === 'USDC' || currency === 'USDT') {
      // For stablecoins, the USD value is the same as the amount
      return `$${btcAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      // For other currencies, return a placeholder
      return '$0.00';
    }
  };

  // Calculate USD value asynchronously using historical prices
  const calculateUsdValueAsync = async (txId: string, btcAmount: number, currency: string = 'BTC', transactionDate?: string | number): Promise<void> => {
    if (currency === 'BTC' && transactionDate) {
      try {
        const historicalPrice = await fetchHistoricalBtcPrice(transactionDate);
        if (historicalPrice) {
          const usdValue = btcAmount * historicalPrice;
          const formattedValue = `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          setCalculatedUsdValues(prev => new Map(prev).set(txId, formattedValue));
        } else {
          // Fallback to current price if historical price fails
          const currentPrice = getPrice('BTC') || 45000;
          const usdValue = btcAmount * currentPrice;
          const formattedValue = `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          setCalculatedUsdValues(prev => new Map(prev).set(txId, formattedValue));
        }
      } catch (error) {
        console.error('Error calculating USD value for transaction:', txId, error);
        // Fallback to current price
        const currentPrice = getPrice('BTC') || 45000;
        const usdValue = btcAmount * currentPrice;
        const formattedValue = `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        setCalculatedUsdValues(prev => new Map(prev).set(txId, formattedValue));
      }
    } else if (currency === 'USDC' || currency === 'USDT') {
      // For stablecoins, the USD value is the same as the amount
      const formattedValue = `$${btcAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      setCalculatedUsdValues(prev => new Map(prev).set(txId, formattedValue));
    }
  };

  // Fetch SOT data when component mounts
  useEffect(() => {
    const fetchSOTData = async () => {
      // If Redux doesn't have SOT data, fetch it directly
      if (!itemsMap || Object.keys(itemsMap).length === 0) {
        console.log('🔄 Fetching SOT data directly...');
        try {
          const sotResponse = await flowtraceService.fetchSOT();
          if (sotResponse && Array.isArray(sotResponse)) {
            setLocalSotData(sotResponse);
            console.log('✅ Fetched SOT data directly:', sotResponse.length, 'entities');
          }
        } catch (error) {
          console.error('❌ Failed to fetch SOT data directly:', error);
        }
      }
    };

    fetchSOTData();
  }, [itemsMap]);

  // Calculate USD values asynchronously when transactions are loaded
  useEffect(() => {
    if (txs.length > 0) {
      txs.forEach(tx => {
        const btcAmount = parseFloat(tx.amount || '0');
        if (btcAmount > 0) {
          calculateUsdValueAsync(tx.txid, btcAmount, tx.currency || 'BTC', tx.time);
        }
      });
    }
  }, [txs]);

  // Pre-select already-expanded addresses only on initial load (when nothing is selected yet)
  useEffect(() => {
    if (!open) return;
    if (selected.size > 0) return; // keep user's manual selection

    const pre = new Set<string>();
    txs.forEach((tx) => {
      const counterparty = tx.direction === 'in' ? tx.inputs?.[0]?.addr : tx.outputs?.[0]?.addr;

      let utxoKey: string | null = null;
      if (tx.direction === 'in') {
        // funds to current node, key uses current address
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

  useEffect(() => {
    const run = async () => {
      if (!open || !address) return;
      setLoading(true);
      try {
        // Debug: Check if SOT data is available
        console.log('🔍 SOT Data Check:');
        console.log('Redux itemsMap:', itemsMap);
        console.log('Redux itemsMap keys:', Object.keys(itemsMap || {}));
        console.log('Local SOT data:', localSotData);

        // Show sample SOT data for debugging
        if (localSotData.length > 0) {
          console.log('📋 Sample SOT data entries:');
          localSotData.slice(0, 3).forEach((item, index) => {
            console.log(`  ${index + 1}. Entity ID: ${item.entity_id}, Name: ${item.proper_name}, Type: ${item.entity_type}`);
          });

          // Search for wrapped bitcoin entries
          const exactMatch = localSotData.find(e => e.entity_id === 'wrapped_bitcoin');
          const wbtcEntries = localSotData.filter(e =>
            e.entity_id?.toLowerCase().includes('wbtc') ||
            e.proper_name?.toLowerCase().includes('wbtc')
          );
          const wrappedEntries = localSotData.filter(e =>
            e.entity_id?.toLowerCase().startsWith('wrapped') ||
            e.proper_name?.toLowerCase().startsWith('wrapped')
          );
          const bitcoinEntries = localSotData.filter(e =>
            e.entity_id?.toLowerCase().includes('bitcoin') ||
            e.proper_name?.toLowerCase().includes('bitcoin')
          );

          console.warn('🔍 COMPREHENSIVE WRAPPED BITCOIN SEARCH:', {
            totalSOTEntries: localSotData.length,
            exactMatch: exactMatch ? {
              entity_id: exactMatch.entity_id,
              proper_name: exactMatch.proper_name,
              entity_type: exactMatch.entity_type
            } : 'NOT FOUND',
            wbtcEntries: wbtcEntries.slice(0, 5).map(e => ({
              entity_id: e.entity_id,
              proper_name: e.proper_name,
              entity_type: e.entity_type
            })),
            wrappedEntries: wrappedEntries.slice(0, 5).map(e => ({
              entity_id: e.entity_id,
              proper_name: e.proper_name,
              entity_type: e.entity_type
            })),
            bitcoinEntries: bitcoinEntries.slice(0, 5).map(e => ({
              entity_id: e.entity_id,
              proper_name: e.proper_name,
              entity_type: e.entity_type
            }))
          });
        }

        // Use fetchAllTransactions to get all transactions for the address
        const resp = await flowtraceService.fetchAllTransactions(address, 100).catch(() => ({ txs: [], pagination: { totalTxs: 0 } } as any));

        // Show both UTXOs (address in outputs) and spending transactions (address in inputs)
        const allTransactions = (resp as any)?.txs || [];
        console.log('📊 Raw transactions:', allTransactions.slice(0, 2)); // Log first 2 transactions

        // Debug: Check what date fields are available in transaction data
        if (allTransactions.length > 0) {
          const sampleTx = allTransactions[0];
          console.log('🔍 Sample transaction date fields:', {
            timestamp: sampleTx.timestamp,
            time: sampleTx.time,
            block_date: sampleTx.block_date,
            block: sampleTx.block,
            hasTimestamp: !!sampleTx.timestamp,
            hasTime: !!sampleTx.time,
            hasBlockDate: !!sampleTx.block_date
          });
        }

        // If no SOT data in Redux, try to fetch it directly
        let sotDataToUse = itemsMap;
        if (!itemsMap || Object.keys(itemsMap).length === 0) {
          console.log('⚠️ No SOT data in Redux, using local data...');
          if (localSotData.length > 0) {
            const sotMap = localSotData.reduce((acc, item) => {
              acc[item.entity_id] = item;
              return acc;
            }, {} as Record<string, any>);
            sotDataToUse = sotMap;
            console.log('✅ Using local SOT data:', localSotData.length, 'entities');
          } else {
            console.log('⚠️ No local SOT data either, fetching now...');
            try {
              const sotResponse = await flowtraceService.fetchSOT();
              if (sotResponse && Array.isArray(sotResponse)) {
                const sotMap = sotResponse.reduce((acc, item) => {
                  acc[item.entity_id] = item;
                  return acc;
                }, {} as Record<string, any>);
                setLocalSotData(sotResponse);
                sotDataToUse = sotMap;
                console.log('✅ Fetched SOT data directly:', sotResponse.length, 'entities');
              }
            } catch (error) {
              console.error('❌ Failed to fetch SOT data directly:', error);
            }
          }
        }

        // Get all unique addresses from transactions for attribution and risk scoring
        const allAddresses = new Set<string>();
        allTransactions.forEach((tx: any) => {
          (tx.inputs || []).forEach((i: any) => allAddresses.add(i.addr));
          (tx.outputs || []).forEach((o: any) => allAddresses.add(o.addr));
        });

        console.log('📍 Unique addresses found:', Array.from(allAddresses));

        // STEP 1: Fetch attribution data to map addresses to entities
        let addressEntities: Record<string, any> = {};
        let addressLogos: Record<string, string> = {};

        if (allAddresses.size > 0) {
          try {
            console.log('🔄 Fetching attribution data for addresses...');
            const attributionResponse = await flowtraceService.fetchAttribution(Array.from(allAddresses));
            console.log('📊 Raw attribution response:', attributionResponse);

            if (attributionResponse && attributionResponse.data) {
              attributionResponse.data.forEach((item: any) => {
                const address = item.address || item.addr;
                if (address && item.entity) {
                  // Store entity identifiers
                  addressEntities[address] = {
                    name: item.entity_proper_name || item.entity,
                    entity: item.entity,
                    bo: item.bo,
                    cospend_id: item.cospend_id || address
                  };

                  // Extract logo if available
                  if (item.logo) {
                    addressLogos[address] = item.logo;
                  }
                }
              });
            }

            console.log('✅ Attribution data loaded for', Object.keys(addressEntities).length, 'addresses');
            console.log('📋 Address entities mapping:', addressEntities);
            console.log('🖼️ Address logos mapping:', addressLogos);
          } catch (error) {
            console.error('❌ Error fetching attribution data:', error);
            console.log('⚠️ Continuing without attribution data...');
          }
        }

        // STEP 2: Batch fetch risk scores for all addresses
        const addressRiskScores: Record<string, number> = {};
        try {
          const riskPromises = Array.from(allAddresses).map(async (addr) => {
            try {
              const riskResponse = await flowtraceService.fetchRiskScore(addr, 'address');
              const score = riskResponse.data?.overallRisk ? Math.round(riskResponse.data.overallRisk * 100) : undefined;
              return { address: addr, score };
            } catch (error) {
              console.log(`Could not fetch risk score for address: ${addr}`);
              return { address: addr, score: undefined };
            }
          });

          const riskResults = await Promise.all(riskPromises);
          riskResults.forEach(({ address, score }) => {
            if (score !== undefined) {
              addressRiskScores[address] = score;
            }
          });
        } catch (error) {
          console.log('Batch risk scoring failed, continuing without risk data');
        }

        // STEP 3: Enhance transactions with entity and risk information
        // Create individual rows for each input/output to show all UTXOs (like working example)
        const enhancedTxs: EnhancedTransaction[] = [];

        allTransactions.forEach((tx: any, index: number) => {
          // Check if address is in inputs (spending) or outputs (receiving)
          const nodeInInputs = (tx.inputs || []).some((inp: any) => inp.addr === address);
          const nodeInOutputs = (tx.outputs || []).some((out: any) => out.addr === address);

          // Determine the primary direction of the transaction for this node
          // If node appears in both inputs and outputs, prioritize based on context
          let transactionDirection: 'in' | 'out' | null = null;

          if (nodeInInputs && nodeInOutputs) {
            // Node appears in both inputs and outputs - this is unusual but possible
            // Determine direction based on the primary flow context
            const inputAmount = (tx.inputs || []).reduce((sum: number, inp: any) =>
              inp.addr === address ? sum + (inp.amt || 0) : sum, 0) || 0;
            const outputAmount = (tx.outputs || []).reduce((sum: number, out: any) =>
              out.addr === address ? sum + (out.amt || 0) : sum, 0) || 0;

            // If more money flowed OUT than IN, treat as outgoing
            if (inputAmount > outputAmount) {
              transactionDirection = 'out';
              console.log(`Transaction ${tx.txid}: Node in both inputs/outputs, treating as OUT (input: ${inputAmount}, output: ${outputAmount})`);
            } else {
              transactionDirection = 'in';
              console.log(`Transaction ${tx.txid}: Node in both inputs/outputs, treating as IN (input: ${inputAmount}, output: ${outputAmount})`);
            }
          } else if (nodeInInputs) {
            transactionDirection = 'out';
          } else if (nodeInOutputs) {
            transactionDirection = 'in';
          }

          // Skip if we couldn't determine direction
          if (!transactionDirection) {
            console.log(`Transaction ${tx.txid}: Could not determine direction for node ${address}`);
            return;
          }

          // Handle incoming transactions (money flowing TO the current node)
          if (transactionDirection === 'in') {
            const inputs = Array.isArray(tx.inputs) ? tx.inputs : [];
            const externalInputs = inputs.filter((i: any) => i?.addr && i.addr !== address);

            externalInputs.forEach((i: any, inIndex: number) => {
              const inputAddress = i.addr || 'Unknown';
              const entityData = addressEntities[inputAddress];
              const rawEntityName = entityData?.name || 'Unknown Entity';
              const entityId = rawEntityName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
              const cospendId = entityData?.cospend_id || inputAddress;

              // Use SOT data if available, otherwise fallback to basic formatting
              let entityName = rawEntityName ? rawEntityName.charAt(0).toUpperCase() + rawEntityName.slice(1) : 'Unknown Entity';
              let entityType = 'wallet' as const;
              let entityTags: string[] = [];
              let logo = addressLogos[inputAddress];

              if (sotDataToUse && Object.keys(sotDataToUse).length > 0) {
                const entitySOT = Object.values(sotDataToUse).find((s: any) => s.entity_id?.toLowerCase() === (entityData?.entity || '').toLowerCase());
                const boSOT = entityData?.bo ? Object.values(sotDataToUse).find((s: any) => s.entity_id?.toLowerCase() === (entityData.bo || '').toLowerCase()) : undefined;

                if (entitySOT || boSOT) {
                  const override = applyBeneficialOwnerOverride(
                    {
                      entity: entityData?.entity || rawEntityName,
                      bo: entityData?.bo || '',
                      custodian: '',
                      cospend_id: cospendId
                    },
                    entitySOT,
                    boSOT
                  );
                  entityName = override.displayTitle || override.entityName;
                  entityType = (override.entityType as any) || entityType;
                  entityTags = override.entityTags || [];
                  logo = override.logo || logo;
                }
              }

              const risk = addressRiskScores[inputAddress] || 0;
              const inputAmountBtc = (i.amt || 0) / 100000000;

              // Create one row per input (UTXO)
              const transaction: EnhancedTransaction = {
                txid: `tx_in_${index}_${inIndex}`,
                time: tx.timestamp || tx.time || 0,
                inputs: [i],
                outputs: tx.outputs || [],
                entityName,
                entityId,
                entityType,
                logo,
                riskScore: risk,
                amount: inputAmountBtc.toFixed(8),
                currency: 'BTC',
                direction: 'in',
                usdValue: calculateUsdValue(inputAmountBtc, 'BTC'),
                date: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString().split('T')[0] : 'Unknown',
                entityTags,
                ofac: false, // Placeholder
                isBeneficialOwnerOverride: false, // Placeholder
                displayTitle: entityName,
                cospendId,
                transactionCount: (tx.inputs?.length || 0) + (tx.outputs?.length || 0), // Total UTXOs in the original transaction
                originalTxHash: tx.txid // Store the original transaction hash
              };

              enhancedTxs.push(transaction);
            });
          }

          // Handle outgoing transactions (money flowing FROM the current node)
          if (transactionDirection === 'out') {
            const outputs = Array.isArray(tx.outputs) ? tx.outputs : [];
            const externalOutputs = outputs.filter((o: any) => o?.addr && o.addr !== address);

            externalOutputs.forEach((o: any, outIndex: number) => {
              const outputAddress = o.addr || 'Unknown';
              const entityData = addressEntities[outputAddress];
              const rawEntityName = entityData?.name || 'Unknown Entity';
              const entityId = rawEntityName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
              const cospendId = entityData?.cospend_id || outputAddress;

              // Use SOT data if available, otherwise fallback to basic formatting
              let entityName = rawEntityName ? rawEntityName.charAt(0).toUpperCase() + rawEntityName.slice(1) : 'Unknown Entity';
              let entityType = 'wallet' as const;
              let entityTags: string[] = [];
              let logo = addressLogos[outputAddress];

              if (sotDataToUse && Object.keys(sotDataToUse).length > 0) {
                const entitySOT = Object.values(sotDataToUse).find((s: any) => s.entity_id?.toLowerCase() === (entityData?.entity || '').toLowerCase());
                const boSOT = entityData?.bo ? Object.values(sotDataToUse).find((s: any) => s.entity_id?.toLowerCase() === (entityData.bo || '').toLowerCase()) : undefined;

                if (entitySOT || boSOT) {
                  const override = applyBeneficialOwnerOverride(
                    {
                      entity: entityData?.entity || rawEntityName,
                      bo: entityData?.bo || '',
                      custodian: '',
                      cospend_id: cospendId
                    },
                    entitySOT,
                    boSOT
                  );
                  entityName = override.displayTitle || override.entityName;
                  entityType = (override.entityType as any) || entityType;
                  entityTags = override.entityTags || [];
                  logo = override.logo || logo;
                }
              }

              const risk = addressRiskScores[outputAddress] || 0;
              const outputAmountBtc = (o.amt || 0) / 100000000;

              // Create one row per output (UTXO)
              const transaction: EnhancedTransaction = {
                txid: `tx_out_${index}_${outIndex}`,
                time: tx.timestamp || tx.time || 0,
                inputs: tx.inputs || [],
                outputs: [o],
                entityName,
                entityId,
                entityType,
            logo,
                riskScore: risk,
                amount: outputAmountBtc.toFixed(8),
            currency: 'BTC',
                direction: 'out',
                            usdValue: calculateUsdValue(outputAmountBtc, 'BTC'),
                date: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString().split('T')[0] : 'Unknown',
                entityTags,
                ofac: false, // Placeholder
                isBeneficialOwnerOverride: false, // Placeholder
                displayTitle: entityName,
                cospendId,
                transactionCount: (tx.inputs?.length || 0) + (tx.outputs?.length || 0), // Total UTXOs in the original transaction
                originalTxHash: tx.txid // Store the original transaction hash
              };

              enhancedTxs.push(transaction);
            });
          }

          console.log(`📝 Enhanced transaction ${tx.txid}: created ${(tx.inputs?.length || 0) + (tx.outputs?.length || 0)} rows`);
        });

        setTxs(enhancedTxs);
        setTotal(enhancedTxs.length);

        console.log(`NodeTxPicker: Found ${enhancedTxs.length} UTXOs for address ${address}`);
        console.log('Enhanced UTXOs:', enhancedTxs.slice(0, 3)); // Log first 3 for debugging

        // Log data availability summary
        const dataSummary = {
          totalUTXOs: enhancedTxs.length,
          withEntityName: enhancedTxs.filter((tx: EnhancedTransaction) => tx.entityName && tx.entityName !== 'Unknown Entity').length,
          withEntityId: enhancedTxs.filter((tx: EnhancedTransaction) => tx.entityId && tx.entityId !== 'Unknown').length,
          withEntityType: enhancedTxs.filter((tx: EnhancedTransaction) => tx.entityType && tx.entityType !== 'unknown').length,
          withRiskScore: enhancedTxs.filter((tx: EnhancedTransaction) => tx.riskScore !== undefined).length,
          withLogo: enhancedTxs.filter((tx: EnhancedTransaction) => tx.logo).length
        };
        console.log('Data availability summary:', dataSummary);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, address, itemsMap]);

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
    let filtered = txs.filter(tx => {
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

  // Group transactions by entity if grouping is enabled
  const groupedTransactions = useMemo(() => {
    if (!groupByEntity) return null;

    const groups: Record<string, EnhancedTransaction[]> = {};
    filteredTxs.forEach(tx => {
      const key = tx.entityName || tx.entityId || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    return groups;
  }, [filteredTxs, groupByEntity]);



  // Helper functions for styling
  // Use higher-contrast colors so that text is always clearly legible against its background
  const getRiskColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-500 text-white border-gray-600';
    if (score > 70) return 'bg-red-600 text-white border-red-700';
    if (score > 40) return 'bg-yellow-500 text-white border-yellow-600';
    return 'bg-green-600 text-white border-green-700';
  };

  const getEntityTypeColor = (type: string | undefined) => {
    if (!type) return 'bg-gray-500 text-white border-gray-600';
    const colors: Record<string, string> = {
      'exchange': 'bg-blue-600 text-white border-blue-700',
      'wallet': 'bg-green-600 text-white border-green-700',
      'mixer': 'bg-red-600 text-white border-red-700',
      'defi': 'bg-purple-600 text-white border-purple-700',
      'service': 'bg-orange-600 text-white border-orange-700',
      'csam': 'bg-red-700 text-white border-red-800',
      'gambling': 'bg-yellow-600 text-white border-yellow-700',
      'mining': 'bg-cyan-600 text-white border-cyan-700',
      'unknown': 'bg-gray-500 text-white border-gray-600'
    };
    return colors[type.toLowerCase()] || 'bg-gray-500 text-white border-gray-600';
  };

  // Generate consistent colors for TXIDs
  const getTxidColor = (txid: string) => {
    // Create a better hash from the TXID to reduce collisions
    let hash = 0;
    for (let i = 0; i < txid.length; i++) {
      const char = txid.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use absolute value and modulo to get a positive number
    const colorIndex = Math.abs(hash) % 12;

    const colors = [
      'bg-blue-50/20 dark:bg-blue-950/15 border-blue-200/30 dark:border-blue-800/30 text-gray-900 dark:text-gray-900',
      'bg-green-50/20 dark:bg-green-950/15 border-green-200/30 dark:border-green-800/30 text-gray-900 dark:text-gray-900',
      'bg-yellow-50/20 dark:bg-yellow-950/15 border-yellow-200/30 dark:border-yellow-800/30 text-gray-900 dark:text-gray-900',
      'bg-purple-50/20 dark:bg-purple-950/15 border-purple-200/30 dark:border-purple-800/30 text-gray-900 dark:text-gray-900',
      'bg-pink-50/20 dark:bg-pink-950/15 border-pink-200/30 dark:border-pink-800/30 text-gray-900 dark:text-gray-900',
      'bg-indigo-50/20 dark:bg-indigo-950/15 border-indigo-200/30 dark:border-indigo-800/30 text-gray-900 dark:text-gray-900',
      'bg-orange-50/20 dark:bg-orange-950/15 border-orange-200/30 dark:border-orange-800/30 text-gray-900 dark:text-gray-900',
      'bg-cyan-50/20 dark:bg-cyan-950/15 border-cyan-200/30 dark:border-cyan-800/30 text-gray-900 dark:text-gray-900',
      'bg-red-50/20 dark:bg-red-950/15 border-red-200/30 dark:border-red-800/30 text-gray-900 dark:text-gray-900',
      'bg-emerald-50/20 dark:bg-emerald-950/15 border-emerald-200/30 dark:border-emerald-800/30 text-gray-900 dark:text-gray-900',
      'bg-violet-50/20 dark:bg-violet-950/15 border-violet-200/30 dark:border-violet-800/30 text-gray-900 dark:text-gray-900',
      'bg-amber-50/20 dark:bg-amber-950/15 border-amber-200/30 dark:border-amber-800/30 text-gray-900 dark:text-gray-900'
    ];

    return colors[colorIndex];
  };

  const formatEntityType = (type: string | undefined) => {
    if (!type) return 'Unknown';

    // Convert to title case and handle common abbreviations
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
                  <span className="text-gray-500">Loading UTXOs...</span>
                </div>
              </div>
            ) : filteredTxs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No UTXOs found
              </div>
            ) : groupByEntity && groupedTransactions ? (
              // Grouped display
              <div className="space-y-4">
                {Object.entries(groupedTransactions).map(([entityKey, txs]) => (
                  <div key={entityKey} className="border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {/* Entity Header */}
                    <div
                      className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                      style={{
                        position: 'sticky',
                        top: '0px',
                        zIndex: 20,
                        backgroundColor: 'inherit'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {txs[0]?.logo ? (
                          <img
                            src={txs[0].logo}
                            alt={txs[0].entityName}
                            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-900">
                              {txs[0]?.entityName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-900 text-lg">
                            {txs[0]?.entityName || 'Unknown Entity'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-900">
                            {txs[0]?.entityType || 'Unknown Type'} · {txs[0]?.entityId || 'Unknown ID'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allSelected = txs.every(tx => selected.has(tx.txid));
                            const newSelected = new Set(selected);
                            txs.forEach(tx => {
                              if (allSelected) {
                                newSelected.delete(tx.txid);
                              } else {
                                newSelected.add(tx.txid);
                              }
                            });
                            setSelected(newSelected);
                          }}
                          className="h-8 px-3 text-sm"
                        >
                          {txs.every(tx => selected.has(tx.txid)) ? 'Deselect All' : 'Select All'}
                        </Button>
                        <Badge variant="outline" className="text-sm text-gray-800 dark:text-gray-900">
                          {countUniqueTransactions(txs)} TX · {txs.length} UTXOs
                        </Badge>
                      </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="p-4">
                      <table className="w-full">
                        <thead
                          className="bg-gray-100 dark:bg-gray-700 shadow-sm"
                          style={{
                            position: 'sticky',
                            top: '0px',
                            zIndex: 10
                          }}
                        >
                          <tr
                            className="border-b border-gray-200 dark:border-gray-600"
                          >
                            <th
                              className="text-left p-3 w-12 text-gray-700 dark:text-gray-100 font-medium"
                            >
                              <Checkbox
                                checked={txs.every(tx => selected.has(tx.txid))}
                                onCheckedChange={() => {
                                  const allSelected = txs.every(tx => selected.has(tx.txid));
                                  const newSelected = new Set(selected);
                                  txs.forEach(tx => {
                                    if (allSelected) {
                                      newSelected.delete(tx.txid);
                                    } else {
                                      newSelected.add(tx.txid);
                                    }
                                  });
                                  setSelected(newSelected);
                                }}
                                className="h-4 w-4"
                              />
                            </th>
                            <th
                              className="text-left p-3 w-28 text-gray-700 dark:text-gray-100 font-medium"
                            >Entity Name</th>
                            <th
                              className="text-left p-3 w-28 text-gray-700 dark:text-gray-100 font-medium"
                            >Entity ID</th>
                            <th
                              className="text-left p-3 w-28 text-gray-700 dark:text-gray-100 font-medium"
                            >Amount</th>
                            <th
                              className="text-left p-3 w-24 text-gray-700 dark:text-gray-100 font-medium"
                            >Date</th>
                            <th
                              className="text-left p-3 w-16 text-gray-700 dark:text-gray-100 font-medium"
                            >Risk</th>
                            <th
                              className="text-left p-3 w-20 text-gray-700 dark:text-gray-100 font-medium"
                            >Type</th>
                            <th
                              className="text-left p-3 w-20 text-gray-700 dark:text-gray-100 font-medium"
                            >Direction</th>
                            <th
                              className="text-left p-3 w-28 text-gray-700 dark:text-gray-100 font-medium"
                            >TXID</th>
                          </tr>
                        </thead>

                        <tbody>
                          {txs.map((tx) => (
                            <tr
                              key={tx.txid}
                              className={`border-b border-gray-100 dark:border-gray-700 hover:opacity-80 transition-colors ${getTxidColor(tx.originalTxHash || tx.txid)}`}
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
                                      className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                      <span className="text-xs font-medium text-gray-800 dark:text-gray-900">
                                        {tx.entityName?.charAt(0).toUpperCase() || '?'}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-900 text-sm">
                                      {tx.entityName || 'Unknown Entity'}
                                    </div>
                                    <div className="text-gray-800 dark:text-gray-900 font-mono text-xs truncate">
                                      {(() => {
                                        const address = tx.direction === 'in' ? tx.inputs?.[0]?.addr : tx.outputs?.[0]?.addr || 'Unknown Address';
                                        return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-6)}` : address;
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-mono text-sm text-gray-800 dark:text-gray-900">
                                  {tx.entityId ? (tx.entityId.length > 12 ? `${tx.entityId.slice(0, 6)}...${tx.entityId.slice(-6)}` : tx.entityId) : '-'}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="text-gray-900 dark:text-gray-900">
                                  {tx.amount} {tx.currency}
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  {calculatedUsdValues.get(tx.txid) || tx.usdValue}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="text-sm text-gray-900 dark:text-gray-900">
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
                                  <div className="font-mono text-xs text-gray-800 dark:text-gray-900 truncate max-w-24" title={tx.originalTxHash || tx.txid}>
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
                ))}
              </div>
            ) : (
              // Ungrouped display (styled as card)
              <div className="border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div
                  className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                  style={{
                    position: 'sticky',
                    top: '0px',
                    zIndex: 20,
                    backgroundColor: 'inherit'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📋</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-900 text-lg">
                          All Transactions
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {filteredTxs.length} UTXOs from {countUniqueTransactions(filteredTxs)} transactions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleAll}
                        className="h-8 px-3 text-sm"
                      >
                        {selected.size === filteredTxs.length && filteredTxs.length > 0 ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Badge variant="outline" className="text-sm text-gray-800 dark:text-gray-900">
                        {countUniqueTransactions(filteredTxs)} TX · {filteredTxs.length} UTXOs
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <table className="w-full">
                <thead
                  className="bg-gray-100 dark:bg-gray-700 shadow-sm"
                  style={{
                    position: 'sticky',
                    top: '0px',
                    zIndex: 10
                  }}
                >
                  <tr
                    className="border-b border-gray-200 dark:border-gray-600"
                  >
                    <th
                      className="text-left p-3 w-12 text-gray-700 dark:text-gray-100 font-medium"
                    >
                      <Checkbox
                        checked={selected.size === filteredTxs.length && filteredTxs.length > 0}
                        onCheckedChange={toggleAll}
                        className="h-4 w-4"
                      />
                    </th>
                    <th
                      className="text-left p-3 w-28 text-gray-700 dark:text-gray-100 font-medium"
                    >Entity Name</th>
                    <th
                      className="text-left p-3 w-28 text-gray-700 dark:text-gray-100 font-medium"
                    >Entity ID</th>
                    <th
                      className="text-left p-3 w-28 text-gray-700 dark:text-gray-100 font-medium"
                    >Amount</th>
                    <th
                      className="text-left p-3 w-24 text-gray-700 dark:text-gray-100 font-medium"
                    >Date</th>
                    <th
                      className="text-left p-3 w-16 text-gray-700 dark:text-gray-100 font-medium"
                    >Risk</th>
                    <th
                      className="text-left p-3 w-20 text-gray-700 dark:text-gray-100 font-medium"
                    >Type</th>
                    <th
                      className="text-left p-3 w-20 text-gray-700 dark:text-gray-100 font-medium"
                    >Direction</th>
                    <th
                      className="text-left p-3 w-28 text-gray-700 dark:text-gray-100 font-medium"
                    >TXID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map((tx) => (
                    <tr
                      key={tx.txid}
                      className={`border-b border-gray-100 dark:border-gray-700 hover:opacity-80 transition-colors ${getTxidColor(tx.originalTxHash || tx.txid)}`}
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
                            <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-900">
                                {tx.entityName?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-900 truncate">
                              {tx.entityName || 'Unknown Entity'}
                            </div>
                            <div className="text-gray-800 dark:text-gray-900 font-mono text-xs truncate">
                              {(() => {
                                const address = tx.direction === 'in' ? tx.inputs?.[0]?.addr : tx.outputs?.[0]?.addr || 'Unknown Address';
                                return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-6)}` : address;
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-sm text-gray-800 dark:text-gray-900">
                          {tx.entityId ? (tx.entityId.slice(0, 12) + (tx.entityId.length > 12 ? '...' : '')) : '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-sm text-gray-900 dark:text-gray-900">
                          {tx.amount} {tx.currency}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">{calculatedUsdValues.get(tx.txid) || tx.usdValue}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-900 dark:text-gray-900">
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
                          <div className="font-mono text-xs text-gray-800 dark:text-gray-900 truncate max-w-24" title={tx.originalTxHash || tx.txid}>
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

export default NodeTxPicker;


