'use client';

import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Example data - to be replaced with real data later
  const events = [
    { date: new Date(), type: 'assignment', count: 2 },
    { date: new Date(new Date().setDate(new Date().getDate() + 2)), type: 'lesson', count: 1 },
    { date: new Date(new Date().setDate(new Date().getDate() - 3)), type: 'resource', count: 3 },
  ];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="text-sm font-medium px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 transition-colors"
          >
            Today
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);
          const dayEvents = events.filter(e => isSameDay(e.date, day));

          return (
            <div 
              key={day.toString()} 
              className={cn(
                "aspect-square p-2 rounded-xl relative border border-transparent transition-all cursor-pointer group",
                isCurrentMonth ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-900/50 text-gray-300 dark:text-gray-600",
                isTodayDate && "ring-2 ring-[var(--ember-500)] ring-offset-2 dark:ring-offset-gray-900",
                !isTodayDate && isCurrentMonth && "hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm"
              )}
            >
              <span className={cn(
                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                isTodayDate ? "bg-[var(--ember-500)] text-white" : "text-gray-700 dark:text-gray-300"
              )}>
                {format(day, 'd')}
              </span>
              
              {/* Event Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {dayEvents.map((evt, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      evt.type === 'assignment' ? 'bg-pink-400' :
                      evt.type === 'lesson' ? 'bg-blue-400' : 'bg-green-400'
                    )} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
