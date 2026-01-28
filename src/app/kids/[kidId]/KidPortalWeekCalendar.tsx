'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { isDone } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { startOfWeek, addDays, format, isSameDay } from 'date-fns';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr';
import { LunaraTitle } from '@/components/ui/LunaraTitle';

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
  viewDate?: Date;
  prevWeekUrl: string;
  nextWeekUrl: string;
  currentWeekUrl: string;
  className?: string;
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

export function KidPortalWeekCalendar({ 
  entries, 
  kidId, 
  viewDate,
  prevWeekUrl,
  nextWeekUrl,
  currentWeekUrl,
  className
}: KidPortalWeekCalendarProps) {
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
  const weekLabel = isCurrentWeek 
    ? 'This Week' 
    : `${format(monday, 'MMM d')} - ${format(addDays(monday, 6), 'MMM d')}`;

  return (
    <div className={cn("bg-[var(--background-elevated)] rounded-xl p-4 shadow-sm", className)}>
      {/* Header with Navigation - Integrated */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <LunaraTitle 
              gradient="gold" 
              size="sm"
            >
              This Week
            </LunaraTitle>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center bg-[var(--background-secondary)] rounded-full p-1 scale-90 sm:scale-100">
            <Link href={prevWeekUrl} className="p-1.5 hover:bg-[var(--background-elevated)] rounded-full transition-colors">
                <CaretLeft size={20} weight="duotone" color="#b6e1d8" />
            </Link>
            <div className="px-3 text-xs sm:text-sm font-medium text-muted flex items-center gap-2 cursor-pointer" title="Jump to Today">
                {!isCurrentWeek ? (
                    <Link href={currentWeekUrl} className="hover:text-[var(--ember-500)] whitespace-nowrap">
                        {weekLabel}
                    </Link>
                ) : (
                    <span className="whitespace-nowrap">{weekLabel}</span>
                )}
            </div>
            <Link href={nextWeekUrl} className="p-1.5 hover:bg-[var(--background-elevated)] rounded-full transition-colors">
                <CaretRight size={20} weight="duotone" color="#b6e1d8" />
            </Link>
        </div>
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
              title={total > 0 ? `${completed}/${total} completed` : 'No assignments'}
              className={cn(
                "p-2 rounded-lg transition-all flex flex-col items-center justify-center min-h-[60px]",
                isViewDate 
                  ? "bg-[var(--ember-100)] border-2 border-[var(--ember-400)] shadow-sm scale-105 z-10" 
                  : isToday
                    ? "bg-[var(--celestial-50)] dark:bg-[var(--celestial-900)]/20 border border-[var(--celestial-200)] dark:border-[var(--celestial-700)]"
                    : "hover:bg-[var(--hover-overlay)]/50",
                allDone && !isViewDate && "bg-[var(--herbal-50)] dark:bg-[var(--herbal-900)]/20 border-[var(--herbal-100)] dark:border-[var(--herbal-800)]/30"
              )}
            >
              <div className="text-[10px] text-muted uppercase tracking-wide">
                {format(date, 'EEE')}
              </div>
              <div className={cn(
                "text-lg font-bold leading-none my-1",
                isViewDate 
                  ? "text-[var(--ember-600)]" 
                  : isToday
                    ? "text-[var(--celestial-500)] dark:text-[var(--celestial-400)]"
                    : allDone 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-[var(--foreground)]"
              )}>
                {date.getDate()}
              </div>
              
              {/* Status Indicator Dots/Check */}
              {allDone ? (
                 <div className="text-[10px] text-green-500 font-bold">✓</div>
              ) : total > 0 ? (
                 <div className="flex gap-0.5 mt-0.5">
                    {/* Small progress dots */}
                    {Array.from({ length: Math.min(total, 3) }).map((_, i) => (
                        <div key={i} className={cn(
                            "w-1 h-1 rounded-full",
                            i < completed 
                                ? "bg-green-400" 
                                : "bg-[var(--moon-200)] dark:bg-[var(--moon-700)]"
                        )} />
                    ))}
                    {total > 3 && <span className="text-[8px] text-muted leading-none">+</span>}
                 </div>
              ) : (
                <div className="h-1.5 w-1.5" /> // Spacer
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
