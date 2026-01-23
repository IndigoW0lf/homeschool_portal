'use client';

import { useState, useEffect } from 'react';
import { ChartBar, CalendarBlank } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase/browser';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, isWithinInterval } from 'date-fns';

interface ActivityChartProps {
  kidId: string;
  initialData: { date: string; count: number }[];
}

const TIME_RANGES = [
  { label: '1W', days: 7, description: 'Last 7 Days' },
  { label: '1M', days: 30, description: 'Last Month' },
  { label: '3M', days: 90, description: 'Last 3 Months' },
] as const;

// Convert sparse data to filled date range
function fillDateRange(data: { date: string; count: number }[], days: number): { date: string; count: number }[] {
  const today = new Date();
  const startDate = subDays(today, days);
  const dateMap = new Map(data.map(d => [d.date, d.count]));
  
  const allDays = eachDayOfInterval({ start: startDate, end: today });
  return allDays.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return { date: dateStr, count: dateMap.get(dateStr) || 0 };
  });
}

// Aggregate data into weekly buckets
function aggregateByWeek(data: { date: string; count: number }[]): { weekStart: string; weekEnd: string; count: number; days: number }[] {
  if (data.length === 0) return [];
  
  const firstDate = new Date(data[0].date);
  const lastDate = new Date(data[data.length - 1].date);
  
  const weeks = eachWeekOfInterval({ start: firstDate, end: lastDate }, { weekStartsOn: 1 });
  
  return weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekData = data.filter(d => {
      const date = new Date(d.date);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    });
    
    return {
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      count: weekData.reduce((sum, d) => sum + d.count, 0),
      days: weekData.filter(d => d.count > 0).length
    };
  });
}

export function ActivityChart({ kidId, initialData }: ActivityChartProps) {
  const [selectedRange, setSelectedRange] = useState<7 | 30 | 90>(7);
  const [rawData, setRawData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch new data when range changes
  useEffect(() => {
    if (selectedRange === 7) {
      setRawData(initialData);
      return;
    }

    async function fetchActivityData() {
      setIsLoading(true);
      try {
        // Try new RPC first, fallback to old one
        const { data, error } = await supabase.rpc('get_activity_by_range', {
          p_kid_id: kidId,
          p_days: selectedRange
        });
        
        if (error) {
          console.error('Error fetching activity (RPC may not exist yet):', error);
          // Fallback to old RPC
          const { data: oldData } = await supabase.rpc('get_weekly_activity', {
            p_kid_id: kidId
          });
          setRawData(oldData || []);
          return;
        }
        
        console.log('Activity data received:', data); // Debug
        setRawData(data || []);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivityData();
  }, [kidId, selectedRange, initialData]);

  // Process data based on range
  const filledData = fillDateRange(rawData, selectedRange);
  const weeklyData = selectedRange > 7 ? aggregateByWeek(filledData) : [];
  
  // Use weekly for 1M/3M, daily for 1W
  const displayData = selectedRange === 7 ? filledData : weeklyData;
  const totalActivities = filledData.reduce((sum, d) => sum + d.count, 0);
  const activeDays = filledData.filter(d => d.count > 0).length;
  
  const rangeInfo = TIME_RANGES.find(r => r.days === selectedRange);

  // Calculate max for scaling
  const maxCount = selectedRange === 7 
    ? Math.max(...filledData.map(d => d.count), 1)
    : Math.max(...weeklyData.map(w => w.count), 1);

  return (
    <div className="bg-[var(--background-elevated)] rounded-xl border border-[var(--border)] p-5">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChartBar size={20} className="text-muted" />
          <h4 className="font-semibold text-heading">
            Activity ({rangeInfo?.description})
          </h4>
        </div>
        
        {/* Time Range Toggle */}
        <div className="flex bg-[var(--background-secondary)] rounded-lg p-0.5">
          {TIME_RANGES.map(range => (
            <button
              key={range.days}
              onClick={() => setSelectedRange(range.days as 7 | 30 | 90)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                selectedRange === range.days
                  ? 'bg-white dark:bg-[var(--night-600)] text-heading shadow-sm'
                  : 'text-muted hover:text-heading dark:hover:text-muted'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <CalendarBlank size={16} className="text-indigo-500" />
          <span className="text-muted">{activeDays} active days</span>
        </div>
        <div className="text-sm text-muted">
          <span className="font-semibold text-heading">{totalActivities}</span> total items
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-32">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <span className="text-sm">Loading...</span>
          </div>
        ) : totalActivities === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted">
            <span className="text-3xl mb-2">🌙</span>
            <p className="text-sm">No activity in this period</p>
          </div>
        ) : selectedRange === 7 ? (
          // Daily bars for 1W
          <div className="flex items-end justify-between h-full gap-1">
            {filledData.map((day) => {
              const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              const dateObj = new Date(day.date + 'T12:00:00'); // Avoid timezone issues
              const dayLabel = format(dateObj, 'EEE');
              const isToday = format(new Date(), 'yyyy-MM-dd') === day.date;
              
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1 group">
                  <div className="relative w-full flex justify-center items-end h-24">
                    {/* Tooltip */}
                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--night-900)] text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                      {day.count} items
                    </div>
                    {/* Bar */}
                    <div 
                      className={`w-full max-w-[40px] rounded-t transition-all ${
                        day.count > 0 
                          ? 'bg-indigo-500 dark:bg-indigo-400' 
                          : 'bg-[var(--background-secondary)]'
                      } ${isToday ? 'ring-2 ring-indigo-300' : ''}`}
                      style={{ height: day.count > 0 ? `${Math.max(heightPercent, 8)}%` : '4px' }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted'}`}>
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          // Weekly bars for 1M/3M
          <div className="flex items-end justify-between h-full gap-1 overflow-x-auto">
            {weeklyData.map((week, idx) => {
              const heightPercent = maxCount > 0 ? (week.count / maxCount) * 100 : 0;
              const weekStart = new Date(week.weekStart + 'T12:00:00');
              const weekLabel = format(weekStart, 'MMM d');
              
              return (
                <div key={week.weekStart} className="flex flex-col items-center gap-1 flex-1 min-w-[32px] max-w-[48px] group">
                  <div className="relative w-full flex justify-center items-end h-20">
                    {/* Tooltip */}
                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--night-900)] text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                      {week.count} items • {week.days} days active
                    </div>
                    {/* Bar */}
                    <div 
                      className={`w-full rounded-t transition-all ${
                        week.count > 0 
                          ? 'bg-indigo-500 dark:bg-indigo-400' 
                          : 'bg-[var(--background-secondary)]'
                      }`}
                      style={{ height: week.count > 0 ? `${Math.max(heightPercent, 8)}%` : '4px' }}
                    />
                  </div>
                  {/* Show labels for every 3rd week or first/last */}
                  <span className="text-xs text-muted truncate w-full text-center">
                    {idx === 0 || idx === weeklyData.length - 1 || idx % 3 === 0 ? weekLabel : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
