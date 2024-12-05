import { useState, useCallback, useEffect } from 'react';
import { IAttribution, IAttributionMap, IReferenceAttribution, ReferenceAttributionMap } from '../typings/ReferenceAttribution';
import { api } from '../api/api';
  
const useAttribution = () => {
  const [attributions, setAttributions] = useState<IAttributionMap>();
  const [referenceAttributions, setReferenceAttributions] = useState<ReferenceAttributionMap>();
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

  useEffect(() => {
    console.log('fetched data', attributions, referenceAttributions);
  }, [attributions, referenceAttributions]);

  return { 
    attributions, 
    referenceAttributions, 
    fetchAttributions,
    isLoading,
    error
  };
};

export default useAttribution;