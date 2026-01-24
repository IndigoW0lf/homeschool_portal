import { createServerClient } from '@/lib/supabase/server';
import { getKidsFromDB } from '@/lib/supabase/data';
import { getStudentProgress, getKidSubjectCounts, getWeeklyActivity, getLifeSkillsCounts, getActivityLogStats, getUnifiedActivities } from '@/lib/supabase/progressData';
import { getExternalCurriculumStats } from '@/app/actions/import';
import { getWorksheetResponsesForKids } from '@/lib/supabase/worksheetData';
import { ParentProgressStats } from '@/components/profile/ParentProgressStats';
import { ImportButton } from '@/components/dashboard/ImportButton';
import { SubjectDonut } from '@/components/dashboard/SubjectDonut';
import { ExternalCurriculumList } from '@/components/dashboard/ExternalCurriculumList';
import { WorksheetResponseViewer } from '@/components/dashboard/WorksheetResponseViewer';
import { LifeSkillsChart } from '@/components/dashboard/LifeSkillsChart';
import { redirect } from 'next/navigation';
import { ChartLineUp, GraduationCap, Notebook, Brain, Book } from '@phosphor-icons/react/dist/ssr';
import { KidProgressSection, UnifiedActivityList, PrintLogGenerator } from '@/components/progress';
import { ActivityLogWrapper } from '@/components/activity';

export default async function ProgressPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent/login');
  }

  const kids = await getKidsFromDB();
  const kidIds = kids.map(k => k.id);

  // Fetch stats for all kids (including activity log entries per kid)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];

  const kidStats = await Promise.all(kids.map(async (kid) => {
    const progress = await getStudentProgress(kid.id);
    const subjectCounts = await getKidSubjectCounts(kid.id);
    const weeklyActivity = await getWeeklyActivity(kid.id);
    const lifeSkillsCounts = await getLifeSkillsCounts(kid.id);
    const activityLogStats = await getActivityLogStats(kid.id);
    // Fetch unified activities from all 3 sources
    const unifiedActivities = await getUnifiedActivities(kid.id, startDate);
    
    // Merge activity log subject counts into subjectCounts
    const mergedSubjectCounts = { ...subjectCounts };
    for (const [key, count] of Object.entries(activityLogStats.subjectCounts)) {
      mergedSubjectCounts[key] = (mergedSubjectCounts[key] || 0) + count;
    }

    return {
      kid,
      stats: {
        totalMoons: progress?.totalStars || 0,
        currentStreak: progress?.currentStreak || 0,
        bestStreak: progress?.bestStreak || 0,
        streakEnabled: kid.streakEnabled ?? true,
        subjectCounts: mergedSubjectCounts,
        weeklyActivity,
        lifeSkillsCounts,
        activityLogStats,
      },
      unifiedActivities
    };
  }));

  // Fetch external curriculum data (per-kid)
  const externalData = await getExternalCurriculumStats(kidIds);
  
  // Fetch worksheet responses for the viewer (per-kid filtering done in component)
  const worksheetResponses = await getWorksheetResponsesForKids(kidIds);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Import Button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="heading-lg flex items-center gap-2">
            <ChartLineUp size={28} weight="duotone" className="text-[var(--ember-500)]" />
            Student Progress
          </h1>
          <p className="text-muted text-sm mt-1">
            Track daily activity and subject mastery across all curricula
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintLogGenerator kids={kids.map(k => ({ id: k.id, name: k.name }))} />
          <ImportButton kids={kids.map(k => ({ id: k.id, name: k.name }))} />
        </div>
      </div>

      {/* Per-Kid Expandable Sections */}
      {kidStats.map(({ kid, stats, unifiedActivities }, index) => {
        const kidExternal = externalData.byKid[kid.id];
        const hasExternalData = kidExternal && kidExternal.stats.totalItems > 0;
        const kidWorksheets = worksheetResponses.filter(w => w.kidId === kid.id);

        return (
          <KidProgressSection 
            key={kid.id}
            kidId={kid.id}
            kidName={kid.name}
            favoriteColor={kid.favoriteColor}
            defaultExpanded={index === 0}
            totalMoons={stats.totalMoons}
            currentStreak={stats.currentStreak}
            streakEnabled={stats.streakEnabled}
          >
            {/* Activity Chart + Subject Mastery */}
            <ParentProgressStats kidId={kid.id} kidName={kid.name} stats={stats} />

            {/* Life Skills Section */}
            {Object.keys(stats.lifeSkillsCounts).length > 0 && (
              <div className="pt-6 border-t" style={{borderColor: 'var(--border)'}}>
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={20} className="text-[var(--nebula-purple)]" />
                  <span className="text-xs px-2 py-1 bg-[var(--nebula-purple)]/10 text-[var(--nebula-purple)] rounded-full font-medium">
                    Life Skills Progress
                  </span>
                </div>
                <LifeSkillsChart 
                  completedItems={Object.entries(stats.lifeSkillsCounts).map(([type, count]) => 
                    Array(count).fill({ type })
                  ).flat()}
                />
              </div>
            )}

            {/* Manual Activity Log + Unified Activity List */}
            <div className="pt-4 border-t" style={{borderColor: 'var(--border)'}}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2 text-sm" style={{color: 'var(--foreground)'}}>
                  <Book size={16} weight="duotone" className="text-[var(--ember-500)]" />
                  Activity Log
                </h4>
                <span className="text-xs text-muted">{unifiedActivities.length} items</span>
              </div>
              
              {/* Manual Activity Form */}
              <div className="mb-4">
                <ActivityLogWrapper kidId={kid.id} kidName={kid.name} />
              </div>
              
              {/* Unified Activity List */}
              <UnifiedActivityList 
                activities={unifiedActivities}
                kidName={kid.name}
                kidId={kid.id}
                itemsPerPage={10}
              />
            </div>

            {/* External Curriculum Section (if data exists) */}
            {hasExternalData && (
              <div className="pt-6 border-t" style={{borderColor: 'var(--border)'}}>
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap size={20} className="text-[var(--celestial-500)]" />
                  <span className="text-xs px-2 py-1 bg-[var(--celestial-500)]/10 text-[var(--celestial-500)] rounded-full font-medium">
                    MiAcademy • {kidExternal.stats.totalItems} items
                  </span>
                  {kidExternal.stats.avgGrade !== null && (
                    <span className={`text-sm font-bold ${kidExternal.stats.avgGrade >= 80 ? 'text-[var(--celestial-500)]' :
                        kidExternal.stats.avgGrade >= 60 ? 'text-[var(--herbal-gold)]' : 'text-[var(--cosmic-rust-500)]'
                      }`}>
                      {kidExternal.stats.avgGrade}% avg
                    </span>
                  )}
                </div>

                {/* Two-column layout: Donut + Performance bars */}
                {kidExternal.stats.subjectAverages.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Subject Distribution Donut */}
                    <div className="bg-[var(--background-secondary)] rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3" style={{color: 'var(--foreground)'}}>Subject Distribution</h4>
                      <SubjectDonut subjects={kidExternal.stats.subjectAverages} />
                    </div>

                    {/* Subject Performance bars */}
                    <div className="bg-[var(--background-secondary)] rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3" style={{color: 'var(--foreground)'}}>Subject Performance</h4>
                      <div className="space-y-2">
                        {kidExternal.stats.subjectAverages.map((subj) => (
                          <div key={subj.subject} className="flex items-center gap-3">
                            <span className="w-28 text-sm text-muted truncate">{subj.subject}</span>
                            <div className="flex-1 h-2.5 bg-[var(--background-elevated)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${subj.average}%`,
                                  backgroundColor: subj.average >= 80 ? 'var(--celestial-500)' :
                                    subj.average >= 60 ? 'var(--herbal-gold)' : 'var(--cosmic-rust-500)'
                                }}
                              />
                            </div>
                            <span className={`text-sm font-medium w-10 text-right ${subj.average >= 80 ? 'text-[var(--celestial-500)]' :
                                subj.average >= 60 ? 'text-[var(--herbal-gold)]' : 'text-[var(--cosmic-rust-500)]'
                              }`}>
                              {subj.average}%
                            </span>
                            <span className="text-xs text-muted w-10">({subj.count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <ExternalCurriculumList
                  items={kidExternal.items}
                  kidName={kid.name}
                />
              </div>
            )}

            {/* Worksheet Responses (per-kid) */}
            {kidWorksheets.length > 0 && (
              <div className="pt-6 border-t" style={{borderColor: 'var(--border)'}}>
                <div className="flex items-center gap-2 mb-4">
                  <Notebook size={20} className="text-[var(--nebula-pink)]" />
                  <span className="text-xs px-2 py-1 bg-[var(--nebula-pink)]/10 text-[var(--nebula-pink)] rounded-full font-medium">
                    Completed Worksheets
                  </span>
                </div>
                <WorksheetResponseViewer responses={kidWorksheets} />
              </div>
            )}
          </KidProgressSection>
        );
      })}

      {kidStats.length === 0 && (
        <div className="text-center py-12 card-elevated border-dashed">
          <p className="text-muted">No students found. Add a kid in Settings to see stats!</p>
        </div>
      )}
    </div>
  );
}
