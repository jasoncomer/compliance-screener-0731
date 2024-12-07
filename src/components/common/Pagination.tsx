import React from 'react';
import styled from 'styled-components';

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.$active ? '#3498db' : '#e2e8f0'};
  border-radius: 4px;
  background: ${props => props.$active ? '#3498db' : 'white'};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  cursor: pointer;
  min-width: 2.5rem;
  transition: all 0.2s ease;
  
  &:disabled {
    background: #f7fafc;
    color: #a0aec0;
    cursor: not-allowed;
    border-color: #edf2f7;
  }
  
  &:hover:not(:disabled) {
    background: ${props => props.$active ? '#2980b9' : '#f7fafc'};
    border-color: ${props => props.$active ? '#2980b9' : '#cbd5e0'};
  }
`;

const PageEllipsis = styled.span`
  color: #4a5568;
  padding: 0 0.25rem;
`;

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
    <PaginationWrapper>
      <PageButton 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ←
      </PageButton>
      
      {getPageNumbers().map((page, index) => (
        typeof page === 'number' ? (
          <PageButton
            key={index}
            $active={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </PageButton>
        ) : (
          <PageEllipsis key={index}>
            {page}
          </PageEllipsis>
        )
      ))}

      <PageButton 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        →
      </PageButton>
    </PaginationWrapper>
  );
};

export default Pagination;


