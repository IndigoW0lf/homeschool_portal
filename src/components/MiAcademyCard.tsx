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
      className="card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="heading-sm">
              MiAcademy
            </h3>
            <span className="badge-blue text-xs">
              Task 0
            </span>
          </div>
          <p className="text-muted text-sm mb-3">
            Complete today&apos;s MiAcademy work.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              // Auto-mark as done when clicking the link
              if (!done) {
                setDone(kidId, date, itemId, true);
                setDoneState(true);
                if (!isAwarded(kidId, date, itemId)) {
                  addStars(kidId, 1);
                  markAwarded(kidId, date, itemId);
                }
                onDoneChange?.(true);
              }
            }}
            className="btn-primary text-sm"
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









