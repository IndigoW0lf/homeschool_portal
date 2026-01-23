'use client';

import { useState, ReactNode } from 'react';
import { CaretDown, CaretUp, Fire, Moon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface KidProgressSectionProps {
  kidId: string;
  kidName: string;
  favoriteColor?: string;
  defaultExpanded?: boolean;
  totalMoons?: number;
  currentStreak?: number;
  streakEnabled?: boolean;
  children: ReactNode;
}

/**
 * Expandable container for per-kid progress data
 * Now shows moons and streak inline in the header
 */
export function KidProgressSection({ 
  kidId, 
  kidName, 
  favoriteColor,
  defaultExpanded = false,
  totalMoons = 0,
  currentStreak = 0,
  streakEnabled = true,
  children 
}: KidProgressSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-[var(--background-elevated)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
      {/* Kid Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background-secondary)]/50 hover:bg-[var(--hover-overlay)]/50 transition-colors"
        style={{ borderLeftColor: favoriteColor || '#9c8fb8', borderLeftWidth: '4px' }}
      >
        <h2 className="text-lg font-bold text-heading dark:text-white flex items-center gap-2">
          🌙 {kidName}
        </h2>
        
        {/* Inline Stats */}
        <div className="flex items-center gap-4">
          {/* Streak */}
          {streakEnabled && currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <Fire size={16} weight="fill" className="text-orange-500" />
              <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{currentStreak}</span>
            </div>
          )}
          
          {/* Moons */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Moon size={16} weight="fill" className="text-indigo-500" />
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{totalMoons}</span>
          </div>
          
          {/* Expand/Collapse */}
          <div className={cn(
            "p-1.5 rounded-full transition-colors",
            isExpanded 
              ? "bg-[var(--ember-100)] dark:bg-[var(--ember-900)]/30 text-[var(--ember-600)]"
              : "bg-[var(--background-secondary)] text-muted"
          )}>
            {isExpanded ? (
              <CaretUp size={18} weight="bold" />
            ) : (
              <CaretDown size={18} weight="bold" />
            )}
          </div>
        </div>
      </button>

      {/* Collapsible content */}
      <div className={cn(
        "transition-all duration-300",
        isExpanded ? "opacity-100" : "max-h-0 overflow-hidden opacity-0"
      )}>
        <div className="p-4 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
