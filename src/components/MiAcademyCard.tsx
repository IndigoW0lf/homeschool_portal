'use client';

import { useState, useEffect } from 'react';
import { isDone, setDone } from '@/lib/storage';
import { addStars, isAwarded, markAwarded } from '@/lib/progressState';

interface MiAcademyCardProps {
  kidId: string;
  date: string;
  url: string;
  onDoneChange?: (done: boolean) => void;
}

export function MiAcademyCard({ kidId, date, url, onDoneChange }: MiAcademyCardProps) {
  const [done, setDoneState] = useState(false);
  const itemId = 'miacademy';

  useEffect(() => {
    setDoneState(isDone(kidId, date, itemId));
  }, [kidId, date]);

  const handleToggle = () => {
    const newState = !done;
    setDone(kidId, date, itemId, newState);
    setDoneState(newState);

    // Award star if marking done for first time
    if (newState && !isAwarded(kidId, date, itemId)) {
      addStars(kidId, 1);
      markAwarded(kidId, date, itemId);
    }

    onDoneChange?.(newState);
  };

  return (
    <div 
      id="today-item-miacademy"
      className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              MiAcademy (Daily)
            </h3>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Task 0
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            Complete today&apos;s MiAcademy work.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--ember-500)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Open MiAcademy →
          </a>
        </div>
        <button
          onClick={handleToggle}
          className={`
            flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center
            transition-all
            ${done
              ? 'bg-green-500 border-green-600 dark:border-green-400 text-white'
              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 text-gray-400 dark:text-gray-500'}
          `}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
        >
          {done ? '✓' : ''}
        </button>
      </div>
    </div>
  );
}



