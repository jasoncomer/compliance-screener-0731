import React, { forwardRef, useMemo } from 'react';

import { SOT } from '../../../typings/interfaces';
import { ConsolidatedEntity } from '../types';

import EntityOption from './EntityOption';

interface SearchDropdownProps {
  isOpen: boolean;
  searchResults: ConsolidatedEntity[];
  sotMap: Record<string, SOT>;
  highlightedIndex: number;
  onQuickView: (e: React.MouseEvent, entityId: string) => void;
  onViewFullProfile: (sot: SOT) => void;
  onSelectOption: (entity: ConsolidatedEntity) => void;
}

const SearchDropdown = forwardRef<HTMLDivElement, SearchDropdownProps>(({
  isOpen,
  searchResults,
  sotMap,
  highlightedIndex,
  onQuickView,
  onViewFullProfile,
  onSelectOption
}, ref) => {
  const headerTitle = useMemo(() => (title: string, count: number) => {
    return (
      <div className="px-3 pt-3 pb-2 bg-gray-50 dark:bg-gray-700">
        <span className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-white">
          {title}
        </span>
        <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">
          ({count} results)
        </span>
      </div>
    );
  }, []);

  if (!isOpen || searchResults.length === 0) {
    return null;
  }

  return (
    <div 
      ref={ref}
      className="absolute z-50 w-[1000px] mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-[500px] overflow-y-auto"
    >
      {headerTitle('Entities', searchResults.length)}
      {searchResults.map((entity, index) => (
        <EntityOption
          key={`${entity._id}-${index}`}
          entity={entity}
          sotMap={sotMap}
          handleQuickView={onQuickView}
          handleViewFullProfile={onViewFullProfile}
          isHighlighted={highlightedIndex === index}
          onClick={() => onSelectOption(entity)}
        />
      ))}
    </div>
  );
});

SearchDropdown.displayName = 'SearchDropdown';

export default SearchDropdown; 