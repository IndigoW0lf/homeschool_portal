'use client';

import { startOfWeek, addDays, format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
// Remove MOCK_SCHEDULE import

interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  schedule?: any[]; // TODO: Strict type
}

export function WeekView({ currentDate, selectedDate, onSelectDate, onPrevWeek, onNextWeek, schedule = [] }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(weekStart, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const items = schedule.filter((s: any) => s.date === dateStr);
    
    // Count types
    const lessonCount = items.filter((i: any) => i.itemType === 'lesson').length;
    const assignmentCount = items.filter((i: any) => i.itemType === 'assignment').length;

    return { date: day, dateStr, lessonCount, assignmentCount, total: items.length };
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="text-[var(--ember-500)]" size={20} />
          {format(weekStart, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button onClick={onPrevWeek} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronLeft size={20} />
          </button>
          <button onClick={onNextWeek} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Days Strip */}
      <div className="grid grid-cols-7 divide-x divide-gray-100 dark:divide-gray-700">
        {weekDays.map((day) => {
          const isSelected = selectedDate && isSameDay(day.date, selectedDate);
          const isToday = isSameDay(day.date, new Date());

          return (
            <button
              key={day.dateStr}
              onClick={() => onSelectDate(day.date)}
              className={cn(
                "flex flex-col items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors h-32 relative text-left",
                isSelected ? "bg-[var(--ember-50)] dark:bg-[var(--ember-900)/20]" : ""
              )}
            >
              <span className="text-xs font-medium text-gray-400 uppercase mb-1">{format(day.date, 'EEE')}</span>
              <span className={cn(
                 "text-xl font-bold mb-3 flex items-center justify-center w-8 h-8 rounded-full",
                 isToday ? "bg-[var(--ember-500)] text-white shadow-md" : "text-gray-900 dark:text-white"
              )}>
                {format(day.date, 'd')}
              </span>

              {/* Chips */}
              <div className="flex flex-col gap-1 w-full px-1">
                 {day.lessonCount > 0 && (
                    <div className="text-[10px] font-medium px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 w-full truncate text-center">
                       {day.lessonCount} Lesson{day.lessonCount > 1 ? 's' : ''}
                    </div>
                 )}
                 {day.assignmentCount > 0 && (
                    <div className="text-[10px] font-medium px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 w-full truncate text-center">
                       {day.assignmentCount} Assignment{day.assignmentCount > 1 ? 's' : ''}
                    </div>
                 )}
                 {day.total === 0 && (
                    <div className="text-[10px] text-gray-300 dark:text-gray-600 text-center mt-2">Empty</div>
                 )}
              </div>
              
              {isSelected && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-[var(--ember-500)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
