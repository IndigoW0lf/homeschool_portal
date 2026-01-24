'use client';

import { useState } from 'react';
import { Star, Clock, GraduationCap, Sparkle, PencilSimple, CaretLeft, CaretRight, Calendar, BookOpenText, ArrowSquareOut, Timer } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';
import type { UnifiedActivity } from '@/lib/supabase/progressData';
import Link from 'next/link';
import { TimeEditModal } from './TimeEditModal';

interface UnifiedActivityListProps {
  activities: UnifiedActivity[];
  kidName: string;
  kidId: string;
  itemsPerPage?: number;
  isPrintView?: boolean;
}

// Source badge colors and icons
const SOURCE_STYLES = {
  lunara_quest: {
    bg: 'bg-[var(--nebula-purple)]/20 dark:bg-[var(--nebula-purple)]/20',
    text: 'text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)]',
    icon: Sparkle,
    label: 'Lunara Quest'
  },
  miacademy: {
    bg: 'bg-[var(--celestial-400)]/20 dark:bg-blue-900/30',
    text: 'text-[var(--celestial-500)] dark:text-blue-400',
    icon: GraduationCap,
    label: 'MiAcademy'
  },
  manual: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: PencilSimple,
    label: 'Manual'
  }
};

// Extract lesson/assignment ID from activity id like "schedule-uuid"
function extractItemId(activityId: string): string | null {
  if (activityId.startsWith('schedule-')) {
    return activityId.replace('schedule-', '').replace('-assign', '');
  }
  return null;
}

export function UnifiedActivityList({ 
  activities, 
  kidId,
  itemsPerPage = 10,
  isPrintView = false
}: UnifiedActivityListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [timeEditActivity, setTimeEditActivity] = useState<UnifiedActivity | null>(null);
  const [localTimes, setLocalTimes] = useState<Record<string, number>>({});
  
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const displayActivities = isPrintView ? activities : activities.slice(startIdx, endIdx);
  
  // Group by date
  const groupedByDate = displayActivities.reduce((acc, activity) => {
    const dateKey = activity.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(activity);
    return acc;
  }, {} as Record<string, UnifiedActivity[]>);
  
  const dateGroups = Object.entries(groupedByDate).sort((a, b) => b[0].localeCompare(a[0]));

  // Get display time for an activity (local update or from data)
  const getDisplayTime = (activity: UnifiedActivity): number | null => {
    if (localTimes[activity.id]) return localTimes[activity.id];
    if (activity.actualMinutes) return activity.actualMinutes;
    if (activity.durationMinutes) return activity.durationMinutes;
    return null;
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        <BookOpenText size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activities recorded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {dateGroups.map(([dateStr, dayActivities]) => {
          const dateObj = parseISO(dateStr);
          const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy');
          
          return (
            <div key={dateStr} className="space-y-2">
              {/* Date Header */}
              <div className="flex items-center gap-2 text-sm text-muted font-medium">
                <Calendar size={16} weight="duotone" className="text-[var(--celestial-400)]" />
                <span>{formattedDate}</span>
                <span className="text-xs opacity-60 font-normal">({dayActivities.length})</span>
              </div>
              
              {/* Activities for this date */}
              <div className="space-y-1.5 ml-6">
                {dayActivities.map(activity => {
                  const style = SOURCE_STYLES[activity.source];
                  const Icon = style.icon;
                  const itemId = extractItemId(activity.id);
                  const isClickableLesson = activity.source === 'lunara_quest' && activity.type === 'lesson' && itemId;
                  const isClickableAssignment = activity.source === 'lunara_quest' && activity.type === 'assignment' && itemId;
                  const isClickable = isClickableLesson || isClickableAssignment;
                  const canEditTime = activity.source === 'lunara_quest' && activity.scheduleItemId;
                  const displayTime = getDisplayTime(activity);
                  const hasActualTime = !!activity.actualMinutes || !!localTimes[activity.id];
                  
                  const content = (
                    <div 
                      className={`flex items-center gap-3 p-2.5 bg-[var(--background-secondary)]/50 rounded-lg border border-[var(--border)] ${
                        isClickable ? 'hover:bg-[var(--hover-overlay)]/50 cursor-pointer transition-colors group' : ''
                      }`}
                    >
                      {/* Source Icon */}
                      <div className={`p-1.5 rounded-lg ${style.bg}`}>
                        <Icon size={16} weight="duotone" className={style.text} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-heading truncate text-sm">
                            {activity.title}
                          </p>
                          {isClickable && (
                            <ArrowSquareOut size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                          <span>{activity.subject}</span>
                        </div>
                      </div>
                      
                      {/* Score (for graded items) */}
                      {activity.score !== undefined && activity.score !== null && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star size={12} weight="fill" className="text-yellow-500" />
                          <span className={`font-semibold text-xs ${
                            activity.score >= 80 ? 'text-green-600' : 
                            activity.score >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {activity.score}%
                          </span>
                        </div>
                      )}
                      
                      {/* Time display + edit button for Lunara Quest items */}
                      {canEditTime && !isPrintView ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTimeEditActivity(activity);
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                            hasActualTime 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                              : 'bg-[var(--background-secondary)] text-muted hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)]'
                          }`}
                          title="Log actual time"
                        >
                          <Timer size={12} weight={hasActualTime ? 'fill' : 'regular'} />
                          <span>{displayTime ? `${displayTime}m` : 'Add time'}</span>
                        </button>
                      ) : displayTime ? (
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <Clock size={12} />
                          <span>{displayTime}m</span>
                        </div>
                      ) : null}
                    </div>
                  );
                  
                  // Wrap in Link if it's a clickable lesson or assignment
                  if (isClickableLesson) {
                    return (
                      <Link 
                        key={activity.id} 
                        href={`/parent/lessons?view=${itemId}`}
                        className="block"
                      >
                        {content}
                      </Link>
                    );
                  }
                  
                  if (isClickableAssignment) {
                    return (
                      <Link 
                        key={activity.id} 
                        href={`/parent/assignments?view=${itemId}`}
                        className="block"
                      >
                        {content}
                      </Link>
                    );
                  }
                  
                  return <div key={activity.id}>{content}</div>;
                })}
              </div>
            </div>
          );
        })}
        
        {/* Pagination */}
        {!isPrintView && totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <span className="text-xs text-muted">
              Showing {startIdx + 1}-{Math.min(endIdx, activities.length)} of {activities.length}
            </span>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-[var(--hover-overlay)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <CaretLeft size={16} />
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and adjacent pages
                  return page === 1 || 
                         page === totalPages || 
                         Math.abs(page - currentPage) <= 1;
                })
                .map((page, idx, arr) => {
                  // Add ellipsis if there's a gap
                  const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                  
                  return (
                    <span key={page} className="flex items-center">
                      {showEllipsisBefore && (
                        <span className="px-1 text-muted">…</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[28px] h-7 px-2 rounded text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-[var(--celestial-500)] text-[var(--foreground)]'
                            : 'hover:bg-[var(--hover-overlay)] text-muted dark:text-muted'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-[var(--hover-overlay)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <CaretRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Time Edit Modal */}
      {timeEditActivity && timeEditActivity.scheduleItemId && (
        <TimeEditModal
          isOpen={true}
          onClose={() => setTimeEditActivity(null)}
          activityTitle={timeEditActivity.title}
          scheduleItemId={timeEditActivity.scheduleItemId}
          estimatedMinutes={timeEditActivity.durationMinutes || undefined}
          currentMinutes={timeEditActivity.actualMinutes || localTimes[timeEditActivity.id] || undefined}
          onSave={(minutes) => {
            setLocalTimes(prev => ({ ...prev, [timeEditActivity.id]: minutes }));
          }}
        />
      )}
    </>
  );
}
