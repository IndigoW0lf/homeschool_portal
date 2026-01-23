'use client';

import { 
  BookOpen, 
  Books, 
  PencilSimple, 
  Calculator, 
  Atom, 
  Globe, 
  Palette, 
  House, 
  Sparkle 
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
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
  const subjects: { key: string; label: string; color: string; Icon: Icon }[] = [
    { key: 'reading', label: 'Reading', color: 'bg-amber-400', Icon: Books },
    { key: 'writing', label: 'Writing', color: 'bg-blue-400', Icon: PencilSimple },
    { key: 'math', label: 'Math & Logic', color: 'bg-purple-400', Icon: Calculator },
    { key: 'science', label: 'Science', color: 'bg-green-400', Icon: Atom },
    { key: 'social_studies', label: 'Social Studies', color: 'bg-orange-400', Icon: Globe },
    { key: 'arts', label: 'Arts', color: 'bg-rose-400', Icon: Palette },
    { key: 'life_skills', label: 'Life Skills', color: 'bg-pink-400', Icon: House },
    { key: 'electives', label: 'Electives', color: 'bg-teal-400', Icon: Sparkle },
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
          <span className="font-medium text-heading dark:text-muted flex items-center gap-1.5">
            <subject.Icon size={14} weight="duotone" className="opacity-80" /> {subject.label}
          </span>
          <span className="text-muted">{count}/{nextMilestone}</span>
        </div>
        <div className="h-1.5 bg-[var(--background-secondary)] rounded-full overflow-hidden">
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
      {/* Subject Mastery */}
      <div className="p-4 bg-[var(--background-elevated)] rounded-xl border border-[var(--border)]">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-heading dark:text-white">
          <BookOpen size={16} weight="duotone" /> Subject Mastery
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="space-y-3">
            {leftSubjects.map(s => <SubjectItem key={s.key} subject={s} />)}
          </div>
          <div className="space-y-3">
            {rightSubjects.map(s => <SubjectItem key={s.key} subject={s} />)}
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <ActivityChart initialData={weeklyActivity} kidId={kidId} />
    </div>
  );
}
