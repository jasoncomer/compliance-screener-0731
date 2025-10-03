import React, { useEffect, useState } from 'react';

import { EntityBalance, getEntityBalance } from '../api/entityBalanceSheet';

interface EntityBalanceSheetProps {
  currentEntityId?: string;
}

// Loading spinner component following design system
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-6">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
  </div>
);

// Native table component following design system
interface BalanceTableProps {
  data: EntityBalance | null;
}

const BalanceTable: React.FC<BalanceTableProps> = ({ data }) => {
  const btcBalance = data?.btc_bal;
  const displayBalance = btcBalance === null || btcBalance === undefined ? '0 BTC' : `${btcBalance} BTC`;

  return (
    <div className="w-full">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-0 text-sm font-medium text-gray-600 dark:text-gray-300">
              Chain
            </th>
            <th className="text-left py-2 px-0 text-sm font-medium text-gray-600 dark:text-gray-300">
              BTC Balance
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <td className="py-3 px-0">
              <img
                src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"
                alt="BTC"
                className="h-6 w-6"
              />
            </td>
            <td className="py-3 px-0 text-sm text-gray-900 dark:text-gray-100">
              {displayBalance}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

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

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    return <BalanceTable data={data} />;
  };

  return (
    <div className="w-full">
      {renderContent()}
    </div>
  );
};

export default EntityBalanceSheet; 