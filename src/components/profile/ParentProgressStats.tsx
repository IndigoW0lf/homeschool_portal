'use client';

import { BookOpen } from '@phosphor-icons/react';
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
  const { subjectCounts, weeklyActivity } = stats;

  // 8 subject categories split into 2 columns
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

  // Split into left and right columns
  const leftSubjects = subjects.slice(0, 4);
  const rightSubjects = subjects.slice(4);

  const SubjectItem = ({ subject }: { subject: typeof subjects[0] }) => {
    const count = subjectCounts[subject.key] || 0;
    const nextMilestone = count < 25 ? 25 : count < 50 ? 50 : count < 75 ? 75 : 100;
    const progress = Math.min((count / nextMilestone) * 100, 100);
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span>{subject.icon}</span> {subject.label}
          </span>
          <span className="text-gray-400">{count}/{nextMilestone}</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${subject.color} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Activity Chart - Full Width */}
      <ActivityChart kidId={kidId} initialData={weeklyActivity} />

      {/* Subject Mastery - 2 Column Layout */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-gray-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Subject Mastery</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="space-y-3">
            {leftSubjects.map(subject => (
              <SubjectItem key={subject.key} subject={subject} />
            ))}
          </div>
          <div className="space-y-3">
            {rightSubjects.map(subject => (
              <SubjectItem key={subject.key} subject={subject} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
