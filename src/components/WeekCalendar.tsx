'use client';

import { CalendarEntry } from '@/types';
import { getWeekDates, formatDateString } from '@/lib/dateUtils';
import { useState, useMemo } from 'react';

interface WeekCalendarProps {
  entries: CalendarEntry[];
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  kidId?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekCalendar({ entries, selectedDate, onDateSelect, kidId }: WeekCalendarProps) {
  const [currentWeek] = useState(() => new Date());
  const weekDates = getWeekDates(currentWeek);
  const today = useMemo(() => formatDateString(new Date()), []);

  const entriesByDate = entries.reduce((acc, entry) => {
    acc[entry.date] = entry;
    return acc;
  }, {} as Record<string, CalendarEntry>);

  const handleDateClick = (date: Date) => {
    const dateString = formatDateString(date);
    if (onDateSelect) {
      onDateSelect(dateString);
    } else if (kidId) {
      // Scroll to that date's section if it exists
      const element = document.getElementById(`date-${dateString}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="bg-[var(--background-elevated)] rounded-xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-heading dark:text-[var(--foreground)] mb-4">This Week</h3>
      <div className="grid grid-cols-7 gap-2 h-[80px]">
        {DAYS.map((day, i) => {
          const date = weekDates[i];
          const dateString = formatDateString(date);
          const isToday = dateString === today;
          const isSelected = dateString === selectedDate;
          const hasEntries = !!entriesByDate[dateString];
          
          return (
            <div key={day} className="text-center">
              <div className="text-xs text-muted mb-1">{day}</div>
              <button
                onClick={() => handleDateClick(date)}
                className={`
                  w-full aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                  transition-colors cursor-pointer h-[60px]
                  ${isToday 
                    ? 'bg-[var(--celestial-500)] text-[var(--foreground)] font-bold' 
                    : isSelected
                      ? 'bg-[var(--celestial-400)]/20 dark:bg-[var(--celestial-900)]/50 text-[var(--celestial-500)] dark:text-[var(--celestial-300)]'
                      : 'bg-[var(--background-secondary)] text-heading dark:text-muted hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)]'}
                `}
              >
                <span>{date.getDate()}</span>
                {hasEntries && (
                  <span className="w-2 h-2 bg-[var(--herbal-400)] rounded-full mt-1" title="Has assignments" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
