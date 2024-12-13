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
`;

const AssociatedList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const StyledCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const CardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EntityInfo = styled.div`
  flex: 1;
  
  .entity-name {
    font-weight: 500;
    margin-bottom: 4px;
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

  const associatedSots = Object.values(itemsMap)
    .filter(item => item.parent_id === sot.parent_id)
    .filter(Boolean);

  if (associatedSots.length === 0) return null;

  return (
    <AssociatedSOTsWrapper>
      <Title level={4}>Associated Entities</Title>
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