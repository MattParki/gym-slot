import { useState, useEffect, useCallback } from 'react';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { getPaginatedClients } from '@/services/clientService';

export function useClientPagination(userId: string, pageSize = 10, statusFilter: string | null = null) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async (resetPagination = false) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    if (resetPagination) {
      setClients([]);
      setLastVisible(null);
    }
    
    try {
      const result = await getPaginatedClients(userId, {
        pageSize,
        lastVisible: resetPagination ? null : lastVisible,
        statusFilter: statusFilter === 'all' ? null : statusFilter,
        searchQuery: searchQuery.trim() !== '' ? searchQuery : null,
      });
      
      if (resetPagination) {
        setClients(result.data);
      } else {
        // Otherwise, append to existing clients
        setClients(prev => [...prev, ...result.data]);
      }
      
      setLastVisible(result.metadata.lastVisible);
      setHasMore(result.metadata.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, pageSize, statusFilter, lastVisible, searchQuery]);
  
  // Load initial data when dependencies change
  useEffect(() => {
    loadData(true);
  }, [userId, statusFilter, pageSize]);
  
  // Handle search with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set a new timeout for the search
    const timeout = setTimeout(() => {
      loadData(true);
    }, 300);
    
    setSearchTimeout(timeout);
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);
  
  const loadMore = async () => {
    if (!hasMore || loading || !userId) return;
    await loadData(false);
  };
  
  const resetPagination = () => {
    loadData(true);
  };
  
  return {
    clients,
    loading,
    hasMore,
    error,
    loadMore,
    setSearchQuery,
    searchQuery,
    resetPagination
  };
}