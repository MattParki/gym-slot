import { useState, useEffect } from 'react';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Pagination } from '@/components/ui/pagination';

interface PaginationMetadata {
  hasMore: boolean;
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  total?: number;
}

interface FirebasePaginationProps<T> {
  fetchFunction: (
    lastVisible: QueryDocumentSnapshot<DocumentData> | null,
    pageSize: number,
    ...args: any[]
  ) => Promise<{
    data: T[];
    metadata: PaginationMetadata;
  }>;
  
  renderItems: (items: T[]) => React.ReactNode;
  
  pageSize?: number;
  className?: string;
  paginationClassName?: string;
  paginationMode?: 'pages' | 'infinite';
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  dependencies?: any[];
}

export function FirebasePagination<T>({
  fetchFunction,
  renderItems,
  pageSize = 10,
  className = '',
  paginationClassName = '',
  paginationMode = 'infinite',
  emptyState = <div className="py-10 text-center text-gray-500">No items found</div>,
  loadingState = <div className="py-10 text-center">Loading...</div>,
  dependencies = []
}: FirebasePaginationProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  
  useEffect(() => {
    loadInitialData();
  }, dependencies);
  
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const result = await fetchFunction(null, pageSize);
      
      setItems(result.data);
      setLastVisible(result.metadata.lastVisible);
      setHasMore(result.metadata.hasMore);
      setCurrentPage(1);
      
      // If total count is provided, calculate total pages
      if (result.metadata.total !== undefined) {
        setTotalPages(Math.ceil(result.metadata.total / pageSize));
      } else {
        setTotalPages(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load more data (for infinite scrolling)
  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const result = await fetchFunction(lastVisible, pageSize);
      
      setItems(prev => [...prev, ...result.data]);
      setLastVisible(result.metadata.lastVisible);
      setHasMore(result.metadata.hasMore);
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change (for traditional pagination)
  const handlePageChange = async (page: number) => {
    if (loading || page === currentPage) return;
    
    // For traditional pagination, we'd need to either:
    // 1. Load all pages up to the requested one (for forward navigation)
    // 2. Reset and load from the beginning (for backward navigation)
    
    // This is a simplified approach - in practice you might want to cache pages
    if (page < currentPage) {
      // Going backward - reset and load from start
      setLoading(true);
      setCurrentPage(1);
      await loadInitialData();
      
      // If we're going to a page other than 1, load up to that page
      let curPage = 1;
      let curLastVisible: QueryDocumentSnapshot<DocumentData> | null = null;
      
      while (curPage < page && hasMore) {
        const result = await fetchFunction(curLastVisible, pageSize);
        setItems(prev => [...prev, ...result.data]);
        curLastVisible = result.metadata.lastVisible;
        setHasMore(result.metadata.hasMore);
        curPage++;
      }
      
      setCurrentPage(page);
      setLastVisible(curLastVisible);
      setLoading(false);
    } else {
      while (currentPage < page && hasMore) {
        await loadMore();
      }
    }
  };
  
  return (
    <div className={className}>
      {loading && items.length === 0 ? (
        loadingState
      ) : items.length === 0 ? (
        emptyState
      ) : (
        <>
          {renderItems(items)}
          
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onLoadMore={loadMore}
              hasMore={hasMore}
              loading={loading}
              disabled={loading}
              mode={paginationMode}
              className={paginationClassName}
            />
          </div>
        </>
      )}
    </div>
  );
}