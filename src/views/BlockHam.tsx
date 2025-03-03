import React, { useEffect, useState } from 'react';
import { AutoComplete, Avatar, Input } from 'antd';
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

const GroupHeader = styled.div`
  padding: 12px 12px 8px;
  background-color: ${({ theme }) => theme.theme === 'dark' ? colors.gray[700] : colors.gray[50]};
  border-bottom: 1px solid ${({ theme }) => theme.theme === 'dark' ? colors.gray[700] : colors.gray[200]};
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
}

interface GroupedOption {
  label: React.ReactNode;
  options: ({
    label: React.ReactNode;
    value: string;
    // item: PopulatedSOT;
  })[];
}

const headerTitleMap: Record<string, string> = {
  'proper_name': 'Company',
  'url': 'URL',
  'entity_id': 'Entity Id', // TODO: only for admin users
  'contact_twitter': 'Twitter',
  'contact_telegram': 'Telegram'
  // 'entity_type': 'Type',
};

const BlockHam: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: sot, itemsMap: sotMap, loading: sotLoading } = useSelector((state: RootState) => state.sot);
  
  const [options, setOptions] = useState<GroupedOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSot, setSelectedSot] = useState<SOT | null>(null);

  useEffect(() => {
    dispatch(fetchSOT());
  }, [dispatch]);

  const headerTitle = (field: string, items: PopulatedSOT[]) => {
    return (
      <GroupHeader>
        <span className="header-title">{headerTitleMap[field]}</span>
        <span className="result-count">({items.length} results)</span>
      </GroupHeader>
    );
  };

  const onSelect = (_: string, option: any) => {
    const key = option?.key;
    if (!key) return;

    const id = key.split('-')[0];
    setSelectedSot(sotMap[id]);
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
        // 'entity_id',
        // 'entity_type',
        'proper_name',
        'url',
        'contact_twitter',
        'contact_telegram'
      ];
      const fieldDisplayMap: Record<string, (keyof PopulatedSOT)[]> = {
        // 'entity_id': ['entity_id'],
        // 'entity_type': ['entity_type'],
        'proper_name': ['proper_name'],
        'url': ['url'],
        'contact_twitter': ['contact_twitter'],
        'contact_telegram': ['contact_telegram'],
      };

      // Search each field separately to get top 10 matches per field
      const groupedResults: Record<string, PopulatedSOT[]> = {};

      for (const field of searchableFields) {
        const fieldResults = sifter.search(searchText, {
          fields: [field],
          limit: 6,
          sort: [{ field: field, direction: 'asc' }]
        });

        // Only create a group if there are matches for this field
        if (fieldResults.items.length > 0) {
          groupedResults[field] = fieldResults.items.map(item => {
            const populatedSOT = {
              ...sot[item.id],
              autocompleteDisplayTitle: ''
            };
            for (const dF of fieldDisplayMap[field]) {
              if (populatedSOT[dF] != null) {
                populatedSOT.autocompleteDisplayTitle = populatedSOT[dF] as string;
                break;
              }
            }
            return populatedSOT;
          });
        }
      }

      // Convert to AutoComplete's format
      const groupedOptions: GroupedOption[] = Object.entries(groupedResults)
        .filter(([_, items]) => items.length > 0)
        .map(([field, items]) => ({
          label: headerTitle(field, items) as any,
          options: items.map((item, index) => ({
            key: `${item._id}-${field}-${index}`,
            value: item.autocompleteDisplayTitle,
            label: (
              <OptionWrapper>
                <Avatar
                  size="small"
                  src={item.logo}
                  icon={!item.logo && <UserOutlined />}
                />
                <OptionContent>
                  <div>{item.autocompleteDisplayTitle}</div>
                  {item.associate_country_1 && (
                    <small style={{ color: colors.gray[600] }}>
                      {item.entity_type && `${getEntityTypeLabel(item.entity_type as EEntityType)} • `}
                      {item.associate_country_1}
                    </small>
                  )}
                </OptionContent>
              </OptionWrapper>
            ) as any
          }))
        }));

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