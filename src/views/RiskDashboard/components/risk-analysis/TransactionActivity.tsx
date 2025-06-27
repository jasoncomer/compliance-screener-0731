import React from 'react';
import { useTheme } from "../../../../context/ThemeContext";

interface TransactionActivityProps {
  transactionActivity: Array<{ day: number; week: number; active: boolean }>;
}

const TransactionActivity: React.FC<TransactionActivityProps> = ({ transactionActivity }) => {
  const { theme } = useTheme();

  return (
    <div className="w-full mb-8">
      <div className={`rounded-2xl border p-6 ${
        theme === 'dark' 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <h5 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Transaction Activity</h5>
        <div className="flex items-center mb-4">
          <span className={`mr-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Year</span>
          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
          }`}>
            <div className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform transform translate-x-5"></div>
            <span className="absolute left-2 text-xs text-gray-500">Day</span>
            <span className="absolute right-2 text-xs text-gray-500">Year</span>
          </div>
        </div>
        <div className="w-full overflow-hidden mb-2 flex flex-row items-start">
          {/* Vertical day labels */}
          <div className="flex flex-col justify-between h-full mr-2 min-w-[28px]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <span key={day} className={`text-xs h-6 leading-6 my-0.5 flex-1 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              }`}>{day}</span>
            ))}
          </div>
          {/* Heatmap grid */}
          <div className="grid grid-cols-[repeat(52,1fr)] grid-rows-[repeat(7,1fr)] gap-0.5 w-full min-h-[90px]">
            {transactionActivity.map((cell, idx) => (
              <div key={idx} className={`w-full aspect-square rounded ${
                cell.active 
                  ? 'bg-brand-primary' 
                  : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
              }`} />
            ))}
          </div>
        </div>
        {/* Legend aligned right */}
        <div className={`flex justify-end items-center text-xs mt-2 w-full ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
        }`}>
          <div>
            Legend: <span className="bg-brand-primary px-2 rounded inline-block align-middle" /> Active
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionActivity; 