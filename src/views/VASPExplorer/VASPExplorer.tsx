import React, { useCallback, useEffect, useMemo, useState } from 'react';

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

// Meerkat-themed loading messages
const LOADING_MESSAGES = [
  '🐾  Our meerkats are peeking over the horizon for VASPs…',
  '🔎 Standing on tiptoes, scanning the savannah of 30,000+ entities…',
  '🌞 Sun\'s up! Meerkats are digging through the blockchain burrows…',
  '🏜️ Hold tight — the meerkat scouts are out on patrol.',
  '🪨 Still digging… VASP tunnels go deep!',
  '⛏️ Digging through blockchain trails…',
  '🔒 Loading safely — meerkats are great at lookout duty.',
  '🐾 Counting tails — one VASP at a time…'
];

export const VASPExplorer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: sot, itemsMap: sotMap, loading: sotLoading} = useSelector((state: RootState) => state.sot);
  const organization = useSelector(selectCurrentOrganization);
  const [searchParams] = useSearchParams();

  const [selectedSot, setSelectedSot] = useState<SOT | null>(null);
  const [_, setQuickViewSot] = useState<SOT | null>(null);
  const [searchValue, setSearchValue] = useState('');
  
  // Randomly select a loading message (memoized to avoid changing on re-renders)
  const loadingMessage = useMemo(() => {
    return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  }, []);

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
      title="Entity Explorer"
      fullWidth={true}
      className="bg-gray-200 dark:bg-gray-900"
    >
      {/* Initial Loading State */}
      {sotLoading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
          <div className="relative">
            <Database className="w-16 h-16 text-orange-500 animate-pulse" />
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full animate-ping" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Loading Entity Database
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md animate-pulse">
              {loadingMessage}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      ) : (
        <>
          {/* Sticky Search Bar */}
          <div className="sticky top-[0] z-20 pt-2 py-2 mb-2 border-b bg-gray-200 dark:bg-gray-900">
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1 max-w-2xl">
                <div className="relative w-full">
                  <SearchInput
                    placeholder="Search by name, address, or type..."
                    value={searchValue}
                    onChange={handleInputChange}
                    onSearch={performSearch}
                    loading={loading}
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
        </>
      )}
    </ViewWrapper>
  );
};
