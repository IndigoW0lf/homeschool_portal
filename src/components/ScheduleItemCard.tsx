'use client';

import { DoneToggle } from './DoneToggle';
import { cn } from '@/lib/utils';

interface ScheduleItemCardProps {
  item: {
    id: string;
    title: string;
    type: string;
    status: string;
    estimatedMinutes?: number;
  };
  kidId: string;
  date: string;
  onClick?: () => void;
}

export function ScheduleItemCard({ item, kidId, date, onClick }: ScheduleItemCardProps) {
  return (
    <div 
      id={`today-item-${item.id}`}
      onClick={(e) => {
        // Don't trigger if clicking buttons or links
        if ((e.target as HTMLElement).closest('button, a, input, label')) return;
        onClick?.();
      }}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-[var(--ember-200)]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded",
              item.type === 'lesson' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
            )}>
              {item.type}
            </span>
            {item.estimatedMinutes && (
              <span className="text-xs text-gray-400">~{item.estimatedMinutes} min</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-1">
            {item.title}
          </h3>
        </div>
        <DoneToggle
          kidId={kidId}
          lessonId={item.id}
          date={date}
        />
      </div>
    </div>
  );
}
