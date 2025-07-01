import React, { useCallback, useEffect, useState } from 'react';
import { AutoComplete, Avatar, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Database } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
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

interface GroupedOption {
  label: React.ReactNode;
  options: ({
    label: React.ReactNode;
    value: string;
    key: string;
  })[];
}

// const headerTitleMap: Record<string, string> = {
//   'proper_name': 'Company',
//   'url': 'URL',
//   'entity_id': 'Entity Id', // TODO: only for admin users
//   'contact_twitter': 'Twitter',
//   'contact_telegram': 'Telegram'
//   // 'entity_type': 'Type',
// };

const BlockHam: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: sot, itemsMap: sotMap, loading: sotLoading } = useSelector((state: RootState) => state.sot);
  const organization = useSelector(selectCurrentOrganization);
  const [searchParams] = useSearchParams();

  const [options, setOptions] = useState<GroupedOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSot, setSelectedSot] = useState<SOT | null>(null);
  const [_, setQuickViewSot] = useState<SOT | null>(null);
  const [searchValue, setSearchValue] = useState('');

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
  }, []);

  const handleSelectAssociatedSot = (newSot: SOT) => {
    setSelectedSot(newSot);
  };

  const handleQuickView = useCallback((e: React.MouseEvent, entityId: string) => {
    e.stopPropagation();
    // Only set the quick view SOT, not the full view
    setQuickViewSot(sotMap[entityId]);
  }, [sotMap]);

  const handleViewFullProfile = useCallback((sot: SOT) => {
    // Set the selected SOT for full view
    setSelectedSot(sot);
    // Clear the quick view SOT to close the popover
    setQuickViewSot(null);
  }, [setSelectedSot, setQuickViewSot]);
  
  const handleSearch = useCallback(async (searchText: string) => {
    if (!searchText) {
      setOptions([]);
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

      // Search across all fields at once
      const results = sifter.search(searchText, {
        fields: searchableFields,
        conjunction: 'or',
        sort: [{ field: 'score', direction: 'desc' }],
      });

      // Consolidate results by entity_id instead of _id
      const consolidatedEntities: Record<string, ConsolidatedEntity> = {};

      for (const result of results.items) {
        const sotItem = sot[result.id];
        const scoreField = typeof (result as any).score_field === 'number' ? (result as any).score_field : 0;
        const fieldName = searchableFields[scoreField] || 'unknown';
        const entityId = sotItem.entity_id;

        // Skip CSAM-related entities if allowCSAM is false
        if (organization?.settings.allowCSAM === false) {
          const hasCSAMTag = getEntityTags(sotItem).some(tag => tag.toLowerCase().includes('csam'));
          const isCSAMType = sotItem.entity_type?.toLowerCase().includes('csam');
          if (hasCSAMTag || isCSAMType) {
            continue;
          }
        }

        if (consolidatedEntities[entityId]) {
          // Entity already in results, add matched field and URL if new
          consolidatedEntities[entityId].matchedFields.push(fieldName);
          if (result.score > consolidatedEntities[entityId].searchScore) {
            consolidatedEntities[entityId].searchScore = result.score;
          }
          // Add URL if it exists and is not already in the array
          if (sotItem.url && !consolidatedEntities[entityId].urls.includes(sotItem.url)) {
            consolidatedEntities[entityId].urls.push(sotItem.url);
          }
        } else {
          // New entity, add to consolidated results
          consolidatedEntities[entityId] = consolidateEntity(
            sotItem,
            fieldName,
            result.score
          );
        }
      }

      // Convert to array and sort by search score
      const sortedEntities = Object.values(consolidatedEntities)
        .sort((a, b) => b.searchScore - a.searchScore);

      console.log('sortedEntities', sortedEntities);
      // Convert to AutoComplete's format
      const groupedOptions: GroupedOption[] = [{
        label: headerTitle('Entities', sortedEntities.length),
        options: sortedEntities.map((entity, index) => ({
          key: `${entity._id}-${index}`,
          value: entity.proper_name || entity.entity_id,
          label: (
            <div className="flex items-center gap-2">
              <Avatar
                size="small"
                src={entity.logo}
                icon={!entity.logo && <UserOutlined />}
              />
              <div className="flex-1">
                <div>{entity.proper_name || entity.entity_id}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {entity.entity_type && (
                    <Tag className="text-[10px] px-1.5 py-0 mr-0" color="blue">
                      {getEntityTypeLabel(entity.entity_type as EEntityType)}
                    </Tag>
                  )}
                  {entity.urls && entity.urls[0] && (
                    <Tag className="text-[10px] px-1.5 py-0 mr-0" color="green">{entity.urls[0]}</Tag>
                  )}
                  {entity.contact_twitter && (
                    <Tag className="text-[10px] px-1.5 py-0 mr-0" color="cyan">Twitter</Tag>
                  )}
                  {entity.contact_telegram && (
                    <Tag className="text-[10px] px-1.5 py-0 mr-0" color="purple">Telegram</Tag>
                  )}
                  {entity.associate_countries.length > 0 && (
                    <Tag className="text-[10px] px-1.5 py-0 mr-0" color="orange">{entity.associate_countries[0]}</Tag>
                  )}
                </div>
              </div>
              <EntityQuickView 
                entity={entity}
                sot={sotMap[entity._id]}
                onViewFull={handleViewFullProfile}
                onQuickView={handleQuickView}
              />
            </div>
          )
        }))
      }];

      setOptions(groupedOptions);
    } catch (error) {
      console.error('Search error:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [organization?.settings?.allowCSAM, sot, sotMap, consolidateEntity, handleQuickView, handleViewFullProfile]);

  useEffect(() => {
    dispatch(fetchSOT());
    dispatch(fetchOrganizations());
  }, [dispatch]);

  // Handle initial search from URL parameters
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const entityParam = searchParams.get('entity');
    
    if (entityParam && sot.length > 0) {
      // Find the entity by entity_id
      const entity = Object.values(sot).find(sotItem => sotItem.entity_id === entityParam);
      if (entity) {
        setSelectedSot(entity);
        setSearchValue(entity.proper_name || entity.entity_id);
      }
    } else if (searchParam && sot.length > 0) {
      setSearchValue(searchParam);
      handleSearch(searchParam);
    }
  }, [searchParams, sot.length, handleSearch]);

  // Re-trigger search when organization settings change
  useEffect(() => {
    if (searchValue) {
      handleSearch(searchValue);
    }
  }, [organization?.settings?.allowCSAM, handleSearch, searchValue]);

  const headerTitle = (title: string, count: number) => {
    return (
      <div className="px-3 pt-3 pb-2 mt-1 bg-gray-50 dark:bg-gray-700">
        <span className="text-sm font-semibold text-gray-600 dark:text-white uppercase tracking-wide">{title}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({count} results)</span>
      </div>
    );
  };

  const onSelect = (_: string, option: any) => {
    const key = option?.key;
    if (!key) return;

    const id = key.split('-')[0];
    setSelectedSot(sotMap[id]);
  };

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

  return (
    <ViewWrapper
      icon={<Database className="w-8 h-8 text-orange-500" />}
      title="Entity Explorer"
      fullWidth={true}
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-2xl">
            <AutoComplete
              options={options}
              value={searchValue}
              onChange={(value) => {
                setSearchValue(value);
                if (value) {
                  handleSearch(value);
                } else {
                  setOptions([]);
                }
              }}
              onSelect={onSelect}
              placeholder="Search by name, address, or type..."
              style={{ 
                width: '100%', 
                height: '44px',
                borderRadius: '8px',
                padding: '0 12px',
                fontSize: '18px',
                color: '#000',
              }}
            />
          </div>
        </div>

        {!selectedSot && !loading && !sotLoading && (
          <EmptyState
            variant="initial"
            icon={<Database className="w-12 h-12" />}
            title="Explore VASP Entities"
            description="Search for Virtual Asset Service Providers (VASPs) and entities by name, address, or type. Get comprehensive information about their operations, locations, and compliance status."
          />
        )}

        {selectedSot && (
          <div className="flex-1 flex flex-col gap-6 w-full">
            <SOTEditor sot={selectedSot} onSelectAssociatedSot={handleSelectAssociatedSot} />
          </div>
        )}
      </div>
    </ViewWrapper>
  );
};

export default BlockHam; 