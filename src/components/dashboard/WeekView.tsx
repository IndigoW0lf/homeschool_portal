'use client';

import { startOfWeek, addDays, format, isSameDay } from 'date-fns';
import { CaretLeft, CaretRight, CalendarBlank } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { Kid } from '@/types';

interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  schedule?: any[]; // TODO: Strict type
  students?: Kid[];
}

export function WeekView({ currentDate, selectedDate, onSelectDate, onPrevWeek, onNextWeek, schedule = [], students = [] }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(weekStart, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const items = schedule.filter((s: any) => s.date === dateStr);
    
    // Count types
    const lessonCount = items.filter((i: any) => i.itemType === 'lesson').length;
    const assignmentCount = items.filter((i: any) => i.itemType === 'assignment').length;
    
    // Get unique student IDs for this day
    const studentIds = [...new Set(items.map((i: any) => i.studentId).filter(Boolean))];

    return { date: day, dateStr, lessonCount, assignmentCount, total: items.length, studentIds };
  });

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="card-header">
        <h2 className="heading-sm flex items-center gap-2">
          <CalendarBlank weight="duotone" color="#e7b58d" size={24} />
          {format(weekStart, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button onClick={onPrevWeek} className="btn-icon-sm">
            <CaretLeft size={24} weight="duotone" color="#b6e1d8" />
          </button>
          <button onClick={onNextWeek} className="btn-icon-sm">
            <CaretRight size={24} weight="duotone" color="#b6e1d8" />
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
                "flex flex-col items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors h-40 relative text-left",
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
                 {/* Kid avatars row */}
                 {day.studentIds.length > 0 && (
                    <div className="flex justify-center gap-0.5 mb-1">
                       {day.studentIds.map((studentId: string) => {
                          const student = students.find(s => s.id === studentId);
                          return student ? (
                             <StudentAvatar 
                                key={studentId} 
                                name={student.name} 
                                className="w-6 h-6 text-[8px]" 
                             />
                          ) : null;
                       })}
                    </div>
                 )}
                 
                 {day.lessonCount > 0 && (
                    <div className="badge-blue text-[10px] w-full truncate text-center">
                       {day.lessonCount} Lesson{day.lessonCount > 1 ? 's' : ''}
                    </div>
                 )}
                 {day.assignmentCount > 0 && (
                    <div className="badge-purple text-[10px] w-full truncate text-center">
                       {day.assignmentCount} Assignment{day.assignmentCount > 1 ? 's' : ''}
                    </div>
                 )}
                 {day.total === 0 && (
                    <div className="text-[10px] text-muted text-center mt-2">Empty</div>
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
