'use client';

import { startOfWeek, addDays, format, isSameDay } from 'date-fns';
import { CaretLeft, CaretRight, CalendarBlank } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { LunaTriggerButton } from '@/components/luna';
import { Kid, ScheduleDisplayItem } from '@/types';

interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  schedule?: ScheduleDisplayItem[];
  students?: Kid[];
  filterStudentId?: string | null;
  onFilterChange?: (studentId: string | null) => void;
}

export function WeekView({ currentDate, selectedDate, onSelectDate, onPrevWeek, onNextWeek, schedule = [], students = [], filterStudentId, onFilterChange }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekStartDate = format(weekStart, 'yyyy-MM-dd');

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(weekStart, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const items = schedule.filter((s) => s.date === dateStr);

    const lessonCount = items.filter((i) => (i.itemType ?? i.item_type) === 'lesson').length;
    const assignmentCount = items.filter((i) => (i.itemType ?? i.item_type) === 'assignment').length;

    const completedCount = items.filter((i) => i.status === 'completed').length;
    const totalCount = items.length;
    const allComplete = totalCount > 0 && completedCount === totalCount;

    const studentIds = [...new Set(items.map((i) => i.studentId ?? i.student_id).filter(Boolean))];

    return { date: day, dateStr, lessonCount, assignmentCount, total: items.length, studentIds, completedCount, totalCount, allComplete };
  });

  const allPressed = filterStudentId === null ? "true" : "false";
  return (
    <div className="card overflow-hidden pb-4">
      {/* Header */}
      <div className="card-header">
        <h2 className="heading-sm flex items-center gap-2">
          <CalendarBlank weight="duotone" className="text-[var(--ember-gold-400)]" size={24} />
          {format(weekStart, 'MMMM yyyy')}
        </h2>
        
        {/* Student Filter Tabs - centered */}
        {onFilterChange && students.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onFilterChange(null)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                filterStudentId === null
                  ? "bg-[var(--cosmic-rust-500)] text-[var(--foreground)] shadow-sm"
                  : "bg-[var(--background-secondary)] text-muted hover:bg-[var(--hover-overlay)]"
              )}
              aria-label="Show all students"
              aria-pressed={allPressed}
            >
              All
            </button>
            {students.map(s => {
              const studentPressed = filterStudentId === s.id ? "true" : "false";
              return (
              <button
                key={s.id}
                type="button"
                onClick={() => onFilterChange(filterStudentId === s.id ? null : s.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5",
                  filterStudentId === s.id
                    ? "bg-[var(--cosmic-rust-500)] text-[var(--foreground)] shadow-sm"
                    : "bg-[var(--background-secondary)] text-muted hover:bg-[var(--hover-overlay)]"
                )}
                aria-label={filterStudentId === s.id ? `Filter by ${s.name} (selected)` : `Filter by ${s.name}`}
                aria-pressed={studentPressed}
              >
                <StudentAvatar name={s.name} className="w-5 h-5 text-[8px]" />
                {s.name}
              </button>
              );
            })}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <LunaTriggerButton
            context="WEEK_THINK"
            weekStartDate={weekStartDate}
            label="Think with Luna"
            iconOnly
          />
          <button type="button" onClick={onPrevWeek} className="btn-icon-sm" aria-label="Previous week">
            <CaretLeft size={24} weight="duotone" className="text-[var(--celestial-400)]" />
          </button>
          <button type="button" onClick={onNextWeek} className="btn-icon-sm" aria-label="Next week">
            <CaretRight size={24} weight="duotone" className="text-[var(--celestial-400)]" />
          </button>
        </div>
      </div>

      {/* Days Strip */}
      <div className="grid grid-cols-7 divide-x divide-[var(--border)]">
        {weekDays.map((day) => {
          const isSelected = selectedDate && isSameDay(day.date, selectedDate);
          const isToday = isSameDay(day.date, new Date());
          const dayPressed = isSelected ? "true" : "false";

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDate(day.date)}
              className={cn(
                "flex flex-col items-center p-4 hover:bg-[var(--hover-overlay)] transition-colors h-40 relative text-left",
                isSelected ? "bg-[var(--cosmic-rust-100)]" : ""
              )}
              aria-label={`Select ${format(day.date, 'EEEE, MMMM d')}. ${day.lessonCount} lessons, ${day.assignmentCount} assignments.`}
              aria-pressed={dayPressed}
            >
              <span className="text-xs font-medium text-muted uppercase mb-1">{format(day.date, 'EEE')}</span>
              <span className={cn(
                 "text-xl font-bold mb-3 flex items-center justify-center w-8 h-8 rounded-full",
                 isToday ? "bg-[var(--cosmic-rust-500)] text-[var(--foreground)] shadow-md" : "text-heading"
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
                    <div className="badge-celestial text-[10px] w-full truncate text-center">
                       {day.lessonCount} Lesson{day.lessonCount > 1 ? 's' : ''}
                    </div>
                 )}
                 {day.assignmentCount > 0 && (
                    <div className="badge-purple text-[10px] w-full truncate text-center">
                       {day.assignmentCount} Assignment{day.assignmentCount > 1 ? 's' : ''}
                    </div>
                 )}
                 
                 {/* Completion progress indicator */}
                 {day.totalCount > 0 && (
                    <div className={cn(
                       "text-[10px] w-full text-center font-semibold mt-1 py-0.5 rounded",
                       day.allComplete 
                          ? "bg-[var(--success-light)] text-[var(--success-dark)]" 
                          : "bg-[var(--background-secondary)] text-muted"
                    )}>
                       {day.allComplete ? '✓ ' : ''}{day.completedCount}/{day.totalCount} done
                    </div>
                 )}
                 
                 {day.total === 0 && (
                    <div className="text-[10px] text-muted text-center mt-2">Empty</div>
                 )}
              </div>
              
              {isSelected && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-[var(--cosmic-rust-500)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
