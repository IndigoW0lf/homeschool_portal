'use client';

import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import { isDone } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { startOfWeek, addDays, format, isSameDay } from 'date-fns';

interface ScheduleItem {
  id: string;
  date: string;
  title: string;
  type: string;
  status: string;
}

interface KidPortalWeekCalendarProps {
  entries: ScheduleItem[];
  kidId: string;
  viewDate?: Date;  // The date being viewed (defaults to today)
}

// Subscribe to storage changes
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  // Poll for changes since storage events don't fire in same tab
  const interval = setInterval(callback, 500);
  return () => {
    window.removeEventListener('storage', callback);
    clearInterval(interval);
  };
}

export function KidPortalWeekCalendar({ entries, kidId, viewDate }: KidPortalWeekCalendarProps) {
  // Group entries by date
  const entriesByDate = entries.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  // Use viewDate or default to today
  const baseDate = viewDate || new Date();
  const today = new Date();
  
  // Generate week dates (Monday to Sunday) based on viewDate
  const monday = startOfWeek(baseDate, { weekStartsOn: 1 });
  
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(addDays(monday, i));
  }

  const formatDateKey = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // Use sync external store to track completion from localStorage
  const completionSnapshot = useSyncExternalStore(
    subscribe,
    () => {
      // Build a snapshot of completion state for all entries
      if (typeof window === 'undefined') return '{}';
      const snapshot: Record<string, { completed: number; total: number }> = {};
      
      weekDates.forEach(date => {
        const dateKey = formatDateKey(date);
        const dayItems = entriesByDate[dateKey] || [];
        const completedCount = dayItems.filter(item => isDone(kidId, dateKey, item.id)).length;
        snapshot[dateKey] = { completed: completedCount, total: dayItems.length };
      });
      
      return JSON.stringify(snapshot);
    },
    () => '{}' // Server snapshot
  );

  const completionData = JSON.parse(completionSnapshot) as Record<string, { completed: number; total: number }>;

  // Check if we're viewing the current week
  const isCurrentWeek = isSameDay(monday, startOfWeek(today, { weekStartsOn: 1 }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Image 
          src="/assets/titles/this_week.svg" 
          alt="This Week" 
          width={120} 
          height={30}
          className="h-6 w-auto dark:brightness-110"
        />
        {!isCurrentWeek && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {format(monday, 'MMM d')} - {format(addDays(monday, 6), 'MMM d')}
          </span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDates.map(date => {
          const dateKey = formatDateKey(date);
          const isToday = isSameDay(date, today);
          const isViewDate = viewDate && isSameDay(date, viewDate);
          const { completed = 0, total = 0 } = completionData[dateKey] || {};
          const allDone = total > 0 && completed === total;
          
          return (
            <a
              key={dateKey}
              href={`/kids/${kidId}?date=${dateKey}`}
              className={cn(
                "p-2 rounded-lg transition-all",
                isViewDate 
                  ? "bg-[var(--ember-100)] border-2 border-[var(--ember-400)]" 
                  : isToday
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700",
                allDone && !isViewDate && "bg-green-50 dark:bg-green-900/20"
              )}
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {format(date, 'EEE')}
              </div>
              <div className={cn(
                "text-lg font-bold",
                isViewDate 
                  ? "text-[var(--ember-600)]" 
                  : isToday
                    ? "text-blue-600 dark:text-blue-400"
                    : allDone 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-gray-800 dark:text-white"
              )}>
                {date.getDate()}
              </div>
              {total > 0 && (
                <div className={cn(
                  "text-xs font-medium",
                  allDone 
                    ? "text-green-500 dark:text-green-400" 
                    : "text-gray-400"
                )}>
                  {allDone ? '✓' : `${completed}/${total}`}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
