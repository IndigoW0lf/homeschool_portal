import Link from 'next/link';
import { notFound } from 'next/navigation'; // Added redirect
import { getKidByIdFromDB, getResourcesFromDB, getScheduleItemsForStudent } from '@/lib/supabase/data';
import { formatDateString } from '@/lib/dateUtils';
import { ProgressCard, TodayCompletionSummary, ResourceSection } from '@/components';
import { MiAcademyCardWrapper } from '@/components/MiAcademyCardWrapper';
import { KidPortalWeekCalendar } from './KidPortalWeekCalendar';
import { ScheduleItemsList } from './ScheduleItemsList';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { addWeeks, subWeeks, isSameDay, format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

interface KidPortalPageProps {
  params: Promise<{
    kidId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function KidPortalPage({ params, searchParams }: KidPortalPageProps) {
  const { kidId } = await params;
  const { date } = await searchParams;
  
  const kid = await getKidByIdFromDB(kidId);
  
  if (!kid) {
    notFound();
  }

  // Date Logic
  const today = new Date(); // Real today
  let viewDate = today;
  
  if (date && typeof date === 'string') {
     try {
        viewDate = parseISO(date);
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
     } catch (e) {
        // invalid date, fallback to today
     }
  }

  // If viewDate is invalid or weird, fallback
  if (isNaN(viewDate.getTime())) {
     viewDate = today;
  }

  const viewDateString = formatDateString(viewDate);
  const isViewToday = isSameDay(viewDate, today);

  const resources = await getResourcesFromDB();
  
  // Get week date range
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 }); // Sunday
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  
  // Fetch schedule items for this student within the week
  const weekScheduleItems = await getScheduleItemsForStudent(kidId, weekStartStr, weekEndStr);
  
  // Filter items for "today" (view date)
  const todayItems = weekScheduleItems.filter(item => item.date === viewDateString);
  
  // Filter items for upcoming days (after view date)
  const upcomingItems = weekScheduleItems.filter(item => item.date > viewDateString);

  // Format view date
  const formattedDate = viewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Navigation Handlers
  const prevWeek = format(subWeeks(viewDate, 1), 'yyyy-MM-dd');
  const nextWeek = format(addWeeks(viewDate, 1), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link 
                href="/"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Back to Dashboard"
              >
                ← 
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  Hello, {kid.name}! 👋
                </h1>
                <p className="text-gray-500 dark:text-gray-400 opacity-80">{formattedDate}</p>
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1 self-end sm:self-center">
               <Link href={`/kids/${kidId}?date=${prevWeek}`} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-full transition-colors text-gray-600 dark:text-gray-300">
                  <ChevronLeft size={20} />
               </Link>
               <div className="px-4 text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2 cursor-pointer" title="Jump to Today">
                  <Calendar size={16} />
                  {!isViewToday ? <Link href={`/kids/${kidId}`}>Back to Today</Link> : <span>This Week</span>}
               </div>
               <Link href={`/kids/${kidId}?date=${nextWeek}`} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-full transition-colors text-gray-600 dark:text-gray-300">
                  <ChevronRight size={20} />
               </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        {/* Progress Card */}
        <section>
          {isViewToday && <ProgressCard kidId={kidId} />}
        </section>

        {/* Today's Quests */}
        <section id={`date-${viewDateString}`}>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            {isViewToday ? '📅 Today\'s Quests' : `📅 Quests for ${formattedDate}`}
          </h2>
          
          {/* Today Completion Summary (handles awards) */}
          <TodayCompletionSummary
            kidId={kidId}
            date={viewDateString}
            itemIds={[
              'miacademy',
              ...todayItems.map(item => item.id)
            ]}
          />

          <div className="space-y-4">
            {/* MiAcademy Card (always first) */}
            <MiAcademyCardWrapper kidId={kidId} date={viewDateString} />

            {/* Scheduled Items */}
            {todayItems.length > 0 ? (
              <ScheduleItemsList
                items={todayItems}
                kidId={kidId}
                date={viewDateString}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400">
                No assignments scheduled for today! 🎉
              </div>
            )}
          </div>
        </section>

        {/* Week Calendar */}
        <section>
          <KidPortalWeekCalendar entries={weekScheduleItems} kidId={kidId} />
        </section>

        {/* Upcoming Items */}
        {upcomingItems.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              📚 Coming Up This Week
            </h2>
            <ScheduleItemsList
              items={upcomingItems}
              kidId={kidId}
              date={upcomingItems[0]?.date || viewDateString}
            />
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
