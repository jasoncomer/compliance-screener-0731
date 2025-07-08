import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { Database, User } from 'lucide-react';  
import SearchInput from '../../components/common/SearchInput';
import { Badge } from '../../components/ui/badge';
import Sifter from 'sifter';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import ViewWrapper from '../../components/ViewWrapper';
import SOTEditor from '../../components/SOTEditor';
import EntityQuickView from '../../components/EntityQuickView';

import { AppDispatch, RootState } from '../../store/store';
import { fetchSOT } from '../../store/slices/sotSlice';
import { fetchOrganizations, selectCurrentOrganization } from '../../store/slices/organizationsSlice';
import { SOT } from '../../typings/interfaces';
import { EEntityType } from '../../typings/SOT';
import { getEntityTypeLabel } from '../../utils/display-labels';


// Custom debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Utility functions moved to the top
const getEntityTags = (sot: SOT): string[] => {
  const tags: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const tag = sot[`entity_tag${i}` as keyof SOT];
    if (tag && typeof tag === 'string' && tag.trim() !== '') {
      tags.push(tag);
    }
  }
  return tags;
};

const getAssociateCountries = (sot: SOT): string[] => {
  const countries: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const country = sot[`associate_country_${i}` as keyof SOT];
    if (country && typeof country === 'string' && country.trim() !== '') {
      countries.push(country);
    }
  }
  return countries;
};

const getSocialMediaProfiles = (sot: SOT): string[] => {
  const profiles: string[] = [];
  ['social_media_profile', 'social_media_profile_2', 'social_media_profile_3', 'social_media_profile_4'].forEach(field => {
    const profile = sot[field as keyof SOT];
    if (profile && typeof profile === 'string' && profile.trim() !== '') {
      profiles.push(profile);
    }
  });
  return profiles;
};

export interface PopulatedSOT extends SOT {
  autocompleteDisplayTitle: string;
  matchedField?: string;
  searchScore?: number;
}

export interface ConsolidatedEntity {
  _id: string;
  entity_id: string;
  proper_name: string;
  urls: string[];
  contact_email?: string;
  contact_twitter?: string;
  contact_telegram?: string;
  entity_type?: string;
  logo?: string;
  description_merged?: string;
  entity_tags: string[];
  associate_countries: string[];
  social_media_profiles: string[];
  matchedFields: string[];
  searchScore: number;
  originalSOT: SOT;
}

// Memoized option component
const EntityOption = React.memo(({ 
  entity, 
  sotMap, 
  handleQuickView, 
  handleViewFullProfile, 
  isHighlighted, 
  onClick 
}: {
  entity: ConsolidatedEntity;
  sotMap: Record<string, SOT>;
  handleQuickView: (e: React.MouseEvent, entityId: string) => void;
  handleViewFullProfile: (sot: SOT) => void;
  isHighlighted: boolean;
  onClick: () => void;
}) => (
  <div
    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
      isHighlighted ? 'bg-gray-100 dark:bg-gray-700' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0">
        {entity.logo ? (
          <img 
            src={entity.logo} 
            alt={entity.proper_name || entity.entity_id}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{entity.proper_name || entity.entity_id}</span>
          <EntityQuickView 
            entity={entity}
            sot={sotMap[entity._id]}
            onViewFull={handleViewFullProfile}
            onQuickView={handleQuickView}
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {entity.entity_type && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {getEntityTypeLabel(entity.entity_type as EEntityType)}
            </Badge>
          )}
          {entity.urls && entity.urls[0] && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {entity.urls[0]}
            </Badge>
          )}
          {entity.contact_twitter && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
              Twitter
            </Badge>
          )}
          {entity.contact_telegram && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Telegram
            </Badge>
          )}
          {entity.associate_countries.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              {entity.associate_countries[0]}
            </Badge>
          )}
        </div>
      </div>
    </div>
  </div>
));

const VASPExplorer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: sot, itemsMap: sotMap, loading: sotLoading } = useSelector((state: RootState) => state.sot);
  const organization = useSelector(selectCurrentOrganization);
  const [searchParams] = useSearchParams();

  const [searchResults, setSearchResults] = useState<ConsolidatedEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSot, setSelectedSot] = useState<SOT | null>(null);
  const [_, setQuickViewSot] = useState<SOT | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search value
  const debouncedSearchValue = useDebounce(searchValue, 300);

  // Initial data fetching
  useEffect(() => {
    dispatch(fetchSOT());
    dispatch(fetchOrganizations());
  }, [dispatch]);

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

  const consolidateEntity = useCallback((sotItem: SOT, matchedField: string, searchScore: number): ConsolidatedEntity => {
    return {
      _id: sotItem._id,
      entity_id: sotItem.entity_id,
      proper_name: sotItem.proper_name,
      urls: sotItem.url ? [sotItem.url] : [],
      contact_email: sotItem.contact_email,
      contact_twitter: sotItem.contact_twitter,
      contact_telegram: sotItem.contact_telegram,
      entity_type: sotItem.entity_type,
      logo: sotItem.logo,
      description_merged: sotItem.description_merged,
      entity_tags: getEntityTags(sotItem),
      associate_countries: getAssociateCountries(sotItem),
      social_media_profiles: getSocialMediaProfiles(sotItem),
      matchedFields: [matchedField],
      searchScore,
      originalSOT: sotItem
    };
  }, []); // No dependencies needed since utility functions are stable

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
  
  // Memoized search function
  const performSearch = useCallback(async (searchText: string) => {
    if (!searchText) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    
    try {
      const sifter = new Sifter(sot);
      const searchableFields = [
        'entity_id',
        'proper_name',
        'url',
        'contact_email',
        'contact_twitter',
        'contact_telegram',
        'entity_type',
        'description_merged',
        'entity_tag1',
        'entity_tag2',
        'entity_tag3',
        'entity_tag4',
        'entity_tag5',
        'entity_tag6',
        'entity_tag7',
        'associate_country_1',
        'associate_country_2',
        'associate_country_3',
        'associate_country_4',
        'associate_country_5',
        'associate_country_6',
      ];

      const results = sifter.search(searchText, {
        fields: searchableFields,
        conjunction: 'or',
        sort: [{ field: 'score', direction: 'desc' }],
        limit: 50
      });

      const consolidatedEntities: Record<string, ConsolidatedEntity> = {};

      for (const result of results.items) {
        const sotItem = sot[result.id];
        const scoreField = typeof (result as any).score_field === 'number' ? (result as any).score_field : 0;
        const fieldName = searchableFields[scoreField] || 'unknown';
        const entityId = sotItem.entity_id;

        if (organization?.settings?.allowCSAM === false) {
          const hasCSAMTag = getEntityTags(sotItem).some(tag => tag.toLowerCase().includes('csam'));
          const isCSAMType = sotItem.entity_type?.toLowerCase().includes('csam');
          if (hasCSAMTag || isCSAMType) {
            continue;
          }
        }

        if (consolidatedEntities[entityId]) {
          consolidatedEntities[entityId].matchedFields.push(fieldName);
          if (result.score > consolidatedEntities[entityId].searchScore) {
            consolidatedEntities[entityId].searchScore = result.score;
          }
          if (sotItem.url && !consolidatedEntities[entityId].urls.includes(sotItem.url)) {
            consolidatedEntities[entityId].urls.push(sotItem.url);
          }
        } else {
          consolidatedEntities[entityId] = consolidateEntity(
            sotItem,
            fieldName,
            result.score
          );
        }
      }

      const sortedEntities = Object.values(consolidatedEntities)
        .sort((a, b) => b.searchScore - a.searchScore);

      setSearchResults(sortedEntities);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [organization?.settings?.allowCSAM, sot, consolidateEntity]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearchValue) {
      performSearch(debouncedSearchValue);
      setIsDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  }, [debouncedSearchValue, performSearch]);

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

  const headerTitle = useMemo(() => (title: string, count: number) => {
    return (
      <div className="px-3 pt-3 pb-2 mt-1 bg-gray-50 dark:bg-gray-700">
        <span className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-white">
          {title}
        </span>
        <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">
          ({count} results)
        </span>
      </div>
    );
  }, []);

  const handleSelectOption = useCallback((entity: ConsolidatedEntity) => {
    setSelectedSot(sotMap[entity._id]);
    setSearchValue('');
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  }, [sotMap]);

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
          handleSelectOption(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [isDropdownOpen, searchResults, highlightedIndex, handleSelectOption]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setHighlightedIndex(-1);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (searchValue && searchResults.length > 0) {
      setIsDropdownOpen(true);
    }
  }, [searchValue, searchResults.length]);

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
          
          {isDropdownOpen && searchResults.length > 0 && (
            <div 
              ref={dropdownRef}
              className="absolute z-50 w-[1000px] mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-[500px] overflow-y-auto"
            >
              {headerTitle('Entities', searchResults.length)}
              {searchResults.map((entity, index) => (
                <EntityOption
                  key={`${entity._id}-${index}`}
                  entity={entity}
                  sotMap={sotMap}
                  handleQuickView={handleQuickView}
                  handleViewFullProfile={handleViewFullProfile}
                  isHighlighted={highlightedIndex === index}
                  onClick={() => handleSelectOption(entity)}
                />
              ))}
            </div>
          )}
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