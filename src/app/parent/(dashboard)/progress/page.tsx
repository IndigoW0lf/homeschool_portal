import { createServerClient } from '@/lib/supabase/server';
import { getKidsFromDB } from '@/lib/supabase/data';
import { getStudentProgress, getKidSubjectCounts, getWeeklyActivity } from '@/lib/supabase/progressData';
import { getExternalCurriculumStats } from '@/app/actions/import';
import { getWorksheetResponsesForKids } from '@/lib/supabase/worksheetData';
import { ParentProgressStats } from '@/components/profile/ParentProgressStats';
import { ImportButton } from '@/components/dashboard/ImportButton';
import { SubjectDonut } from '@/components/dashboard/SubjectDonut';
import { ExternalCurriculumList } from '@/components/dashboard/ExternalCurriculumList';
import { WorksheetResponseViewer } from '@/components/dashboard/WorksheetResponseViewer';
import { redirect } from 'next/navigation';
import { ChartLineUp, GraduationCap, Notebook } from '@phosphor-icons/react/dist/ssr';

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

  // Fetch external curriculum data (per-kid)
  const externalData = await getExternalCurriculumStats(kidIds);
  
  // Fetch worksheet responses for the viewer
  const worksheetResponses = await getWorksheetResponsesForKids(kidIds);

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

      {/* Per-Kid Progress */}
      <div className="grid grid-cols-1 gap-8">
        {kidStats.map(({ kid, stats }) => {
          const kidExternal = externalData.byKid[kid.id];
          const hasExternalData = kidExternal && kidExternal.stats.totalItems > 0;

          return (
            <div key={kid.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Kid Header */}
              <div
                className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                style={{ borderLeftColor: kid.favoriteColor || '#9c8fb8', borderLeftWidth: '4px' }}
              >
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  🌙 {kid.name}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Lunara Quest Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-medium">
                      Lunara Quest
                    </span>
                  </div>
                  <ParentProgressStats kidId={kid.id} kidName={kid.name} stats={stats} />
                </div>

                {/* External Curriculum Section (if data exists) */}
                {hasExternalData && (
                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <GraduationCap size={20} className="text-indigo-500" />
                      <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">
                        MiAcademy • {kidExternal.stats.totalItems} items
                      </span>
                      {kidExternal.stats.avgGrade !== null && (
                        <span className={`text-sm font-bold ${kidExternal.stats.avgGrade >= 80 ? 'text-green-600' :
                            kidExternal.stats.avgGrade >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                          {kidExternal.stats.avgGrade}% avg
                        </span>
                      )}
                    </div>

                    {/* Two-column layout: Donut + Performance bars */}
                    {kidExternal.stats.subjectAverages.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        {/* Subject Distribution Donut */}
                        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Subject Distribution</h4>
                          <SubjectDonut subjects={kidExternal.stats.subjectAverages} />
                        </div>

                        {/* Subject Performance bars */}
                        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Subject Performance</h4>
                          <div className="space-y-2">
                            {kidExternal.stats.subjectAverages.map((subj) => (
                              <div key={subj.subject} className="flex items-center gap-3">
                                <span className="w-28 text-sm text-gray-600 dark:text-gray-400 truncate">{subj.subject}</span>
                                <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${subj.average >= 80 ? 'bg-green-500' :
                                        subj.average >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                    style={{ width: `${subj.average}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-medium w-10 text-right ${subj.average >= 80 ? 'text-green-600 dark:text-green-400' :
                                    subj.average >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                  {subj.average}%
                                </span>
                                <span className="text-xs text-gray-400 w-10">({subj.count})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Activity - Using client component */}
                    <ExternalCurriculumList
                      items={kidExternal.items}
                      kidName={kid.name}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {kidStats.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No students found. Add a kid in Settings to see stats!</p>
          </div>
        )}
      </div>

      {/* Worksheet Responses Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Notebook size={24} weight="duotone" className="text-purple-500" />
          Completed Worksheets
        </h2>
        <WorksheetResponseViewer responses={worksheetResponses} />
      </div>
    </div>
  );
}
