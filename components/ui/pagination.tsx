import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number | null;
  onPageChange: (page: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  disabled?: boolean;
  mode?: 'pages' | 'infinite';
  className?: string;
}

export function Pagination({ 
  currentPage, 
  totalPages = null, 
  onPageChange, 
  onLoadMore,
  hasMore = false,
  loading = false,
  disabled = false,
  mode = 'infinite',
  className = ''
}: PaginationProps) {
  // For infinite scroll / load more pattern
  if (mode === 'infinite') {
    return (
      <div className={`flex justify-center ${className}`}>
        {hasMore && (
          <Button
            variant="outline"
            disabled={loading || !hasMore}
            onClick={onLoadMore}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        )}
      </div>
    );
  }
  
  // For traditional pagination with page numbers
  if (!totalPages) return null;
  
  // On mobile, we show simplified pagination
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  if (isMobile) {
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={loading || currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm px-2">
          Page {currentPage} of {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={loading || currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  // For desktop, show page numbers and ellipses
  // Generate page numbers to show (simplified)
  const pageNumbers = [];
  
  pageNumbers.push(1);
  
  if (currentPage > 3) {
    pageNumbers.push('ellipsis');
  }
  
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (i !== 1 && i !== totalPages) {
      pageNumbers.push(i);
    }
  }
  
  // If not on last few pages, show ellipsis
  if (currentPage < totalPages - 2) {
    pageNumbers.push('ellipsis');
  }
  
  // Always show last page if more than one page
  if (totalPages > 1) {
    pageNumbers.push(totalPages);
  }
  
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={loading || currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <Button
              key={`ellipsis-${index}`}
              variant="outline"
              size="sm"
              disabled
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }
        
        const pageNum = page as number;
        
        return (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            disabled={loading}
          >
            {pageNum}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={loading || currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}