'use client';

import { DoneToggle } from './DoneToggle';
import { useDoneState } from '@/hooks/useDoneState';
import { CalendarDots } from '@phosphor-icons/react';
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
  showDate?: boolean;  // Show the date on the card (for upcoming items)
  readOnly?: boolean;  // Disable auto-check and hide toggle (for preview/upcoming items)
  onClick?: () => void;
}

export function ScheduleItemCard({ item, kidId, date, showDate, readOnly, onClick }: ScheduleItemCardProps) {
  const { done, toggle: markDone } = useDoneState(kidId, date, item.id);
  
  // Format date for display
  const formattedDate = showDate ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }) : null;

  // Auto-mark as done when card is clicked (not just the toggle button)
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking buttons, links, inputs, or labels
    if ((e.target as HTMLElement).closest('button, a, input, label')) return;
    
    // Auto-mark as done if not already done (skip if readOnly)
    if (!done && !readOnly) {
      markDone();
    }
    
    // Open the modal
    onClick?.();
  };

  return (
    <div 
      id={`today-item-${item.id}`}
      onClick={handleCardClick}
      className={cn(
        "bg-[var(--background-elevated)] rounded-xl p-5 shadow-sm border transition-all",
        done 
          ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10" 
          : "border-[var(--border)]",
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
              <span className="text-xs text-muted">~{item.estimatedMinutes} min</span>
            )}
            {formattedDate && (
              <span className="text-xs text-[var(--ember-500)] font-medium flex items-center gap-1">
                <CalendarDots size={14} weight="duotone" />
                {formattedDate}
              </span>
            )}
          </div>
          <h3 className={cn(
            "font-semibold text-lg mb-1",
            done 
              ? "text-green-700 dark:text-green-400" 
              : "text-heading dark:text-white"
          )}>
            {item.title}
          </h3>
        </div>
        {!readOnly && (
          <DoneToggle
            kidId={kidId}
            lessonId={item.id}
            date={date}
          />
        )}
      </div>
    </div>
  );
}
