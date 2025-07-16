import React, { useCallback, useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import SearchInput from '../../components/common/SearchInput';
import ViewWrapper from '../../components/ViewWrapper';
import SOTEditor from '../../components/SOTEditor';
import { SearchDropdown } from './components';

import { AppDispatch, RootState } from '../../store/store';
import { fetchSOT } from '../../store/slices/sotSlice';
import { fetchOrganizations, selectCurrentOrganization } from '../../store/slices/organizationsSlice';
import { SOT } from '../../typings/interfaces';

import { useDebounce } from '../../hooks/useDebounce';
import { useEntitySearch, useSearchDropdown } from './hooks';

const VASPExplorer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: sot, itemsMap: sotMap, loading: sotLoading } = useSelector((state: RootState) => state.sot);
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
    setSelectedSot(sotMap[entity._id]);
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
    
    if (entityParam && sot.length > 0) {
      const entity = Object.values(sot).find(sotItem => sotItem.entity_id === entityParam);
      if (entity) {
        setSelectedSot(entity);
      }
    } else if (searchParam && sot.length > 0) {
      setSearchValue(searchParam);
      performSearch(searchParam);
    }
  }, [searchParams, sot, performSearch]);

  // Re-trigger search when organization settings change
  useEffect(() => {
    if (searchValue) {
      performSearch(searchValue);
    }
  }, [organization?.settings?.allowCSAM, performSearch, searchValue]);

  return (
    <ViewWrapper
      icon={<Database className="w-8 h-8 text-orange-500" />}
      title="Entity Explorer"
      fullWidth={true}
    >
      <div className="w-full">
        <div className="relative w-[400px]">
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

      {selectedSot && (
        <div className="flex-1 flex flex-col gap-6 w-full mt-5">
          <SOTEditor sot={selectedSot} onSelectAssociatedSot={handleSelectAssociatedSot} />
        </div>
      )}
    </ViewWrapper>
  );
};

export default VASPExplorer; 