'use client';

import Image from 'next/image';

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
}

export function KidPortalWeekCalendar({ entries, kidId }: KidPortalWeekCalendarProps) {
  // Group entries by date
  const entriesByDate = entries.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  // Generate week dates (Monday to Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date);
  }

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <Image 
        src="/assets/titles/this_week.svg" 
        alt="This Week" 
        width={120} 
        height={30}
        className="h-6 w-auto mb-4 dark:brightness-110"
      />
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDates.map(date => {
          const dateKey = formatDateKey(date);
          const dayItems = entriesByDate[dateKey] || [];
          const isToday = dateKey === formatDateKey(new Date());
          const completedCount = dayItems.filter(i => i.status === 'completed').length;
          const totalCount = dayItems.length;
          
          return (
            <a
              key={dateKey}
              href={`/kids/${kidId}?date=${dateKey}`}
              className={`
                p-2 rounded-lg transition-all
                ${isToday ? 'bg-[var(--ember-100)] border-2 border-[var(--ember-400)]' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold ${isToday ? 'text-[var(--ember-600)]' : 'text-gray-800 dark:text-white'}`}>
                {date.getDate()}
              </div>
              {totalCount > 0 && (
                <div className="text-xs text-gray-400">
                  {completedCount}/{totalCount}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
