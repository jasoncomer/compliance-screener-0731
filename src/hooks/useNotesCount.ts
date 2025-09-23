import { useCallback,useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import { notesApi } from '../api/notes';
import { selectCurrentOrganization } from '../store/slices/organizationsSlice';

export type NoteContextType = 'transaction' | 'address' | 'cluster';

interface UseNotesCountOptions {
  contextType: NoteContextType;
  contextId?: string;
  enabled?: boolean;
}

export const useNotesCount = ({ contextType, contextId, enabled = true }: UseNotesCountOptions) => {
  const [totalNotesCount, setTotalNotesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentOrganization = useSelector(selectCurrentOrganization);

  const fetchNotesCount = useCallback(async () => {
    if (!enabled || !currentOrganization || !contextId) {
      setTotalNotesCount(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      switch (contextType) {
        case 'transaction':
          response = await notesApi.getTransactionNotes(currentOrganization._id, contextId);
          break;
        case 'address':
          response = await notesApi.getAddressNotes(currentOrganization._id, contextId);
          break;
        case 'cluster':
          response = await notesApi.getClusterNotes(currentOrganization._id, contextId);
          break;
        default:
          throw new Error(`Unsupported context type: ${contextType}`);
      }
      
      setTotalNotesCount(response.data?.length || 0);
    } catch (err) {
      console.error('Failed to fetch notes count:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notes count');
      setTotalNotesCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, contextType, contextId, enabled]);

  // Fetch notes count when dependencies change
  useEffect(() => {
    fetchNotesCount();
  }, [fetchNotesCount]);

  return {
    totalNotesCount,
    loading,
    error,
    refetch: fetchNotesCount
  };
};

export default useNotesCount;
