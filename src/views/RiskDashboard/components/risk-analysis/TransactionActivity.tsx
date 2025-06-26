import React from 'react';
import { Card, Typography, Switch } from 'antd';
import { useTheme } from '../../../../context/ThemeContext';

const { Title } = Typography;

interface TransactionActivityProps {
  transactionActivity: Array<{ day: number; week: number; active: boolean }>;
}

const TransactionActivity: React.FC<TransactionActivityProps> = ({ transactionActivity }) => {
  const { theme } = useTheme();

  return (
    <div className="w-full mb-8">
      <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-2xl`}>
        <Title level={5} className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-4`}>Transaction Activity</Title>
        <div className="flex items-center mb-4">
          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-500'} mr-4`}>Year</span>
          <Switch checkedChildren="Day" unCheckedChildren="Year" defaultChecked className={`${theme === 'light' ? 'bg-gray-300' : 'bg-gray-700'}`} />
        </div>
        <div className="w-full overflow-hidden mb-2 flex flex-row items-start">
          {/* Vertical day labels */}
          <div className="flex flex-col justify-between h-full mr-2 min-w-[28px]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <span key={day} className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-500'} text-xs h-6 leading-6 my-0.5 flex-1`}>{day}</span>
            ))}
          </div>
          {/* Heatmap grid */}
          <div className="grid grid-cols-[repeat(52,1fr)] grid-rows-[repeat(7,1fr)] gap-0.5 w-full min-h-[90px]">
            {transactionActivity.map((cell, idx) => (
              <div key={idx} className={`w-full aspect-square rounded ${cell.active ? 'bg-blockscout-orange' : theme === 'light' ? 'bg-gray-300' : 'bg-gray-700'}`} />
            ))}
          </div>
        </div>
        {/* Legend aligned right */}
        <div className={`flex justify-end items-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2 w-full`}>
          <div>
            Legend: <span className="bg-blockscout-orange px-2 rounded inline-block align-middle" /> Active
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TransactionActivity; 