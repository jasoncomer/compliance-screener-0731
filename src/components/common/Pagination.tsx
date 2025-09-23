import React from 'react';

import { cn } from '../../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-4 text-sm text-gray-700 dark:text-gray-400">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "px-3 py-2 border rounded min-w-10 transition-all duration-200",
          "bg-white dark:bg-gray-800",
          "text-gray-700 dark:text-gray-400",
          "border-gray-300 dark:border-gray-700",
          "disabled:bg-gray-100 dark:disabled:bg-gray-900",
          "disabled:text-gray-400 dark:disabled:text-gray-600",
          "disabled:cursor-not-allowed disabled:border-gray-200 dark:disabled:border-gray-800",
          "hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600",
          "disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-900 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-800"
        )}
      >
        ←
      </button>
      
      {getPageNumbers().map((page, index) => (
        typeof page === 'number' ? (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={cn(
              "px-3 py-2 border rounded min-w-10 transition-all duration-200",
              page === currentPage ? [
                "bg-brand-primary text-white border-brand-primary",
                "hover:bg-brand-primary-dark hover:border-brand-primary-dark"
              ] : [
                "bg-white dark:bg-gray-800",
                "text-gray-700 dark:text-gray-400",
                "border-gray-300 dark:border-gray-700",
                "hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
              ]
            )}
          >
            {page}
          </button>
        ) : (
          <span key={index} className="text-gray-700 dark:text-gray-400 px-1">
            {page}
          </span>
        )
      ))}

      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "px-3 py-2 border rounded min-w-10 transition-all duration-200",
          "bg-white dark:bg-gray-800",
          "text-gray-700 dark:text-gray-400",
          "border-gray-300 dark:border-gray-700",
          "disabled:bg-gray-100 dark:disabled:bg-gray-900",
          "disabled:text-gray-400 dark:disabled:text-gray-600",
          "disabled:cursor-not-allowed disabled:border-gray-200 dark:disabled:border-gray-800",
          "hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600",
          "disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-900 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-800"
        )}
      >
        →
      </button>
    </div>
  );
};

export default Pagination;


