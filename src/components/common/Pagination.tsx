import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/variables';

const PaginationWrapper = styled.div<{ $theme: 'light' | 'dark' }>`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: ${props => props.$theme === 'light' ? colors.gray[700] : colors.gray[400]};
`;

const PageButton = styled.button<{ $active?: boolean; $theme: 'light' | 'dark' }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.$active 
    ? colors.primary 
    : props.$theme === 'light' ? colors.gray[300] : colors.gray[700]};
  border-radius: 4px;
  background: ${props => props.$active 
    ? colors.primary 
    : props.$theme === 'light' ? colors.white : colors.gray[800]};
  color: ${props => props.$active 
    ? colors.white 
    : props.$theme === 'light' ? colors.gray[700] : colors.gray[400]};
  cursor: pointer;
  min-width: 2.5rem;
  transition: all 0.2s ease;
  
  &:disabled {
    background: ${props => props.$theme === 'light' ? colors.gray[100] : colors.gray[900]};
    color: ${props => props.$theme === 'light' ? colors.gray[400] : colors.gray[600]};
    cursor: not-allowed;
    border-color: ${props => props.$theme === 'light' ? colors.gray[200] : colors.gray[800]};
  }
  
  &:hover:not(:disabled) {
    background: ${props => props.$active 
      ? colors.primaryDark 
      : props.$theme === 'light' ? colors.gray[100] : colors.gray[700]};
    border-color: ${props => props.$active 
      ? colors.primaryDark 
      : props.$theme === 'light' ? colors.gray[400] : colors.gray[600]};
  }
`;

const PageEllipsis = styled.span<{ $theme: 'light' | 'dark' }>`
  color: ${props => props.$theme === 'light' ? colors.gray[700] : colors.gray[400]};
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
  const { theme } = useTheme();
  
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
    <PaginationWrapper $theme={theme}>
      <PageButton 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        $theme={theme}
      >
        ←
      </PageButton>
      
      {getPageNumbers().map((page, index) => (
        typeof page === 'number' ? (
          <PageButton
            key={index}
            $active={page === currentPage}
            onClick={() => onPageChange(page)}
            $theme={theme}
          >
            {page}
          </PageButton>
        ) : (
          <PageEllipsis key={index} $theme={theme}>
            {page}
          </PageEllipsis>
        )
      ))}

      <PageButton 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        $theme={theme}
      >
        →
      </PageButton>
    </PaginationWrapper>
  );
};

export default Pagination;


