import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKidById, getResources, getWeekEntries, getLessonsByIds, getTodayEntry } from '@/lib/content';
import { AssignmentCard, ResourceSection, ThemeCard } from '@/components';
import { KidPortalWeekCalendar } from './KidPortalWeekCalendar';

interface KidPortalPageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function KidPortalPage({ params }: KidPortalPageProps) {
  const { kidId } = await params;
  const kid = getKidById(kidId);
  
  if (!kid) {
    notFound();
  }

  const resources = getResources();
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const todayEntry = getTodayEntry(kidId, today);
  const weekEntries = getWeekEntries(kidId, today);
  
  // Get lessons for today
  const todayLessons = todayEntry ? getLessonsByIds(todayEntry.lessonIds) : [];
  
  // Get all upcoming lessons this week (excluding today if already shown)
  const upcomingEntries = weekEntries.filter(entry => entry.date > todayString);
  const upcomingLessonsMap = new Map<string, { entry: typeof todayEntry; lessons: typeof todayLessons }>();
  
  upcomingEntries.forEach(entry => {
    upcomingLessonsMap.set(entry.date, {
      entry,
      lessons: getLessonsByIds(entry.lessonIds),
    });
  });

  // Format today's date nicely
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Back to Dashboard"
              >
                ← 
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                  Hello, {kid.name}! 👋
                </h1>
                <p className="text-gray-500 dark:text-gray-400">{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        {/* Today's Theme */}
        {todayEntry && (
          <section>
            <ThemeCard theme={todayEntry.theme} />
          </section>
        )}

        {/* Today's Assignments */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            📅 Today
          </h2>
          {todayLessons.length > 0 ? (
            <div className="space-y-4">
              {todayLessons.map(lesson => (
                <AssignmentCard
                  key={lesson.id}
                  lesson={lesson}
                  kidId={kidId}
                  date={todayString}
                  journalPrompt={todayEntry?.journalPrompt}
                  projectPrompt={todayEntry?.projectPrompt}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400">
              No assignments scheduled for today! 🎉
            </div>
          )}
        </section>

        {/* Week Calendar */}
        <section>
          <KidPortalWeekCalendar entries={weekEntries} />
        </section>

        {/* Upcoming Lessons */}
        {upcomingEntries.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              📚 Coming Up This Week
            </h2>
            <div className="space-y-6">
              {upcomingEntries.map(entry => {
                const data = upcomingLessonsMap.get(entry.date);
                if (!data) return null;
                
                const entryDate = new Date(entry.date);
                const dayName = entryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                
                return (
                  <div key={entry.date}>
                    <h3 className="text-md font-medium text-gray-600 dark:text-gray-300 mb-2">
                      {dayName} - {entry.theme}
                    </h3>
                    <div className="space-y-3">
                      {data.lessons.map(lesson => (
                        <AssignmentCard
                          key={lesson.id}
                          lesson={lesson}
                          kidId={kidId}
                          date={entry.date}
                          journalPrompt={entry.journalPrompt}
                          projectPrompt={entry.projectPrompt}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Resources */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            🔗 Resources
          </h2>
          <ResourceSection resources={resources} />
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-6 text-center">
        <Link 
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          ← Back to Dashboard
        </Link>
      </footer>
    </div>
  );
}
