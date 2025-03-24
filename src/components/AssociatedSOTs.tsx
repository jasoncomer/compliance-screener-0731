import React from 'react';
import styled from 'styled-components';
import { Typography, Card, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { SOT } from '../typings/interfaces';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getEntityTypeLabel } from '../utils/display-labels';
import { EEntityType } from '../typings/SOT';

const { Title } = Typography;

const AssociatedSOTsWrapper = styled.div`
  text-align: left;
  h4 {
    margin: 0;
  }
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const AssociatedList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
  margin-top: 12px;
  overflow-y: auto;
  flex: 1;
  padding-right: 4px;
  max-height: 500px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;

  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.theme === 'dark' ? '#303030' : '#d9d9d9'};
    border-radius: 3px;
  }
`;

const StyledCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 0;

  &:hover {
    box-shadow: 0 4px 12px "green";
    transform: translateY(-2px);
  }
  
  .ant-card-body {
    padding: 12px;
  }
`;

const CardContent = styled.div`  display: flex;
  align-items: center;
  gap: 8px;
`;

const EntityInfo = styled.div`
  flex: 1;
  
  .entity-name {
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .entity-type {
    color: #666;
    font-size: 12px;
  }
`;

interface AssociatedSOTsProps {
  sot: SOT | null;
  onSelectSot: (sot: SOT) => void;
}

const AssociatedSOTs: React.FC<AssociatedSOTsProps> = ({ sot, onSelectSot }) => {
  const { itemsMap } = useSelector((state: RootState) => state.sot);

  if (!sot || !sot.parent_id || sot.parent_id === '') return null;

  // Get all associated entities
  const associatedSots = Object.values(itemsMap)
    .filter(item => item.parent_id === sot.parent_id)
    .filter(Boolean);

  if (associatedSots.length === 0) return null;

  return (
    <AssociatedSOTsWrapper>
      <Title level={4}>Associated Entities ({associatedSots.length})</Title>
      <AssociatedList>
        {associatedSots.map((associatedSot) => (
          <StyledCard 
            key={associatedSot._id}
            onClick={() => onSelectSot(associatedSot)}
          >
            <CardContent>
              <Avatar
                size="large"
                src={associatedSot.logo}
                icon={!associatedSot.logo && <UserOutlined />}
              />
              <EntityInfo>
                <div className="entity-name">
                  {associatedSot.proper_name || associatedSot.entity_id}
                </div>
                <div className="entity-type">
                  {getEntityTypeLabel(associatedSot.entity_type as EEntityType)}
                  {associatedSot.associate_country_1 && 
                    ` • ${associatedSot.associate_country_1}`
                  }
                </div>
              </EntityInfo>
            </CardContent>
          </StyledCard>
        ))}
      </AssociatedList>
    </AssociatedSOTsWrapper>
  );
};

export default AssociatedSOTs;
