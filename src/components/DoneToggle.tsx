'use client';

import { useDoneState } from '@/hooks/useDoneState';

interface DoneToggleProps {
  kidId: string;
  date: string;
  lessonId: string;
}

export function DoneToggle({ kidId, date, lessonId }: DoneToggleProps) {
  const { done, toggle, isLoaded } = useDoneState(kidId, date, lessonId);

  return (
    <button
      onClick={toggle}
      disabled={!isLoaded}
      className={`
        flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center
        transition-all duration-200 cursor-pointer
        ${done 
          ? 'bg-green-500 border-green-500 text-[var(--foreground)] scale-110' 
          : 'bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)] border-[var(--border)] dark:border-[var(--border)] hover:border-green-400 dark:hover:border-green-500'}
        ${!isLoaded ? 'opacity-50' : ''}
      `}
      aria-label={done ? 'Mark as not done' : 'Mark as done'}
    >
      {done ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <div className="w-3 h-3 rounded-full bg-[var(--background-secondary)] dark:bg-[var(--night-600)]" />
      )}
    </button>
  );
}
