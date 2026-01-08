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
              className="text-gray-200 dark:text-gray-700"
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
              className="text-green-500 transition-all duration-500"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {stats.percentage}%
            </span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <ChartBar size={16} className="text-green-500" />
            This Week
          </div>
          <p className="text-xs text-muted mt-1">
            {stats.completed} of {stats.total} activities complete
          </p>
        </div>
      </div>

      {/* Per-student breakdown with expandable details */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        {stats.students.map(student => (
          <div key={student.id} className="space-y-1">
            {/* Progress bar row - clickable */}
            <button
              onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
              className="w-full flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-1 -ml-1 transition-colors"
            >
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-16 truncate text-left">
                {student.name}
              </span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    student.percentage === 100 ? "bg-green-500" : "bg-yellow-500"
                  )}
                  style={{ width: `${student.percentage}%` }}
                />
              </div>
              <span className={cn(
                "text-xs w-10 text-right font-medium",
                student.percentage === 100 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
              )}>
                {student.completed}/{student.total}
              </span>
              <CaretDown 
                size={14} 
                className={cn(
                  "text-gray-400 transition-transform",
                  expandedStudent === student.id && "rotate-180"
                )} 
              />
            </button>
            
            {/* Expanded: Show all items */}
            {expandedStudent === student.id && student.items.length > 0 && (
              <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 py-1">
                {student.items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2 text-xs py-1 px-2 rounded",
                      item.status === 'completed'
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                    )}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle size={14} weight="fill" className="text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle size={14} weight="duotone" className="text-yellow-500 flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">{item.title || 'Untitled'}</span>
                    <span className="text-gray-400 text-[10px]">{item.date}</span>
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
