import { createServerClient } from '@/lib/supabase/server';
import { getKidsFromDB } from '@/lib/supabase/data';
import { getStudentProgress, getKidSubjectCounts, getWeeklyActivity } from '@/lib/supabase/progressData';
import { ParentProgressStats } from '@/components/profile/ParentProgressStats';
import { redirect } from 'next/navigation';

export default async function ProgressPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent/login');
  }

  const kids = await getKidsFromDB();

  // Fetch stats for all kids
  const kidStats = await Promise.all(kids.map(async (kid) => {
    const progress = await getStudentProgress(kid.id);
    const subjectCounts = await getKidSubjectCounts(kid.id);
    const weeklyActivity = await getWeeklyActivity(kid.id);
    
    return {
      kid,
      stats: {
        totalStars: progress?.totalStars || 0,
        currentStreak: progress?.currentStreak || 0,
        bestStreak: progress?.bestStreak || 0,
        subjectCounts,
        weeklyActivity,
      }
    };
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Student Progress
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Track daily activity and subject mastery
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {kidStats.map(({ kid, stats }) => (
          <div key={kid.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span className="text-2xl">🎓</span> {kid.name}
              </h2>
            </div>
            <div className="p-6">
              <ParentProgressStats kidId={kid.id} kidName={kid.name} stats={stats} />
            </div>
          </div>
        ))}

        {kidStats.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No students found. Add a kid in Settings to see stats!</p>
          </div>
        )}
      </div>
    </div>
  );
}
