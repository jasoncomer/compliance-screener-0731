import React, { useEffect, useState } from 'react';
import { AutoComplete, Avatar, Input, Tag } from 'antd';
import { UserOutlined, DatabaseOutlined } from '@ant-design/icons';
import Sifter from 'sifter';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import ViewWrapper from '../components/ViewWrapper';
import SOTEditor from '../components/SOTEditor';
import { AppDispatch, RootState } from '../store/store';
import { fetchSOT } from '../store/slices/sotSlice';
import { SOT } from '../typings/interfaces';
import { EEntityType } from '../typings/SOT';
import { getEntityTypeLabel } from '../utils/display-labels';
import { colors } from '../styles/variables';


const SearchWrapper = styled.div`
  width: 100%;
`;

const OptionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
`;

const OptionContent = styled.div`
  flex: 1;
`;

const OptionInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`;

const InfoTag = styled(Tag)`
  font-size: 10px;
  padding: 0 6px;
  margin-right: 0;
`;

const GroupHeader = styled.div`
  padding: 12px 12px 8px;
  background-color: ${({ theme }) => theme.theme === 'dark' ? colors.gray[700] : colors.gray[50]};
  
  margin-top: 4px;
  
  
  .header-title {
    font-size: 14px;
    font-weight: 600;
    
    color: ${({ theme }) => theme.theme === 'dark' ? colors.white : colors.gray[600]};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .result-count {
    font-size: 12px;
    color: ${({ theme }) => theme.theme === 'dark' ? colors.gray[400] : colors.gray[500]};
    margin-left: 8px;
  }
`;

const StyledAutoComplete = styled(AutoComplete)`
`;

export interface PopulatedSOT extends SOT {
  autocompleteDisplayTitle: string;
  matchedField?: string;
  searchScore?: number;
}

export interface ConsolidatedEntity {
  _id: string;
  entity_id: string;
  proper_name: string;
  url?: string;
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
  
  const [options, setOptions] = useState<GroupedOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSot, setSelectedSot] = useState<SOT | null>(null);

  useEffect(() => {
    dispatch(fetchSOT());
  }, [dispatch]);

  const headerTitle = (title: string, count: number) => {
    return (
      <GroupHeader>
        <span className="header-title">{title}</span>
        <span className="result-count">({count} results)</span>
      </GroupHeader>
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

  const consolidateEntity = (sotItem: SOT, matchedField: string, searchScore: number): ConsolidatedEntity => {
    return {
      _id: sotItem._id,
      entity_id: sotItem.entity_id,
      proper_name: sotItem.proper_name,
      url: sotItem.url,
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
  };

  const handleSearch = async (searchText: string) => {
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

      // Consolidate results by entity ID
      const consolidatedEntities: Record<string, ConsolidatedEntity> = {};

      for (const result of results.items) {
        const sotItem = sot[result.id];
        // Handle score_field property, which is not in the TypeScript type
        const scoreField = typeof (result as any).score_field === 'number' ? (result as any).score_field : 0;
        const fieldName = searchableFields[scoreField] || 'unknown';
        const entityId = sotItem._id;

        if (consolidatedEntities[entityId]) {
          // Entity already in results, add matched field
          consolidatedEntities[entityId].matchedFields.push(fieldName);
          if (result.score > consolidatedEntities[entityId].searchScore) {
            consolidatedEntities[entityId].searchScore = result.score;
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

      // Convert to AutoComplete's format
      const groupedOptions: GroupedOption[] = [{
        label: headerTitle('Entities', sortedEntities.length),
        options: sortedEntities.map((entity, index) => ({
          key: `${entity._id}-${index}`,
          value: entity.proper_name || entity.entity_id,
          label: (
            <OptionWrapper>
              <Avatar
                size="small"
                src={entity.logo}
                icon={!entity.logo && <UserOutlined />}
              />
              <OptionContent>
                <div>{entity.proper_name || entity.entity_id}</div>
                <OptionInfo>
                  {entity.entity_type && (
                    <InfoTag color="blue">
                      {getEntityTypeLabel(entity.entity_type as EEntityType)}
                    </InfoTag>
                  )}
                  {entity.url && (
                    <InfoTag color="green">URL</InfoTag>
                  )}
                  {entity.contact_twitter && (
                    <InfoTag color="cyan">Twitter</InfoTag>
                  )}
                  {entity.contact_telegram && (
                    <InfoTag color="purple">Telegram</InfoTag>
                  )}
                  {entity.associate_countries.length > 0 && (
                    <InfoTag color="orange">{entity.associate_countries[0]}</InfoTag>
                  )}
                </OptionInfo>
              </OptionContent>
            </OptionWrapper>
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
  };

  const handleSelectAssociatedSot = (newSot: SOT) => {
    setSelectedSot(newSot);
  };

  return (
    <ViewWrapper
      icon={<DatabaseOutlined style={{ fontSize: '28px', color: colors.attributionHover, fontWeight: 'bold' }} />}
      title="Entity Explorer"
    >
      <SearchWrapper>
        <StyledAutoComplete
          options={options}
          onSelect={onSelect as any}
          onSearch={handleSearch}
          style={{ width: '100%' }}
          listHeight={500}
        >
          <Input.Search
            placeholder="Search by name, address, or type..."
            onSearch={handleSearch}
            loading={loading || sotLoading}
            style={{ width: '400px' }}
          />
        </StyledAutoComplete>
      </SearchWrapper>

      {selectedSot && <SOTEditor sot={selectedSot} onSelectAssociatedSot={handleSelectAssociatedSot} />}
    </ViewWrapper>
  );
};

export default BlockHam; 