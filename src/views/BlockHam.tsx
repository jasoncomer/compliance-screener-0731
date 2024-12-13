import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Typography, AutoComplete, Input, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Sifter from 'sifter';
import { useDispatch, useSelector } from 'react-redux';

import SOTEditor from '../components/SOTEditor';
import { AppDispatch, RootState } from '../store/store';
import { fetchSOT } from '../store/slices/sotSlice';
import { SOT } from '../typings/interfaces';
import { EEntityType } from '../typings/SOT';
import { getEntityTypeLabel } from '../utils/display-labels';

const { Title } = Typography;

const BlockHamWrapper = styled.div`
  padding: 2em;
  height: 100%;
  width: 100%;
  overflow: auto;
  h2 {
    margin: 0;
  }
`;

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
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 4px;
  
  .header-title {
    font-size: 14px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .result-count {
    font-size: 12px;
    color: #999;
    margin-left: 8px;
  }
`;

const StyledAutoComplete = styled(AutoComplete)`
    .ant-select-dropdown {
      padding: 0;
      
      .ant-select-item-group {
        padding: 0;
      }

      .ant-select-item-option {
        padding: 8px 12px;
        
        &:hover {
          background-color: #f5f5f5;
        }
        
        &-active {
          background-color: #e6f7ff;
        }
      }
    }
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
        'entity_id',
        'url',
        'proper_name',
        'entity_type',
        'contact_twitter',
        'contact_telegram'
      ];
      const fieldDisplayMap: Record<string, (keyof PopulatedSOT)[]> = {
        'entity_id': ['entity_id'],
        'url': ['url'],
        'proper_name': ['proper_name'],
        'entity_type': ['entity_type'],
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
                    <small style={{ color: '#666' }}>
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
    <>
      <BlockHamWrapper>
        <Title level={2}>Entity Explorer</Title>
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
              enterButton
              size="large"
              loading={loading || sotLoading}
            />
          </StyledAutoComplete>
        </SearchWrapper>

        {selectedSot && <SOTEditor sot={selectedSot} onSelectAssociatedSot={handleSelectAssociatedSot} />}
      </BlockHamWrapper>
    </>
  );
};

export default BlockHam; 