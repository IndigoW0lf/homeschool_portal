'use client';

import { useState } from 'react';
import { Book, Star, Clock, GraduationCap, Sparkle, PencilSimple, CaretDown, CaretUp, Calendar, BookOpenText, ArrowSquareOut } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';
import type { UnifiedActivity } from '@/lib/supabase/progressData';
import Link from 'next/link';

interface UnifiedActivityListProps {
  activities: UnifiedActivity[];
  kidName: string;
  kidId: string;
  maxInitial?: number;
  isPrintView?: boolean;
}

// Source badge colors and icons
const SOURCE_STYLES = {
  lunara_quest: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: Sparkle,
    label: 'Lunara Quest'
  },
  miacademy: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
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
  maxInitial = 10,
  isPrintView = false
}: UnifiedActivityListProps) {
  const [showAll, setShowAll] = useState(isPrintView);
  
  const displayActivities = showAll ? activities : activities.slice(0, maxInitial);
  
  // Group by date
  const groupedByDate = displayActivities.reduce((acc, activity) => {
    const dateKey = activity.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(activity);
    return acc;
  }, {} as Record<string, UnifiedActivity[]>);
  
  const dateGroups = Object.entries(groupedByDate).sort((a, b) => b[0].localeCompare(a[0]));

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <BookOpenText size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activities recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dateGroups.map(([dateStr, dayActivities]) => {
        const dateObj = parseISO(dateStr);
        const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy');
        
        return (
          <div key={dateStr} className="space-y-2">
            {/* Date Header */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <Calendar size={16} weight="duotone" className="text-indigo-400" />
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
                
                const content = (
                  <div 
                    className={`flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 ${
                      isClickableLesson ? 'hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group' : ''
                    }`}
                  >
                    {/* Source Icon */}
                    <div className={`p-1.5 rounded-lg ${style.bg}`}>
                      <Icon size={16} weight="duotone" className={style.text} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                          {activity.title}
                        </p>
                        {isClickableLesson && (
                          <ArrowSquareOut size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                        <span>{activity.subject}</span>
                      </div>
                    </div>
                    
                    {/* Score or Duration */}
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
                    {activity.durationMinutes && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{activity.durationMinutes}m</span>
                      </div>
                    )}
                  </div>
                );
                
                // Wrap in Link if it's a clickable lesson
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
                
                return <div key={activity.id}>{content}</div>;
              })}
            </div>
          </div>
        );
      })}
      
      {/* Show More/Less */}
      {!isPrintView && activities.length > maxInitial && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-1 transition-colors"
        >
          {showAll ? (
            <>
              <CaretUp size={16} />
              Show Less
            </>
          ) : (
            <>
              <CaretDown size={16} />
              Show All ({activities.length} items)
            </>
          )}
        </button>
      )}
    </div>
  );
}
