import React, { useCallback, useEffect, useState } from 'react';

import { Database } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import EmptyState from '../../components/common/EmptyState';
import SearchInput from '../../components/common/SearchInput';
import SOTEditor from '../../components/SOTEditor';
import ViewWrapper from '../../components/ViewWrapper';
import { useDebounce } from '../../hooks/useDebounce';
import { fetchOrganizations, selectCurrentOrganization } from '../../store/slices/organizationsSlice';
import { fetchSOT } from '../../store/slices/sotSlice';
import { AppDispatch, RootState } from '../../store/store';
import { SOT } from '../../typings/interfaces';

import { SearchDropdown } from './components';
import { useEntitySearch, useSearchDropdown } from './hooks';

export const VASPExplorer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: sot, itemsMap: sotMap, loading: sotLoading} = useSelector((state: RootState) => state.sot);
  const organization = useSelector(selectCurrentOrganization);
  const [searchParams] = useSearchParams();

  const [selectedSot, setSelectedSot] = useState<SOT | null>(null);
  const [_, setQuickViewSot] = useState<SOT | null>(null);
  const [searchValue, setSearchValue] = useState('');

  // Debounce search value
  const debouncedSearchValue = useDebounce(searchValue, 300);

  // Use search hook
  const { searchResults, loading, performSearch } = useEntitySearch({
    sot,
    allowCSAM: organization?.settings?.allowCSAM !== false,
    debouncedSearchValue
  });

  // Selection handler for dropdown
  const handleSelectOption = useCallback((entity: any) => {
    setSelectedSot(sotMap[entity.entity_id]);
    setSearchValue('');
  }, [sotMap]);

  // Use dropdown hook
  const {
    isDropdownOpen,
    highlightedIndex,
    dropdownRef,
    handleKeyDown,
    handleSelectOption: dropdownSelectOption,
    handleInputFocus,
    resetHighlight
  } = useSearchDropdown({
    searchResults,
    searchValue,
    onSelectOption: handleSelectOption
  });

  // Initial data fetching
  useEffect(() => {
    dispatch(fetchSOT());
    dispatch(fetchOrganizations());
  }, [dispatch]);

  // Event handlers
  const handleSelectAssociatedSot = useCallback((newSot: SOT) => {
    setSelectedSot(newSot);
  }, []);

  const handleQuickView = useCallback((e: React.MouseEvent, entityId: string) => {
    e.stopPropagation();
    setQuickViewSot(sotMap[entityId]);
  }, [sotMap]);

  const handleViewFullProfile = useCallback((sot: SOT) => {
    setSelectedSot(sot);
    setQuickViewSot(null);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    resetHighlight();
  }, [resetHighlight]);

  // Handle initial search from URL parameters
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const entityParam = searchParams.get('entity');
    
    // Only process URL parameters if SOT data is loaded and not loading
    if (sotLoading || Object.keys(sotMap).length === 0) {
      return;
    }
    
    // Add a small delay to ensure SOT data is fully processed
    const timeoutId = setTimeout(() => {
      if (entityParam) {
        const entity = sotMap[entityParam];
        if (entity) {
          setSelectedSot(entity);
        } else {
          // Try to find by searching in the items array as fallback
          const fallbackEntity = sot.find(sotItem => 
            sotItem.entity_id === entityParam || 
            sotItem.proper_name?.toLowerCase().includes(entityParam.toLowerCase())
          );
          if (fallbackEntity) {
            setSelectedSot(fallbackEntity);
          } else {
            // Try to find by searching if entity is not found in map
            setSearchValue(entityParam);
            performSearch(entityParam);
          }
        }
      } else if (searchParam) {
        setSearchValue(searchParam);
        performSearch(searchParam);
      }
    }, 100); // Small delay to ensure SOT data is ready
    
    return () => clearTimeout(timeoutId);
  }, [searchParams, sotMap, sotLoading, sot.length, performSearch]);

  // Re-trigger search when organization settings change
  useEffect(() => {
    if (searchValue) {
      performSearch(searchValue);
    }
  }, [organization?.settings?.allowCSAM, performSearch, searchValue]);

  // Retry URL parameter processing when SOT data becomes available
  useEffect(() => {
    const entityParam = searchParams.get('entity');
    if (entityParam && !sotLoading && Object.keys(sotMap).length > 0 && !selectedSot) {
      const entity = sotMap[entityParam];
      if (entity) {
        setSelectedSot(entity);
      }
    }
  }, [sotMap, sotLoading, searchParams, selectedSot]);

  const isEmptyState = !selectedSot;

  return (
    <ViewWrapper
      icon={<Database className="w-8 h-8 text-orange-500" />}
      title={isEmptyState ? "Entity Explorer" : ""}
      fullWidth={true}
    >

      {/* Sticky Search Bar */}
      <div className={`sticky top-[0] z-20 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 ${isEmptyState ? 'pt-2 py-4 mb-2' : 'py-4'}`}>
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 max-w-2xl">
            <div className="relative w-full">
              <SearchInput
                placeholder="Search by name, address, or type..."
                value={searchValue}
                onChange={handleInputChange}
                onSearch={performSearch}
                loading={loading || sotLoading}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
              />
              
              <SearchDropdown
                ref={dropdownRef}
                isOpen={isDropdownOpen}
                searchResults={searchResults}
                sotMap={sotMap}
                highlightedIndex={highlightedIndex}
                onQuickView={handleQuickView}
                onViewFullProfile={handleViewFullProfile}
                onSelectOption={dropdownSelectOption}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isEmptyState ? (
        <EmptyState
          variant="initial"
          icon={<Database className="w-12 h-12" />}
          title="Welcome to Entity Explorer"
          description="Search and explore VASP entities, their relationships, and detailed information. Use the search bar above to find entities by name, address, or type."
        />
      ) : (
        <div className="flex-1 flex flex-col gap-6 w-full mt-2">
          <SOTEditor sot={selectedSot} onSelectAssociatedSot={handleSelectAssociatedSot} />
        </div>
      )}
    </ViewWrapper>
  );
};
