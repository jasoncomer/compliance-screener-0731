import React, { useEffect, useState } from 'react';
import { Table, Card, Spin } from 'antd';
import { getEntityBalance, EntityBalance } from '../api/entityBalanceSheet';


interface EntityBalanceSheetProps {
  currentEntityId?: string;
}

const EntityBalanceSheet: React.FC<EntityBalanceSheetProps> = ({ currentEntityId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EntityBalance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentEntityId) {
          setError('No entity ID provided');
          return;
        }

        const response = await getEntityBalance(currentEntityId);
        setData(response);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentEntityId]);

  if (error) {
    return null;
  }

  return (
    <Card 
      style={{ border: 'none', margin: 0, padding: 0 }}
      headStyle={{ border: 'none', paddingLeft: 0 }}
      bodyStyle={{ paddingLeft: 0, paddingRight: 0 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Spin size="large" />
        </div>
      ) : data ? (
        <Table
          dataSource={[data]}
          columns={[
            {
              title: 'Chain',
              dataIndex: 'btc_logo',
              key: 'btc_logo',
              render: () => (
                <img
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"
                  alt="BTC"
                  style={{ height: 25 }}
                />
              )
            },
            {
              title: 'BTC Balance',
              dataIndex: 'btc_bal',
              key: 'btc_bal',
              render: (value: number | null | undefined) => {
                if (value === null || value === undefined) return '-';
                return `${value} BTC`;
              }
            }
          ]}
          rowKey="entity_id"
          pagination={false}
        />
      ) : null}
    </Card>
  );
};

export default EntityBalanceSheet; 