import React, { useMemo } from 'react';
import { PaginationData } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { page, pages, has_prev, has_next, prev_num, next_num, total } = pagination;

  // Generate page numbers to display using useMemo to optimize performance
  const pageNumbers = useMemo(() => {
    const result = [];
    const maxPagesToShow = 7; // Increased for better UX
    
    if (pages <= maxPagesToShow) {
      // If total pages is less than max to show, display all pages
      for (let i = 1; i <= pages; i++) {
        result.push(i);
      }
    } else {
      // Always include first page
      result.push(1);
      
      // Calculate start and end of page range
      let start = Math.max(2, page - Math.floor((maxPagesToShow - 3) / 2));
      let end = Math.min(pages - 1, start + maxPagesToShow - 4);
      
      // Adjust if we're near the end
      if (end === pages - 1) {
        start = Math.max(2, end - (maxPagesToShow - 4));
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        result.push('ellipsis-1');
      }
      
      // Add page numbers
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < pages - 1) {
        result.push('ellipsis-2');
      }
      
      // Always include last page
      if (pages > 1) {
        result.push(pages);
      }
    }
    
    return result;
  }, [page, pages]);

  if (pages <= 1) {
    return null;
  }

  // Handle page change with boundary checks
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pages) {
      onPageChange(newPage);
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      {/* Mobile pagination */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => has_prev && handlePageChange(prev_num)}
          disabled={!has_prev}
          className={`relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
            has_prev 
              ? 'border-primary-300 bg-white text-primary-700 hover:bg-primary-50' 
              : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          aria-label="Previous page"
        >
          Previous
        </button>
        <button
          onClick={() => has_next && handlePageChange(next_num)}
          disabled={!has_next}
          className={`relative ml-3 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
            has_next 
              ? 'border-primary-300 bg-white text-primary-700 hover:bg-primary-50' 
              : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
      
      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{total > 0 ? (page - 1) * pagination.per_page + 1 : 0}</span> to{' '}
            <span className="font-medium">
              {Math.min(page * pagination.per_page, total)}
            </span>{' '}
            of <span className="font-medium">{total}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button */}
            <button
              onClick={() => has_prev && handlePageChange(prev_num)}
              disabled={!has_prev}
              className={`relative inline-flex items-center rounded-l-md px-3 py-2 transition-colors ${
                has_prev
                  ? 'text-primary-600 ring-1 ring-inset ring-gray-300 hover:bg-primary-50 focus:z-20 focus:outline-offset-0'
                  : 'text-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
              aria-label="Previous page"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            
            {/* Page numbers */}
            {pageNumbers.map((pageNum, index) => (
              <React.Fragment key={typeof pageNum === 'number' ? pageNum : `${pageNum}-${index}`}>
                {typeof pageNum === 'string' ? (
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                    &hellip;
                  </span>
                ) : (
                  <button
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold transition-colors ${
                      page === pageNum
                        ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-primary-50 focus:z-20 focus:outline-offset-0'
                    }`}
                    aria-current={page === pageNum ? 'page' : undefined}
                    aria-label={`Page ${pageNum}`}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}
            
            {/* Next button */}
            <button
              onClick={() => has_next && handlePageChange(next_num)}
              disabled={!has_next}
              className={`relative inline-flex items-center rounded-r-md px-3 py-2 transition-colors ${
                has_next
                  ? 'text-primary-600 ring-1 ring-inset ring-gray-300 hover:bg-primary-50 focus:z-20 focus:outline-offset-0'
                  : 'text-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
              aria-label="Next page"
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;