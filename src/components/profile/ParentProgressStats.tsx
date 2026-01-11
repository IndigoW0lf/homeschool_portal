'use client';

import { Trophy, Fire, BookOpen, Clock } from '@phosphor-icons/react';
import { ActivityChart } from '@/components/progress';

interface ParentProgressStatsProps {
  kidId: string;
  kidName: string;
  stats: {
    totalMoons: number;
    currentStreak: number;
    bestStreak: number;
    streakEnabled?: boolean;
    subjectCounts: Record<string, number>;
    weeklyActivity: { date: string; count: number }[];
    activityLogStats?: {
      totalMinutes: number;
      totalEntries: number;
      subjectMinutes: Record<string, number>;
      subjectCounts: Record<string, number>;
    };
  };
}

export function ParentProgressStats({ kidId, stats }: ParentProgressStatsProps) {
  const { totalMoons, currentStreak, bestStreak, streakEnabled = true, subjectCounts, weeklyActivity, activityLogStats } = stats;

  
  // Format hours nicely
  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };
  
  const totalLoggedHours = activityLogStats?.totalMinutes || 0;

  const maxActivity = Math.max(...weeklyActivity.map(d => d.count), 5); // Minimum scale of 5

  const subjects = [
    { key: 'reading', label: 'Reading', color: 'bg-amber-400', icon: '📚' },
    { key: 'writing', label: 'Writing', color: 'bg-blue-400', icon: '✏️' },
    { key: 'math', label: 'Math & Logic', color: 'bg-purple-400', icon: '🧮' },
    { key: 'science', label: 'Science', color: 'bg-green-400', icon: '🌱' },
    { key: 'social_studies', label: 'Social Studies', color: 'bg-orange-400', icon: '🌍' },
    { key: 'arts', label: 'Arts', color: 'bg-rose-400', icon: '🎨' },
    { key: 'life_skills', label: 'Life Skills', color: 'bg-pink-400', icon: '🏠' },
    { key: 'electives', label: 'Electives', color: 'bg-teal-400', icon: '✨' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className={`grid ${streakEnabled ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'} gap-4`}>
        {/* Streak - only show if enabled */}
        {streakEnabled && (
          <div className="col-span-2 sm:col-span-2 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50 flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-800/30 rounded-full text-orange-600 dark:text-orange-400">
              <Fire size={24} weight="fill" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Current Streak</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{currentStreak} Days</span>
                {bestStreak > currentStreak && (
                  <span className="text-xs text-gray-500">Best: {bestStreak}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Total Moons */}
        <div className="col-span-1 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-800/30 rounded-full text-indigo-600 dark:text-indigo-400">
            <Trophy size={24} weight="fill" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total Moons</p>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalMoons}</span>
          </div>
        </div>
        
        {/* Logged Hours */}
        {totalLoggedHours > 0 && (
          <div className="col-span-1 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-800/30 rounded-full text-emerald-600 dark:text-emerald-400">
              <Clock size={24} weight="fill" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Logged Hours</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatHours(totalLoggedHours)}</span>
                <span className="text-xs text-gray-500">{activityLogStats?.totalEntries || 0} activities</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart with Time Range Toggle */}
        <ActivityChart kidId={kidId} initialData={weeklyActivity} />

        {/* Subject Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen size={20} className="text-gray-400" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Subject Mastery</h4>
          </div>
          
          <div className="space-y-4">
            {subjects.map(subject => {
              const count = subjectCounts[subject.key] || 0;
              // Simple progress to first badge (25) or next milestone
              const nextMilestone = count < 25 ? 25 : count < 50 ? 50 : count < 75 ? 75 : 100;
              const progress = Math.min((count / nextMilestone) * 100, 100);
              
              return (
                <div key={subject.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span>{subject.icon}</span> {subject.label}
                    </span>
                    <span className="text-gray-500">{count} / {nextMilestone}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${subject.color} transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
