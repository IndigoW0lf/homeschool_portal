'use client';

import { useState } from 'react';
import { Book, Star, Clock, GraduationCap, Sparkle, PencilSimple, CaretDown, CaretUp } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';
import type { UnifiedActivity } from '@/lib/supabase/progressData';

interface UnifiedActivityListProps {
  activities: UnifiedActivity[];
  kidName: string;
  kidId: string;
  maxInitial?: number;
}

// Source badge colors and icons
const SOURCE_STYLES = {
  lunara_quest: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: Sparkle
  },
  miacademy: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: GraduationCap
  },
  manual: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: PencilSimple
  }
};

export function UnifiedActivityList({ 
  activities, 
  maxInitial = 10 
}: UnifiedActivityListProps) {
  const [showAll, setShowAll] = useState(false);
  
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
        <Book size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activities recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dateGroups.map(([dateStr, dayActivities]) => {
        const dateObj = parseISO(dateStr);
        const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy');
        
        return (
          <div key={dateStr} className="space-y-2">
            {/* Date Header */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>📅</span>
              <span>{formattedDate}</span>
              <span className="text-xs opacity-60">({dayActivities.length} item{dayActivities.length !== 1 ? 's' : ''})</span>
            </div>
            
            {/* Activities for this date */}
            <div className="space-y-2 ml-6">
              {dayActivities.map(activity => {
                const style = SOURCE_STYLES[activity.source];
                const Icon = style.icon;
                
                return (
                  <div 
                    key={activity.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700"
                  >
                    {/* Source Icon */}
                    <div className={`p-2 rounded-lg ${style.bg}`}>
                      <Icon size={18} weight="duotone" className={style.text} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                          {activity.sourceLabel}
                        </span>
                        <span>{activity.subject}</span>
                        {activity.type && (
                          <span className="capitalize">• {activity.type}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Score or Duration */}
                    {activity.score !== undefined && activity.score !== null && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star size={14} weight="fill" className="text-yellow-500" />
                        <span className={`font-semibold ${
                          activity.score >= 80 ? 'text-green-600' : 
                          activity.score >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {activity.score}%
                        </span>
                      </div>
                    )}
                    {activity.durationMinutes && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>{activity.durationMinutes}m</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {/* Show More/Less */}
      {activities.length > maxInitial && (
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
