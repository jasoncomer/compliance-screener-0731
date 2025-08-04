// AttributionContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { IAttributionMap, ReferenceAttributionMap, IAttribution, IReferenceAttribution } from '../typings/ReferenceAttribution';
import { api } from '../api/api';

interface AttributionContextType {
  attributions: IAttributionMap;
  referenceAttributions: ReferenceAttributionMap;
  fetchAttributions: (addresses: string[]) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const AttributionContext = createContext<AttributionContextType | undefined>(undefined);

export const AttributionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [attributions, setAttributions] = useState<IAttributionMap>({});
  const [referenceAttributions, setReferenceAttributions] = useState<ReferenceAttributionMap>({});
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttributions = useCallback(async (addresses: string[]) => {
    if (addresses.length === 0) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, referenceData } = await api.blockchain.getAttributions(addresses);

      const newAttributions = data.reduce((acc: IAttributionMap, curr: IAttribution) => {
        acc[curr.addr] = curr;
        return acc;
      }, {});

      // Debug: Log attribution data to see if cospend IDs are present
      console.log('Attribution data received:', {
        totalAttributions: data.length,
        sampleAttributions: data.slice(0, 3).map(attr => ({
          addr: attr.addr,
          cospend_id: attr.cospend_id,
          entity: attr.entity,
          bo: attr.bo,
          custodian: attr.custodian
        }))
      });

      const newReferenceAttributions = referenceData.reduce((acc: ReferenceAttributionMap, curr: IReferenceAttribution) => {
        acc[curr.address] = curr;
        return acc;
      }, {});

      setAttributions(prev => ({ ...prev, ...newAttributions }));
      setReferenceAttributions(prev => ({ ...prev, ...newReferenceAttributions }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch attributions'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    attributions,
    referenceAttributions,
    fetchAttributions,
    isLoading,
    error
  }), [attributions, referenceAttributions, fetchAttributions, isLoading, error]);

  return (
    <AttributionContext.Provider value={contextValue}>
      {children}
    </AttributionContext.Provider>
  );
};

// Modified hook
export const useAttribution = () => {
  const context = useContext(AttributionContext);
  if (!context) {
    throw new Error('useAttribution must be used within an AttributionProvider');
  }
  return context;
};