import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Typography, AutoComplete, Input, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Sifter from 'sifter';
import { api } from '../api/api';
import { SOT } from '../typings/interfaces';

const { Title } = Typography;

const BlockHamWrapper = styled.div`
  padding: 24px;
  height: 100%;
  width: 100%;
`;

const SearchWrapper = styled.div`
  margin: 24px 0;
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

interface PopulatedSOT extends SOT {
  autocompleteDisplayTitle: string; 
}

interface GroupedOption {
  label: React.ReactNode;
  options: PopulatedSOT[];
}

const headerTitleMap: Record<string, string> = {
  'entity_id': 'Entity Name',
  'url': 'URL',
  'proper_name': 'Company',
  'entity_type': 'Type',
  'contact_twitter': 'Twitter',
  'contact_telegram': 'Telegram'
};

const BlockHam: React.FC = () => {
  const [options, setOptions] = useState<GroupedOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [sot, setSot] = useState<PopulatedSOT[]>([]);

  useEffect(() => {
    const fetchSOT = async () => {
      const response = await api.blockchain.getSOT();
      setSot(response);
    };
    fetchSOT();
  }, []);

  const headerTitle = (field: string, items: PopulatedSOT[]) => {
    return (
      <GroupHeader>
        <span className="header-title">{headerTitleMap[field]}</span>
        <span className="result-count">({items.length} results)</span>
      </GroupHeader>
    );
  };

  const onSelect = (value: string) => {
    console.log('Selected:', value);
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
                if (populatedSOT.logo != null) {
                  // clean the logo url; add https:// if it's missing
                  if (!populatedSOT.logo.startsWith('http')) {
                    populatedSOT.logo = 'https://' + populatedSOT.logo;
                  }
                }
                break;
              }
            }
            return populatedSOT;
          });
        }
      }
      console.log(groupedResults);

      // Convert to AutoComplete's format
      const groupedOptions: GroupedOption[] = Object.entries(groupedResults)
        .filter(([_, items]) => items.length > 0) // Remove empty groups
        .map(([field, items]) => ({
          label: headerTitle(field, items),
          options: items.map(item => ({
            ...item,
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
                      {item.entity_type && `${item.entity_type} • `}
                      {item.associate_country_1}
                    </small>
                  )}
                </OptionContent>
              </OptionWrapper>
            )
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

  return (
    <BlockHamWrapper>
      <Title level={2}>BlockHam</Title>
      <SearchWrapper>
        <StyledAutoComplete
          options={options}
          onSelect={onSelect}
          onSearch={handleSearch}
          style={{ width: '100%' }}
          listHeight={500}
          dropdownMatchSelectWidth={true}
        >
          <Input.Search
            placeholder="Search by name, address, or type..."
            enterButton
            size="large"
            loading={loading}
          />
        </StyledAutoComplete>
      </SearchWrapper>
    </BlockHamWrapper>
  );
};

export default BlockHam; 