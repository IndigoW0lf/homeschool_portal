'use client';

import { useMemo } from 'react';
import { ChartBar, Check, Clock } from '@phosphor-icons/react';

interface WeeklyProgressChartProps {
  schedule: Array<{
    status: string;
    studentId: string;
    itemType: string;
  }>;
  students: Array<{ id: string; name: string }>;
}

export function WeeklyProgressChart({ schedule, students }: WeeklyProgressChartProps) {
  // Calculate stats per student
  const stats = useMemo(() => {
    const studentStats = students.map(student => {
      const studentItems = schedule.filter(s => s.studentId === student.id);
      const completed = studentItems.filter(s => s.status === 'completed').length;
      const total = studentItems.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        id: student.id,
        name: student.name,
        completed,
        total,
        percentage,
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

      {/* Per-student breakdown */}
      {students.length > 1 && (
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {stats.students.map(student => (
            <div key={student.id} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-16 truncate">
                {student.name}
              </span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${student.percentage}%` }}
                />
              </div>
              <span className="text-xs text-muted w-12 text-right">
                {student.completed}/{student.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
