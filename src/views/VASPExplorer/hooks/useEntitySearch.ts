import { useCallback, useEffect, useState } from 'react';
import Sifter from 'sifter';
import { ConsolidatedEntity } from '../types';
import { SOT } from '../../../typings/interfaces';
import { getEntityTags, getAssociateCountries, getSocialMediaProfiles } from '../../../utils/sotUtils';

interface UseEntitySearchProps {
  sot: SOT[];
  allowCSAM: boolean;
  debouncedSearchValue: string;
}

export const useEntitySearch = ({ sot, allowCSAM, debouncedSearchValue }: UseEntitySearchProps) => {
  const [searchResults, setSearchResults] = useState<ConsolidatedEntity[]>([]);
  const [loading, setLoading] = useState(false);

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

        if (!allowCSAM) {
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
  }, [allowCSAM, sot, consolidateEntity]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearchValue) {
      performSearch(debouncedSearchValue);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchValue, performSearch]);

  return {
    searchResults,
    loading,
    performSearch
  };
}; 