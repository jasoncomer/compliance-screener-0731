import React, { useEffect, useState } from 'react';

import { Card, Spin,Table } from 'antd';

import { EntityBalance,getEntityBalance } from '../api/entityBalanceSheet';

interface EntityBalanceSheetProps {
  currentEntityId?: string;
}

const CARD_STYLES = {
  style: { border: 'none', margin: 0, padding: 0 },
  styles: {
    header: { border: 'none', paddingLeft: 0 },
    body: { paddingLeft: 0, paddingRight: '40%' }
  }
};

const COLUMNS = [
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
      if (value === null || value === undefined) return '0 BTC';
      return `${value} BTC`;
    }
  }
];

const EntityBalanceSheet: React.FC<EntityBalanceSheetProps> = ({ currentEntityId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EntityBalance | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!currentEntityId) {
          return;
        }

        const response = await getEntityBalance(currentEntityId);
        setData(response);
      } catch (err: any) {
        // Handle 404 errors gracefully - entity might not have balance data
        if (err?.response?.status === 404) {
          console.log(`No balance data available for entity: ${currentEntityId}`);
          setData(null);
        } else {
          console.error('Failed to load balance data:', err);
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentEntityId]);

  const renderTable = (dataSource: any[]) => (
    <Table
      dataSource={dataSource}
      columns={COLUMNS}
      rowKey="entity_id"
      pagination={false}
    />
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Spin size="large" />
        </div>
      );
    }

    const tableData = data || { entity_id: currentEntityId };
    return renderTable([tableData]);
  };

  return (
    <Card {...CARD_STYLES}>
      {renderContent()}
    </Card>
  );
};

export default EntityBalanceSheet; 