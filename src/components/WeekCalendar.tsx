'use client';

import { CalendarEntry } from '@/types';
import { getWeekDates, formatDateString } from '@/lib/dateUtils';
import { useState } from 'react';

interface WeekCalendarProps {
  entries: CalendarEntry[];
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekCalendar({ entries, selectedDate, onDateSelect }: WeekCalendarProps) {
  const [currentWeek] = useState(() => new Date());
  const weekDates = getWeekDates(currentWeek);
  const today = formatDateString(new Date());

  const entriesByDate = entries.reduce((acc, entry) => {
    acc[entry.date] = entry;
    return acc;
  }, {} as Record<string, CalendarEntry>);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">This Week</h3>
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, i) => (
          <div key={day} className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{day}</div>
            <button
              onClick={() => onDateSelect?.(formatDateString(weekDates[i]))}
              className={`
                w-full aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                transition-colors cursor-pointer
                ${formatDateString(weekDates[i]) === today 
                  ? 'bg-blue-500 text-white font-bold' 
                  : formatDateString(weekDates[i]) === selectedDate
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
              `}
            >
              <span>{weekDates[i].getDate()}</span>
              {entriesByDate[formatDateString(weekDates[i])] && (
                <span className="w-2 h-2 bg-green-400 rounded-full mt-1" title="Has assignments" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
