import { useCallback, useEffect, useRef, useState } from 'react';
import { ConsolidatedEntity } from '../types';

interface UseSearchDropdownProps {
  searchResults: ConsolidatedEntity[];
  searchValue: string;
  onSelectOption: (entity: ConsolidatedEntity) => void;
}

export const useSearchDropdown = ({ 
  searchResults, 
  searchValue, 
  onSelectOption 
}: UseSearchDropdownProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Open dropdown when search results are available
  useEffect(() => {
    if (searchValue && searchResults.length > 0) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, [searchValue, searchResults.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          onSelectOption(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [isDropdownOpen, searchResults, highlightedIndex, onSelectOption]);

  const handleSelectOption = useCallback((entity: ConsolidatedEntity) => {
    onSelectOption(entity);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  }, [onSelectOption]);

  const handleInputFocus = useCallback(() => {
    if (searchValue && searchResults.length > 0) {
      setIsDropdownOpen(true);
    }
  }, [searchValue, searchResults.length]);

  const resetHighlight = useCallback(() => {
    setHighlightedIndex(-1);
  }, []);

  return {
    isDropdownOpen,
    highlightedIndex,
    dropdownRef,
    handleKeyDown,
    handleSelectOption,
    handleInputFocus,
    resetHighlight
  };
}; 