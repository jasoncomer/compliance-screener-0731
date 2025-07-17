import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from "../../../../context/ThemeContext";
import { ChevronDown, Calendar, BarChart3 } from 'lucide-react';

interface TransactionActivityProps {
  transactionActivity: Array<{ 
    day: number; 
    week: number; 
    active: boolean;
    activityCount?: number; // Number of inputs + outputs for that day
  }>;
  isLoading?: boolean; // Add loading prop
  selectedYear?: number; // Add selected year prop
}

type SortOption = 'date' | 'activity';

const TransactionActivity: React.FC<TransactionActivityProps> = ({ 
  transactionActivity, 
  isLoading = false,
  selectedYear = new Date().getFullYear()
}) => {
  const { theme } = useTheme();
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'heatmap' | 'list'>('heatmap');
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log('TransactionActivity Component - Received Data:', {
    transactionActivityLength: transactionActivity.length,
    sampleData: transactionActivity.slice(0, 3),
    maxActivity: Math.max(...transactionActivity.map(cell => cell.activityCount || 0)),
    activeDays: transactionActivity.filter(cell => cell.active).length,
    totalActivityCount: transactionActivity.reduce((sum, cell) => sum + (cell.activityCount || 0), 0)
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to get activity intensity color based on count (GitHub-style)
  const getActivityColor = (activityCount: number = 0) => {
    if (activityCount === 0) {
      return theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
    }
    
    // GitHub-style intensity levels with orange theme
    if (activityCount >= 20) return 'bg-orange-600'; // Very high activity
    if (activityCount >= 15) return 'bg-orange-500'; // High activity
    if (activityCount >= 10) return 'bg-orange-400'; // Medium-high activity
    if (activityCount >= 5) return 'bg-orange-300';  // Medium activity
    if (activityCount >= 1) return 'bg-orange-200';  // Low activity
    
    return theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
  };

  // Transform data - simplified for daily view only
  const transformedActivity = useMemo(() => {
    // Use original daily data
    return transactionActivity;
  }, [transactionActivity]);

  // Always keep chronological order for the heatmap grid
  const chronologicalActivity = useMemo(() => {
    return [...transformedActivity].sort((a, b) => {
      if (sortBy === 'date') {
        return a.week - b.week || a.day - b.day;
      } else {
        return (b.activityCount || 0) - (a.activityCount || 0);
      }
    });
  }, [transformedActivity, sortBy]);

  // Debug logging for chronological activity
  console.log('TransactionActivity Component - Chronological Activity:', {
    chronologicalActivityLength: chronologicalActivity.length,
    chronologicalActiveDays: chronologicalActivity.filter(cell => cell.activityCount && cell.activityCount > 0).length,
    sampleChronologicalData: chronologicalActivity.filter(cell => cell.activityCount && cell.activityCount > 0).slice(0, 3)
  });

  // Sort transaction activity data for list view
  const sortedTransactionActivity = useMemo(() => {
    if (sortBy === 'date') {
      // Sort by date (week, then day) - this maintains the chronological order
      return [...transactionActivity].sort((a, b) => {
        if (a.week !== b.week) {
          return a.week - b.week;
        }
        return a.day - b.day;
      });
    } else {
      // Sort by activity count (highest first)
      return [...transactionActivity].sort((a, b) => {
        const aCount = a.activityCount || 0;
        const bCount = b.activityCount || 0;
        return bCount - aCount;
      });
    }
  }, [transactionActivity, sortBy]);

  // Get max activity for color scaling
  const maxActivity = useMemo(() => {
    return Math.max(...transformedActivity.map(cell => cell.activityCount || 0));
  }, [transformedActivity]);

  const sortOptions = [
    { value: 'date', label: 'Sort by Date' },
    { value: 'activity', label: 'Sort by Activity' }
  ];

  // Function to get week of year (1-52)


  // Function to get date from week and day
  const getDateFromWeekDay = (week: number, day: number) => {
    // The data from RiskDashboard now uses proper week/day alignment
    // week: 0-51 (52 weeks), day: 0=Monday, 1=Tuesday, ..., 6=Sunday
    
    // Use the selected year from props
    const firstDayOfYear = new Date(selectedYear, 0, 1);
    const dayOfWeek = firstDayOfYear.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // Find the first Monday of the year
    const daysToFirstMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
    const firstMonday = new Date(selectedYear, 0, 1 + daysToFirstMonday);
    
    // Calculate the target date
    const targetDate = new Date(firstMonday);
    targetDate.setDate(firstMonday.getDate() + (week * 7) + day);
    
    return targetDate;
  };

  return (
    <div className="w-full mb-8">
      <div className={`rounded-lg border p-4 ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h5 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Transaction Activity</h5>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-2 text-sm transition-colors ${
                  viewMode === 'heatmap'
                    ? theme === 'dark' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-orange-100 text-orange-700'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm transition-colors ${
                  viewMode === 'list'
                    ? theme === 'dark' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-orange-100 text-orange-700'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showSortDropdown && (
                <div className={`absolute right-0 top-full mt-1 py-2 rounded-lg border shadow-lg z-10 min-w-[160px] ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}>
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value as SortOption);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        sortBy === option.value
                          ? theme === 'dark' 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-orange-100 text-orange-700'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-600'
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {viewMode === 'heatmap' ? (
          <>
            {/* Show loading state */}
            {isLoading ? (
              <div className={`text-center py-12 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div className="mb-4">
                  <div className="w-12 h-12 mx-auto border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                </div>
                <div className="font-medium mb-2">Loading Transaction Activity</div>
                <div>Fetching transaction data for this address...</div>
              </div>
            ) : (
              <>
                {/* Show empty state if no activity data */}
                {chronologicalActivity.filter(cell => cell.activityCount && cell.activityCount > 0).length === 0 ? (
                  <div className={`text-center py-12 text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div className="mb-4">
                      <Calendar className="w-12 h-12 mx-auto opacity-50" />
                    </div>
                    <div className="font-medium mb-2">No Transaction Activity</div>
                    <div>This address has no recorded transaction activity in the past year.</div>
                  </div>
                ) : (
                  <>
                    <div className="w-full overflow-hidden mb-2 flex flex-row items-start">
                      {/* GitHub-style Vertical labels */}
                      <div className="flex flex-col justify-between h-full mr-3 min-w-[32px]">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <span key={day} className={`text-xs h-3 leading-3 my-0.5 flex-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>{day}</span>
                        ))}
                      </div>
                      {/* Heatmap grid - GitHub-style */}
                      <div className="gap-2 w-full min-h-[120px] relative grid grid-cols-[repeat(52,1fr)] grid-rows-[repeat(7,1fr)]">
                        {chronologicalActivity.map((cell, idx) => {
                          const dailyCell = cell as { day: number; week: number; active: boolean; activityCount?: number };
                          const date = getDateFromWeekDay(dailyCell.week, dailyCell.day);
                          const formattedDate = date.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                          const activityCount = dailyCell.activityCount || 0;
                          
                          // Calculate grid position for daily view
                          const gridRow = dailyCell.day + 1;
                          const gridColumn = dailyCell.week + 1;
                          
                          return (
                            <div 
                              key={idx} 
                              className={`w-4 h-4 rounded-sm transition-colors cursor-pointer border ${
                                getActivityColor(activityCount)
                              } ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                              style={{
                                gridRow,
                                gridColumn
                              }}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredCell({
                                  date: formattedDate,
                                  count: activityCount,
                                  x: rect.left + rect.width / 2,
                                  y: rect.top - 10
                                });
                              }}
                              onMouseLeave={() => setHoveredCell(null)}
                            />
                          );
                        })}
                        
                        {/* GitHub-style Tooltip */}
                        {hoveredCell && (
                          <div 
                            className={`fixed z-50 px-3 py-2 text-sm rounded-md shadow-xl border pointer-events-none ${
                              theme === 'dark' 
                                ? 'bg-gray-900 border-gray-700 text-white' 
                                : 'bg-gray-900 border-gray-600 text-white'
                            }`}
                            style={{
                              left: hoveredCell.x,
                              top: hoveredCell.y,
                              transform: 'translateX(-50%) translateY(-100%)'
                            }}
                          >
                            <div className="font-medium text-white">{hoveredCell.date}</div>
                            <div className="text-xs text-gray-300">
                              {hoveredCell.count} transaction{hoveredCell.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          /* List View */
          <div className="max-h-[300px] overflow-y-auto">
            <div className="space-y-2">
              {sortedTransactionActivity
                .filter(cell => cell.activityCount && cell.activityCount > 0)
                .slice(0, 20) // Show top 20 most active days
                .map((cell, idx) => {
                  const date = getDateFromWeekDay(cell.week, cell.day);
                  return (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${getActivityColor(cell.activityCount)}`}></div>
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {date.toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {cell.activityCount} transactions
                      </span>
                    </div>
                  );
                })}
            </div>
            {sortedTransactionActivity.filter(cell => cell.activityCount && cell.activityCount > 0).length === 0 && (
              <div className={`text-center py-8 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No transaction activity found for this address
              </div>
            )}
          </div>
        )}

        {/* GitHub-style Legend */}
        <div className={`flex justify-between items-center text-xs mt-4 w-full ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="flex items-center space-x-2">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-4 h-4 rounded-sm bg-orange-200 border border-gray-200"></div>
              <div className="w-4 h-4 rounded-sm bg-orange-300 border border-gray-200"></div>
              <div className="w-4 h-4 rounded-sm bg-orange-400 border border-gray-200"></div>
              <div className="w-4 h-4 rounded-sm bg-orange-500 border border-gray-200"></div>
              <div className="w-4 h-4 rounded-sm bg-orange-600 border border-gray-200"></div>
            </div>
            <span>More</span>
          </div>
          <div className="text-right">
            <span>Max: {maxActivity} transactions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionActivity; 