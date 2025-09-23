import { useCallback, useEffect, useState } from 'react';

import { SOT } from '../../../typings/interfaces';
import { getAssociateCountries, getEntityTags, getSocialMediaProfiles } from '../../../utils/sotUtils';
import { ConsolidatedEntity } from '../types';

interface UseEntitySearchProps {
  sot: SOT[];
  allowCSAM: boolean;
  debouncedSearchValue: string;
}

export const useEntitySearch = ({ sot, allowCSAM, debouncedSearchValue }: UseEntitySearchProps) => {
  const [searchResults, setSearchResults] = useState<ConsolidatedEntity[]>([]);
  const [loading, setLoading] = useState(false);

  // Enhanced search function (replaces sifter entirely)
  const performEnhancedSearch = useCallback((data: SOT[], searchText: string, fields: string[]) => {
    const searchLower = searchText.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);
    const matches: Array<{ id: number; score: number; matchedFields: string[] }> = [];
    
    data.forEach((item, index) => {
      let totalScore = 0;
      const matchedFields: string[] = [];
      
      fields.forEach(field => {
        const value = (item as any)[field];
        if (value && typeof value === 'string') {
          const valueLower = value.toLowerCase();
          
          // Check for exact match first
          if (valueLower === searchLower) {
            totalScore += 10; // Highest score for exact match
            matchedFields.push(field);
          }
          // Check for starts with
          else if (valueLower.startsWith(searchLower)) {
            totalScore += 5; // High score for starts with
            matchedFields.push(field);
          }
          // Check for contains
          else if (valueLower.includes(searchLower)) {
            const position = valueLower.indexOf(searchLower);
            const score = 3 - (position / value.length); // Score based on position
            totalScore += score;
            matchedFields.push(field);
          }
          // Check for individual terms
          else {
            let termMatches = 0;
            searchTerms.forEach(term => {
              if (valueLower.includes(term)) {
                termMatches++;
              }
            });
            if (termMatches > 0) {
              totalScore += (termMatches / searchTerms.length) * 2; // Partial score for term matches
              matchedFields.push(field);
            }
          }
        }
      });
      
      if (totalScore > 0) {
        matches.push({ id: index, score: totalScore, matchedFields });
      }
    });
    
    // Sort by score descending and limit to 50
    matches.sort((a, b) => b.score - a.score);
    return {
      items: matches.slice(0, 50).map(match => ({
        id: match.id,
        score: match.score
      })),
      total: matches.length,
      query: searchText,
      options: { fields },
      tokens: [{ string: searchText, regex: new RegExp(searchText, 'i') }]
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
  }, []);

  const performSearch = useCallback(async (searchText: string) => {
    if (!searchText) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    
    try {
      // Validate data before searching
      if (!sot || !Array.isArray(sot) || sot.length === 0) {
        console.warn('⚠️ VASP Search: Invalid or empty SOT data');
        setSearchResults([]);
        return;
      }

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

      // Use our enhanced search function (no more sifter!)
      const results = performEnhancedSearch(sot, searchText, searchableFields);

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

        if (!entityId) {
          console.warn('⚠️ VASP Search: Found entity without entity_id:', {
            _id: sotItem._id,
            proper_name: sotItem.proper_name,
            entity_type: sotItem.entity_type
          });
          continue;
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

      // Log search results summary (only in development)
      if (process.env.NODE_ENV === 'development' && sortedEntities.length > 0) {
        console.log('🔍 VASP Search Results:', sortedEntities.length, 'entities found');
      }

      setSearchResults(sortedEntities);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [allowCSAM, sot, consolidateEntity, performEnhancedSearch]);

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