// AttributionContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
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
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, referenceData } = await api.blockchain.getAttributions(addresses);

      const newAttributions = data.reduce((acc: IAttributionMap, curr: IAttribution) => {
        acc[curr.addr] = curr;
        return acc;
      }, {});

      const newReferenceAttributions = referenceData.reduce((acc: ReferenceAttributionMap, curr: IReferenceAttribution) => {
        acc[curr.addr] = curr;
        return acc;
      }, {});

      setAttributions(newAttributions);
      setReferenceAttributions(newReferenceAttributions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch attributions'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AttributionContext.Provider 
      value={{ 
        attributions, 
        referenceAttributions, 
        fetchAttributions,
        isLoading,
        error 
      }}
    >
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