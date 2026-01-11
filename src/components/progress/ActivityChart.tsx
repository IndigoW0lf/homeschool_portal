'use client';

import { useState, useEffect } from 'react';
import { ChartBar } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase/browser';

interface ActivityChartProps {
  kidId: string;
  initialData: { date: string; count: number }[];
}

const TIME_RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
] as const;

export function ActivityChart({ kidId, initialData }: ActivityChartProps) {
  const [selectedRange, setSelectedRange] = useState<7 | 30 | 90>(7);
  const [activityData, setActivityData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch new data when range changes
  useEffect(() => {
    if (selectedRange === 7) {
      // Use initial data for 7 days (already server-fetched)
      setActivityData(initialData);
      return;
    }

    async function fetchActivityData() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_activity_by_range', {
          p_kid_id: kidId,
          p_days: selectedRange
        });
        
        if (error) {
          console.error('Error fetching activity:', error);
          return;
        }
        
        setActivityData(data || []);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivityData();
  }, [kidId, selectedRange, initialData]);

  const maxActivity = Math.max(...activityData.map(d => d.count), 5);
  const rangeLabel = TIME_RANGES.find(r => r.days === selectedRange)?.label || '1W';

  // For longer ranges, show weekly summaries or just dates
  const formatLabel = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return '—';
    
    if (selectedRange === 7) {
      return dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    } else if (selectedRange === 30) {
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    } else {
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    }
  };

  // Limit visible bars for longer ranges
  const visibleData = selectedRange <= 7 
    ? activityData 
    : activityData.slice(-Math.min(activityData.length, 30)); // Show max 30 bars

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ChartBar size={20} className="text-gray-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Activity ({rangeLabel === '1W' ? 'Last 7 Days' : rangeLabel === '1M' ? 'Last Month' : 'Last 3 Months'})
          </h4>
        </div>
        
        {/* Time Range Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {TIME_RANGES.map(range => (
            <button
              key={range.days}
              onClick={() => setSelectedRange(range.days as 7 | 30 | 90)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                selectedRange === range.days
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex items-end justify-between h-40 gap-1 overflow-x-auto">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-sm">Loading...</span>
          </div>
        ) : visibleData.length > 0 && visibleData.some(d => !isNaN(new Date(d.date).getTime())) ? (
          visibleData.map((day) => {
            const heightPercent = (day.count / maxActivity) * 100;
            const label = formatLabel(day.date);
            
            return (
              <div key={day.date || Math.random()} className="flex flex-col items-center gap-2 flex-1 min-w-[12px] group">
                <div className="relative w-full flex justify-center items-end h-full">
                  {/* Tooltip */}
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                    {day.count} items • {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full max-w-[24px] bg-indigo-500 dark:bg-indigo-400 rounded-t-sm hover:opacity-80 transition-all"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                </div>
                {/* Show labels only for 1W, hide for longer ranges */}
                {selectedRange === 7 && (
                  <span className="text-xs text-gray-500 font-medium">{label}</span>
                )}
              </div>
            );
          })
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-3xl mb-2">🌙</span>
            <p className="text-sm">No activity in this period</p>
            <p className="text-xs mt-1 opacity-60">Try selecting a different time range</p>
          </div>
        )}
      </div>
      
      {/* Summary for longer ranges */}
      {selectedRange > 7 && visibleData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
          <span className="text-gray-500">Total activities:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {visibleData.reduce((sum, d) => sum + d.count, 0)}
          </span>
        </div>
      )}
    </div>
  );
}
