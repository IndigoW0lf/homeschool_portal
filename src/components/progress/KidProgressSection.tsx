'use client';

import { useState, ReactNode } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface KidProgressSectionProps {
  kidId: string;
  kidName: string;
  favoriteColor?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

/**
 * Expandable container for per-kid progress data
 */
export function KidProgressSection({ 
  kidId, 
  kidName, 
  favoriteColor,
  defaultExpanded = false,
  children 
}: KidProgressSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Kid Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        style={{ borderLeftColor: favoriteColor || '#9c8fb8', borderLeftWidth: '4px' }}
      >
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          🌙 {kidName}
        </h2>
        <div className={cn(
          "p-1.5 rounded-full transition-colors",
          isExpanded 
            ? "bg-[var(--ember-100)] dark:bg-[var(--ember-900)]/30 text-[var(--ember-600)]"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500"
        )}>
          {isExpanded ? (
            <CaretUp size={18} weight="bold" />
          ) : (
            <CaretDown size={18} weight="bold" />
          )}
        </div>
      </button>

      {/* Collapsible content */}
      <div className={cn(
        "transition-all duration-300 overflow-hidden",
        isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
