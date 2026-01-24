'use client';

import { useMemo, useState } from 'react';
import { ChartBar, Clock, CaretDown, Circle, CheckCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ScheduleItem {
  id: string;
  status: string;
  studentId: string;
  itemType: string;
  title: string;
  date: string;
}

interface WeeklyProgressChartProps {
  schedule: ScheduleItem[];
  students: Array<{ id: string; name: string }>;
}

export function WeeklyProgressChart({ schedule, students }: WeeklyProgressChartProps) {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  
  // Calculate stats per student
  const stats = useMemo(() => {
    const studentStats = students.map(student => {
      const studentItems = schedule.filter(s => s.studentId === student.id);
      const completed = studentItems.filter(s => s.status === 'completed').length;
      const total = studentItems.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const incomplete = studentItems.filter(s => s.status !== 'completed');
      
      return {
        id: student.id,
        name: student.name,
        completed,
        total,
        percentage,
        incomplete,
        items: studentItems,
      };
    });

    // Overall totals
    const completed = schedule.filter(s => s.status === 'completed').length;
    const total = schedule.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { students: studentStats, completed, total, percentage };
  }, [schedule, students]);

  if (stats.total === 0) {
    return (
      <div className="text-center py-4 text-muted text-sm">
        <Clock size={24} className="mx-auto mb-2 opacity-50" />
        <p>No activities scheduled this week</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-[var(--background-secondary)]"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={`${stats.percentage * 1.76} 176`}
              strokeLinecap="round"
              className="text-[var(--herbal-500)] transition-all duration-500"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-heading">
              {stats.percentage}%
            </span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-medium text-heading">
            <ChartBar size={16} className="text-[var(--herbal-500)]" />
            This Week
          </div>
          <p className="text-xs text-muted mt-1">
            {stats.completed} of {stats.total} activities complete
          </p>
        </div>
      </div>

      {/* Per-student breakdown with expandable details */}
      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
        {stats.students.map(student => (
          <div key={student.id} className="space-y-1">
            {/* Progress bar row - clickable */}
            <button
              onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
              className="w-full flex items-center gap-3 hover:bg-[var(--hover-overlay)] rounded-lg p-1 -ml-1 transition-colors"
            >
              <span className="text-xs font-medium text-muted w-16 truncate text-left">
                {student.name}
              </span>
              <div className="flex-1 h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    student.percentage === 100 ? "bg-[var(--herbal-500)]" : "bg-[var(--ember-400)]"
                  )}
                  style={{ width: `${student.percentage}%` }}
                />
              </div>
              <span className={cn(
                "text-xs w-10 text-right font-medium",
                student.percentage === 100 ? "text-[var(--herbal-500)]" : "text-[var(--ember-400)]"
              )}>
                {student.completed}/{student.total}
              </span>
              <CaretDown 
                size={14} 
                className={cn(
                  "text-muted transition-transform",
                  expandedStudent === student.id && "rotate-180"
                )} 
              />
            </button>
            
            {/* Expanded: Show all items */}
            {expandedStudent === student.id && student.items.length > 0 && (
              <div className="ml-4 pl-4 border-l-2 border-[var(--border)] space-y-1 py-1">
                {student.items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2 text-xs py-1 px-2 rounded",
                      item.status === 'completed'
                        ? "bg-[var(--herbal-100)] text-[var(--herbal-800)]"
                        : "bg-[var(--solar-100)] text-[var(--solar-800)]"
                    )}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle size={14} weight="fill" className="text-[var(--herbal-500)] flex-shrink-0" />
                    ) : (
                      <Circle size={14} weight="duotone" className="text-[var(--ember-500)] flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">{item.title || 'Untitled'}</span>
                    <span className="text-muted text-[10px]">{item.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
