import { createServerClient } from '@/lib/supabase/server';
import { getKidsFromDB } from '@/lib/supabase/data';
import { getStudentProgress, getKidSubjectCounts, getWeeklyActivity } from '@/lib/supabase/progressData';
import { getExternalCurriculumStats } from '@/app/actions/import';
import { ParentProgressStats } from '@/components/profile/ParentProgressStats';
import { ImportButton } from '@/components/dashboard/ImportButton';
import { redirect } from 'next/navigation';
import { GraduationCap, ChartLineUp } from '@phosphor-icons/react/dist/ssr';

export default async function ProgressPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent/login');
  }

  const kids = await getKidsFromDB();
  const kidIds = kids.map(k => k.id);

  // Fetch stats for all kids
  const kidStats = await Promise.all(kids.map(async (kid) => {
    const progress = await getStudentProgress(kid.id);
    const subjectCounts = await getKidSubjectCounts(kid.id);
    const weeklyActivity = await getWeeklyActivity(kid.id);
    
    return {
      kid,
      stats: {
        totalMoons: progress?.totalStars || 0,
        currentStreak: progress?.currentStreak || 0,
        bestStreak: progress?.bestStreak || 0,
        streakEnabled: kid.streakEnabled ?? true,
        subjectCounts,
        weeklyActivity,
      }
    };
  }));

  // Fetch external curriculum data
  const externalData = await getExternalCurriculumStats(kidIds);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Import Button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartLineUp size={28} weight="duotone" className="text-[var(--ember-500)]" />
            Student Progress
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Track daily activity and subject mastery across all curricula
          </p>
        </div>
        <ImportButton kids={kids.map(k => ({ id: k.id, name: k.name }))} />
      </div>

      {/* External Curriculum Summary - Only show if data exists */}
      {externalData.stats && externalData.stats.totalItems > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={24} className="text-indigo-500" />
            <h2 className="font-bold text-gray-900 dark:text-white">External Curriculum Summary</h2>
            <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
              {externalData.stats.totalItems} items imported
            </span>
          </div>
          
          {/* Overall Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{externalData.stats.totalItems}</p>
              <p className="text-xs text-gray-500">Total Items</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {externalData.stats.avgGrade !== null ? `${externalData.stats.avgGrade}%` : '-'}
              </p>
              <p className="text-xs text-gray-500">Avg Grade</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{externalData.stats.gradedItems}</p>
              <p className="text-xs text-gray-500">Graded</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {externalData.stats.subjectAverages.length}
              </p>
              <p className="text-xs text-gray-500">Subjects</p>
            </div>
          </div>

          {/* Subject Breakdown with Grades */}
          {externalData.stats.subjectAverages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Subject Performance</h3>
              <div className="space-y-2">
                {externalData.stats.subjectAverages.map((subj) => (
                  <div key={subj.subject} className="flex items-center gap-3">
                    <span className="w-32 text-sm text-gray-600 dark:text-gray-400 truncate">{subj.subject}</span>
                    <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          subj.average >= 80 ? 'bg-green-500' : 
                          subj.average >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${subj.average}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium w-12 text-right ${
                      subj.average >= 80 ? 'text-green-600 dark:text-green-400' : 
                      subj.average >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {subj.average}%
                    </span>
                    <span className="text-xs text-gray-400 w-12">({subj.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Items */}
          {externalData.items.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {externalData.items.slice(0, 8).map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="text-lg">🏫</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.task_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.course} • {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                    {item.score !== null && (
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        item.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.score}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Per-Kid Progress (Lunara Quest data) */}
      <div className="grid grid-cols-1 gap-8">
        {kidStats.map(({ kid, stats }) => (
          <div key={kid.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span className="text-2xl">🌙</span> {kid.name}
                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                  Lunara Quest
                </span>
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
